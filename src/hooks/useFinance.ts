import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppMode, DayEntry } from '../types/finance';
import { uid } from '../types/finance';
import {
  clearDays,
  loadDays,
  loadInitialBalance,
  loadMode,
  loadSalaryForMode,
  saveDays,
  saveInitialBalance,
  saveMode,
  saveSalaryForMode,
} from '../utils/storage';
import { isFutureISO, isValidISO, todayISO } from '../utils/dates';
import { calculateTotals, sumAll } from '../utils/calculations';
import { getCurrentPeriod, getDaysInPeriod } from '../utils/periods';
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
    (iso: string): boolean => {
      if (!isValidISO(iso)) {
        notify('error', 'Fecha no válida.');
        return false;
      }
      if (isFutureISO(iso)) {
        notify('error', 'No puedes agregar una fecha futura.');
        return false;
      }
      if (days.some((d) => d.dateISO === iso)) {
        notify('error', 'Ya existe un registro para esta fecha.');
        return false;
      }
      const entry: DayEntry = { id: uid(), dateISO: iso, incomes: [], expenses: [] };
      setDays((prev) => sortDays([...prev, entry]));
      setExpandedId(entry.id);
      notify('success', 'Día agregado.');
      return true;
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
      const row = {
        id: rowId ?? uid(),
        name: input.name.trim(),
        amount: String(n),
        paymentType: input.paymentType,
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
    createDay,
    addToday,
    removeDay,
    toggleExpand,
    saveMovement,
    removeRow,
    clearAll,
  };
};
