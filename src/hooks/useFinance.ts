import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppMode, DayEntry, RowKind } from '../types/finance';
import { uid } from '../types/finance';
import {
  clearDays,
  loadDays,
  loadMode,
  loadSalary,
  saveDays,
  saveMode,
  saveSalary,
} from '../utils/storage';
import { isFutureISO, isValidISO, todayISO } from '../utils/dates';
import { sumAll } from '../utils/calculations';

export type Notice = { id: string; kind: 'info' | 'error' | 'success'; text: string };

const emptyRow = () => ({ id: uid(), name: '', amount: '', paymentType: '' as const });

/**
 * Estado financiero completo (extraído de App para que sea testeable).
 * Sin procesos huérfanos: cubre onboarding, CRUD días/filas, salario y limpieza.
 */
export const useFinance = (notify: (kind: Notice['kind'], text: string) => void) => {
  const [days, setDays] = useState<DayEntry[]>(loadDays);
  const [appMode, setAppMode] = useState<AppMode | null>(loadMode);
  const [baseSalary, setBaseSalary] = useState<number>(loadSalary);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    saveDays(days);
  }, [days]);

  const totals = useMemo(() => sumAll(days), [days]);
  const isSalaryMode = appMode === 'biweekly' || appMode === 'monthly';

  const confirmMode = useCallback(
    (mode: AppMode, salary: number) => {
      setAppMode(mode);
      setBaseSalary(salary);
      saveMode(mode);
      saveSalary(salary);
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
      const entry: DayEntry = { id: uid(), dateISO: iso, incomes: [emptyRow()], expenses: [emptyRow()] };
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

  const updateItem = useCallback(
    (dayId: string, kind: RowKind, rowId: string, field: 'name' | 'amount' | 'paymentType', value: string): void => {
      setDays((prev) =>
        prev.map((d) =>
          d.id !== dayId
            ? d
            : {
                ...d,
                [kind]: d[kind].map((r) =>
                  r.id !== rowId ? r : { ...r, [field]: value },
                ),
              },
        ),
      );
    },
    [],
  );

  const addRow = useCallback((dayId: string, kind: RowKind): void => {
    setDays((prev) =>
      prev.map((d) => (d.id !== dayId ? d : { ...d, [kind]: [...d[kind], emptyRow()] })),
    );
  }, []);

  const removeRow = useCallback((dayId: string, kind: RowKind, rowId: string): void => {
    setDays((prev) =>
      prev.map((d) => (d.id !== dayId ? d : { ...d, [kind]: d[kind].filter((r) => r.id !== rowId) })),
    );
  }, []);

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
    expandedId,
    totals,
    isSalaryMode,
    confirmMode,
    createDay,
    addToday,
    removeDay,
    toggleExpand,
    updateItem,
    addRow,
    removeRow,
    clearAll,
  };
};
