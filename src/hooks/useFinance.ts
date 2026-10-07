import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppMode, Category, CategoryKind, DayEntry, MoneyRow } from '../types/finance';
import { uid } from '../types/finance';
import {
  clearDays,
  loadDays,
  loadInitialBalance,
  loadMode,
  loadSalaryForMode,
  resetInitialBalance,
  resetSalaryForMode,
  saveCategories,
  saveDays,
  saveInitialBalance,
  saveMode,
  saveSalaryForMode,
  seedCategoriesIfNeeded,
} from '../utils/storage';
import { isFutureISO, isValidISO, todayISO } from '../utils/dates';
import { calculateTotals, sumAll } from '../utils/calculations';
import { getCurrentPeriod, getDaysInPeriod } from '../utils/periods';
import {
  addCategory as addCategoryPure,
  countByCategory as countByCategoryPure,
  removeCategory as removeCategoryPure,
  renameCategory as renameCategoryPure,
} from '../utils/categories';
import {
  removeMovement,
  upsertMovement,
  validateMovement,
  type MovementInput,
  type MovementKind,
} from '../utils/movements';

export type Notice = { id: string; kind: 'info' | 'error' | 'success'; text: string };

/**
 * Estado financiero completo.
 * Flujo de registro por modal: saveMovement (crear/editar) + removeRow.
 * Sin filas vacías ni botones "+" que creen cards.
 */
export const useFinance = (notify: (kind: Notice['kind'], text: string) => void) => {
  const [days, setDays] = useState<DayEntry[]>(loadDays);
  const [appMode, setAppMode] = useState<AppMode | null>(loadMode);
  /** Salario del modo actual (cada modo con salario tiene el suyo). */
  const [baseSalary, setBaseSalary] = useState<number>(() => {
    const m = loadMode();
    return m === 'biweekly' || m === 'monthly' ? loadSalaryForMode(m) : 0;
  });
  const [initialBalance, setInitialBalanceState] = useState<number>(loadInitialBalance);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** Categorías (con semilla una sola vez). Los movimientos nunca se tocan al gestionarlas. */
  const [categories, setCategories] = useState<Category[]>(seedCategoriesIfNeeded);

  useEffect(() => {
    saveDays(days);
  }, [days]);

  const totals = useMemo(() => sumAll(days), [days]);
  const isSalaryMode = appMode === 'biweekly' || appMode === 'monthly';

  /** Período actual según modo + hoy. No se persiste (derivado). */
  const period = useMemo(() => getCurrentPeriod(appMode ?? 'daily', todayISO()), [appMode]);
  const periodDays = useMemo(() => getDaysInPeriod(days, period), [days, period]);
  const periodTotals = useMemo(() => sumAll(periodDays), [periodDays]);
  const todayTotals = useMemo(() => {
    const iso = todayISO();
    const found = days.find((d) => d.dateISO === iso);
    return found
      ? calculateTotals(found)
      : { totalIncomes: 0, totalExpenses: 0, netBalance: 0 };
  }, [days]);

  const setInitialBalance = useCallback(
    (value: number): void => {
      setInitialBalanceState(value);
      saveInitialBalance(value);
      notify('success', 'Saldo inicial actualizado.');
    },
    [notify],
  );

  /** Reinicia el monto base del modo actual (salario o saldo inicial) a cero. */
  const resetBase = useCallback((): void => {
    if (appMode === 'daily') {
      setInitialBalanceState(0);
      resetInitialBalance();
      notify('info', 'Saldo inicial reiniciado a $0.');
    } else if (appMode === 'biweekly' || appMode === 'monthly') {
      resetSalaryForMode(appMode);
      setBaseSalary(0);
      notify('info', 'Salario reiniciado. Se pedirá de nuevo al entrar al modo.');
    }
  }, [appMode, notify]);

  const confirmMode = useCallback(
    (mode: AppMode, salary: number) => {
      setAppMode(mode);
      saveMode(mode);
      // Daily conserva el salario guardado; salary-modes lo actualizan si es válido.
      setBaseSalary(saveSalaryForMode(mode, salary));
      notify('success', mode === 'daily' ? 'Modo diario activado.' : `Modo ${mode === 'biweekly' ? 'quincenal' : 'mensual'} activado.`);
    },
    [notify],
  );

  const sortDays = (list: DayEntry[]): DayEntry[] =>
    [...list].sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));

  const createDay = useCallback(
    (iso: string): string | null => {
      if (!isValidISO(iso)) {
        notify('error', 'Fecha no válida.');
        return null;
      }
      if (isFutureISO(iso)) {
        notify('error', 'No puedes agregar una fecha futura.');
        return null;
      }
      if (days.some((d) => d.dateISO === iso)) {
        notify('error', 'Ya existe un registro para esta fecha.');
        return null;
      }
      const entry: DayEntry = { id: uid(), dateISO: iso, incomes: [], expenses: [] };
      setDays((prev) => sortDays([...prev, entry]));
      setExpandedId(entry.id);
      notify('success', 'Día agregado.');
      return entry.id;
    },
    [days, notify],
  );

  const addToday = useCallback((): void => {
    const iso = todayISO();
    const found = days.find((d) => d.dateISO === iso);
    if (found) {
      setExpandedId(found.id);
      notify('info', 'Hoy ya tiene registro: se abrió para gestionar.');
      return;
    }
    createDay(iso);
  }, [createDay, days, notify]);

  const removeDay = useCallback(
    (id: string): void => {
      setDays((prev) => prev.filter((d) => d.id !== id));
      setExpandedId((cur) => (cur === id ? null : cur));
      notify('info', 'Día eliminado.');
    },
    [notify],
  );

  const toggleExpand = useCallback((id: string): void => {
    setExpandedId((cur) => (cur === id ? null : id));
  }, []);

  /** Crea o edita (si rowId existe) un movimiento validado. Devuelve true si guardó. */
  const saveMovement = useCallback(
    (dayId: string, kind: MovementKind, input: MovementInput, rowId?: string): boolean => {
      const error = validateMovement(input);
      if (error) {
        notify('error', error);
        return false;
      }
      const n = parseFloat(input.amount);
      const row: MoneyRow = {
        id: rowId ?? uid(),
        name: input.name.trim(),
        amount: String(n),
        paymentType: input.paymentType,
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      };
      setDays((prev) =>
        prev.map((d) => (d.id !== dayId ? d : upsertMovement(d, kind, row))),
      );
      notify(
        'success',
        rowId
          ? 'Movimiento actualizado.'
          : kind === 'income'
            ? 'Entrada registrada.'
            : 'Gasto registrado.',
      );
      return true;
    },
    [notify],
  );

  const removeRow = useCallback(
    (dayId: string, kind: MovementKind, rowId: string): void => {
      setDays((prev) =>
        prev.map((d) => (d.id !== dayId ? d : removeMovement(d, kind, rowId))),
      );
      notify('info', 'Movimiento eliminado.');
    },
    [notify],
  );

  const clearAll = useCallback((): void => {
    setDays([]);
    clearDays();
    setExpandedId(null);
    notify('info', 'Registros borrados. Modo y salario conservados.');
  }, [notify]);

  /** Todos los movimientos (ambos grupos, todos los días) para conteos. */
  const allMovements = useMemo(
    () => days.flatMap((d) => [...d.incomes, ...d.expenses]),
    [days],
  );

  const countMovementsWithCategory = useCallback(
    (id: string): number => countByCategoryPure(allMovements, id),
    [allMovements],
  );

  /**
   * Crea (o reutiliza si ya existe en el tipo) y persiste.
   * Retorna la categoría para dejarla seleccionada, o null si se rechazó.
   */
  const addCategory = useCallback(
    (kind: CategoryKind, rawName: string): Category | null => {
      const res = addCategoryPure(categories, kind, rawName, uid());
      if (!res.created && res.category) {
        notify('info', 'Ya existía, la seleccioné.');
        return res.category;
      }
      if (!res.category) {
        notify('error', res.reason === 'limit' ? 'Máximo 30 categorías por tipo.' : 'Escribe un nombre para la categoría.');
        return null;
      }
      setCategories(res.list);
      saveCategories(res.list);
      notify('success', `Categoría "${res.category.name}" creada.`);
      return res.category;
    },
    [categories, notify],
  );

  const renameCategory = useCallback(
    (id: string, rawName: string): boolean => {
      const res = renameCategoryPure(categories, id, rawName);
      if (!res.ok) {
        notify(
          'error',
          res.reason === 'duplicate'
            ? 'Ya existe otra categoría con ese nombre.'
            : res.reason === 'empty'
              ? 'Escribe un nombre para la categoría.'
              : 'Categoría no encontrada.',
        );
        return false;
      }
      setCategories(res.list);
      saveCategories(res.list);
      notify('success', 'Categoría actualizada.');
      return true;
    },
    [categories, notify],
  );

  /**
   * Elimina la categoría. NUNCA borra movimientos: quedan como "Sin categoría".
   * Retorna cuántos movimientos apuntaban a ella (para el diálogo previo).
   */
  const removeCategory = useCallback(
    (id: string): number => {
      const affected = countByCategoryPure(allMovements, id);
      const res = removeCategoryPure(categories, id);
      if (!res.removed) {
        notify('error', 'Categoría no encontrada.');
        return 0;
      }
      setCategories(res.list);
      saveCategories(res.list);
      notify(
        'success',
        affected > 0
          ? `Categoría eliminada. ${affected} ${affected === 1 ? 'movimiento quedó' : 'movimientos quedaron'} sin categoría.`
          : 'Categoría eliminada.',
      );
      return affected;
    },
    [allMovements, categories, notify],
  );

  return {
    days,
    appMode,
    baseSalary,
    initialBalance,
    expandedId,
    totals,
    period,
    periodDays,
    periodTotals,
    todayTotals,
    isSalaryMode,
    confirmMode,
    setInitialBalance,
    resetBase,
    createDay,
    addToday,
    removeDay,
    toggleExpand,
    saveMovement,
    removeRow,
    clearAll,
    categories,
    addCategory,
    renameCategory,
    removeCategory,
    countMovementsWithCategory,
  };
};
