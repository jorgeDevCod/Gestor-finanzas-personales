import type { DayEntry, DayTotals } from '../types/finance';

export const parseAmount = (v: string): number => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/** Única fuente de verdad para totales (antes duplicada en DaySummary). */
export const calculateTotals = (day: Pick<DayEntry, 'incomes' | 'expenses'>): DayTotals => {
  const totalIncomes = day.incomes.reduce((s, r) => s + parseAmount(r.amount), 0);
  const totalExpenses = day.expenses.reduce((s, r) => s + parseAmount(r.amount), 0);
  return { totalIncomes, totalExpenses, netBalance: totalIncomes - totalExpenses };
};

export const sumAll = (days: DayEntry[]): DayTotals => {
  const totalIncomes = days.reduce(
    (s, d) => s + d.incomes.reduce((a, r) => a + parseAmount(r.amount), 0),
    0,
  );
  const totalExpenses = days.reduce(
    (s, d) => s + d.expenses.reduce((a, r) => a + parseAmount(r.amount), 0),
    0,
  );
  return { totalIncomes, totalExpenses, netBalance: totalIncomes - totalExpenses };
};

export const fmtMoney = (n: number): string =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
