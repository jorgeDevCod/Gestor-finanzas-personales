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

export interface PeriodBalance {
  /** Salario (quincena/mes) o saldo inicial (daily). Se suma una sola vez. */
  base: number;
  totalIncomes: number;
  totalExpenses: number;
  /** base + ingresos − gastos. */
  available: number;
  /** Para el progreso: gastado vs (base + ingresos). */
  spent: number;
  budget: number;
  percentUsed: number;
  /** null cuando daysRemaining es 0. */
  perDay: number | null;
}

/**
 * Balance de un período a partir de la base + movimientos del período.
 * Puro: no lee storage ni fecha actual.
 */
export const periodBalance = (
  base: number,
  totals: DayTotals,
  daysRemaining: number,
): PeriodBalance => {
  const budget = base + totals.totalIncomes;
  const available = budget - totals.totalExpenses;
  const percentUsed = budget > 0
    ? Math.min(Math.round((totals.totalExpenses / budget) * 100), 100)
    : 0;
  return {
    base,
    totalIncomes: totals.totalIncomes,
    totalExpenses: totals.totalExpenses,
    available,
    spent: totals.totalExpenses,
    budget,
    percentUsed,
    perDay: daysRemaining > 0 ? available / daysRemaining : null,
  };
};

/** Caja personal Daily: saldoInicial + todos los ingresos − todos los gastos. */
export const cashBalance = (initial: number, totals: DayTotals): number =>
  initial + totals.totalIncomes - totals.totalExpenses;
