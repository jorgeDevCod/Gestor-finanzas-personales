import type { DayEntry } from '../types/finance';
import { sumAll } from './calculations';

export interface DashboardMetrics {
  /** Gasto promedio por día transcurrido (0 si no hay días o gastos). */
  avgDailyExpense: number;
  /** Proyección de gasto al cierre si se mantiene el ritmo (null sin base). */
  projectedSpend: number | null;
  /** Días consecutivos con movimientos hasta hoy (0 si hoy no tiene). */
  streakDays: number;
  /** Movimientos en el alcance. */
  movementCount: number;
}

/**
 * Métricas de anticipación, puras y derivadas (nunca se persisten).
 * Seguro con período vacío o elapsedDays 0 (sin división por cero).
 */
export const dashboardMetrics = (
  periodDays: DayEntry[],
  elapsedDays: number,
  totalDays: number,
): DashboardMetrics => {
  const totals = sumAll(periodDays);
  const movementCount = periodDays.reduce((n, d) => n + d.incomes.length + d.expenses.length, 0);
  const avgDailyExpense = elapsedDays > 0 ? totals.totalExpenses / elapsedDays : 0;
  const projectedSpend = elapsedDays > 0 && totalDays > 0 ? avgDailyExpense * totalDays : null;
  return { avgDailyExpense, projectedSpend, streakDays: 0, movementCount };
};

/**
 * Racha de días consecutivos con movimientos hasta hoy (inclusive).
 * `days` no necesita orden; se comparan ISO locales.
 */
export const streakDays = (days: DayEntry[], todayISO: string): number => {
  const withMoves = new Set(
    days
      .filter((d) => d.incomes.length + d.expenses.length > 0)
      .map((d) => d.dateISO),
  );
  let streak = 0;
  let cursor = todayISO;
  while (withMoves.has(cursor)) {
    streak += 1;
    const [y, m, d] = cursor.split('-').map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d) - 86_400_000);
    cursor = `${prev.getUTCFullYear()}-${`${prev.getUTCMonth() + 1}`.padStart(2, '0')}-${`${prev.getUTCDate()}`.padStart(2, '0')}`;
  }
  return streak;
};

/** Fechas distintas con movimientos (base del promedio en Daily). */
export const distinctDates = (days: DayEntry[]): number =>
  new Set(days.filter((d) => d.incomes.length + d.expenses.length > 0).map((d) => d.dateISO)).size;

/** Métricas completas: agrega la racha global al resumen del alcance. */
export const fullDashboard = (
  allDays: DayEntry[],
  periodDays: DayEntry[],
  elapsedDays: number,
  totalDays: number,
  todayISO: string,
): DashboardMetrics => ({
  ...dashboardMetrics(periodDays, elapsedDays, totalDays),
  streakDays: streakDays(allDays, todayISO),
});
