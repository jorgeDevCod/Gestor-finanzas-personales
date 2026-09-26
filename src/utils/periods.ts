import type { AppMode, DayEntry } from '../types/finance';

export interface Period {
  mode: AppMode;
  /** YYYY-MM-DD, fecha local sin timezone. */
  startISO: string;
  endISO: string;
  /** Ej. "Hoy", "Quincena 16–30", "Septiembre". */
  label: string;
  /** Ej. "16–30 de septiembre de 2026". */
  range: string;
  totalDays: number;
  elapsedDays: number;
  daysRemaining: number;
}

interface YMD {
  y: number;
  m: number;
  d: number;
}

export const parseISODate = (iso: string): YMD => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};

export const toISODate = (y: number, m: number, d: number): string =>
  `${y}-${`${m}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}`;

export const daysInMonth = (y: number, m: number): number => new Date(y, m, 0).getDate();

const monthName = (y: number, m: number): string =>
  new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long' });

const diffDays = (fromISO: string, toISO: string): number => {
  const a = parseISODate(fromISO);
  const b = parseISODate(toISO);
  const ms = Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
  return Math.round(ms / 86_400_000);
};

const buildPeriod = (mode: AppMode, label: string, startISO: string, endISO: string, todayISO: string): Period => {
  const s = parseISODate(startISO);
  const totalDays = diffDays(startISO, endISO) + 1;
  const elapsedDays = Math.min(Math.max(diffDays(startISO, todayISO) + 1, 0), totalDays);
  return {
    mode,
    startISO,
    endISO,
    label,
    range: `${s.d}–${parseISODate(endISO).d} de ${monthName(s.y, s.m)} de ${s.y}`,
    totalDays,
    elapsedDays,
    daysRemaining: totalDays - elapsedDays,
  };
};

/**
 * Período actual para un modo, dado el hoy local (YYYY-MM-DD).
 * - daily: hoy → hoy.
 * - biweekly: 1→15 o 16→último día del mes.
 * - monthly: 1→último día del mes.
 * Puro, sin timezone (solo aritmética de calendario).
 */
export const getCurrentPeriod = (mode: AppMode, todayISO: string): Period => {
  const { y, m, d } = parseISODate(todayISO);
  const last = daysInMonth(y, m);
  if (mode === 'daily') {
    return buildPeriod(mode, 'Hoy', todayISO, todayISO, todayISO);
  }
  if (mode === 'biweekly') {
    const firstHalf = d <= 15;
    const start = firstHalf ? 1 : 16;
    const end = firstHalf ? Math.min(15, last) : last;
    return buildPeriod(
      mode,
      `Quincena ${start}–${end}`,
      toISODate(y, m, start),
      toISODate(y, m, end),
      todayISO,
    );
  }
  return buildPeriod(
    mode,
    `${monthName(y, m).charAt(0).toUpperCase()}${monthName(y, m).slice(1)}`,
    toISODate(y, m, 1),
    toISODate(y, m, last),
    todayISO,
  );
};

/** Días con movimientos dentro del período (comparación lexicográfica segura). */
export const getDaysInPeriod = (days: DayEntry[], period: Period): DayEntry[] =>
  days.filter((d) => d.dateISO >= period.startISO && d.dateISO <= period.endISO);
