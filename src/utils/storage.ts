import type { AppMode, DayEntry, Theme } from '../types/finance';
import { isAppMode, isPaymentType, normalizePaymentType } from '../types/finance';
import { isValidISO } from './dates';

/**
 * Persistencia v2 (limpia, sin migración legacy).
 * Claves: gfp:days-v2, gfp:mode, gfp:salary, gfp:theme.
 */
const K = {
  days: 'gfp:days-v2',
  mode: 'gfp:mode',
  salary: 'gfp:salary',
  salaryBiweekly: 'gfp:salary-biweekly',
  salaryMonthly: 'gfp:salary-monthly',
  theme: 'gfp:theme',
  initial: 'gfp:initial',
} as const;

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* almacenamiento lleno o bloqueado: no rompe la app */
  }
};

const remove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
};

interface RawRow {
  id?: unknown;
  name?: unknown;
  amount?: unknown;
  paymentType?: unknown;
}

interface RawDay {
  id?: unknown;
  dateISO?: unknown;
  incomes?: unknown;
  expenses?: unknown;
}

const sanitizeRow = (r: RawRow): { id: string; name: string; amount: string; paymentType: ReturnType<typeof normalizePaymentType> } => ({
  id: typeof r.id === 'string' && r.id ? r.id : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: typeof r.name === 'string' ? r.name : '',
  amount: typeof r.amount === 'string' || typeof r.amount === 'number' ? String(r.amount) : '',
  paymentType: isPaymentType(r.paymentType) ? r.paymentType : normalizePaymentType(r.paymentType),
});

const sanitizeDay = (d: RawDay): DayEntry | null => {
  if (typeof d !== 'object' || d === null) return null;
  if (typeof d.dateISO !== 'string' || !isValidISO(d.dateISO)) return null;
  return {
    id: typeof d.id === 'string' && d.id ? d.id : `${d.dateISO}-${Math.random().toString(36).slice(2)}`,
    dateISO: d.dateISO,
    incomes: Array.isArray(d.incomes) ? d.incomes.map(sanitizeRow) : [],
    expenses: Array.isArray(d.expenses) ? d.expenses.map(sanitizeRow) : [],
  };
};

export const loadDays = (): DayEntry[] => {
  const raw = read(K.days);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as RawDay[])
      .map(sanitizeDay)
      .filter((d): d is DayEntry => d !== null)
      .sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));
  } catch {
    return [];
  }
};

export const saveDays = (days: DayEntry[]): void => write(K.days, JSON.stringify(days));

export const clearDays = (): void => remove(K.days);

export const loadMode = (): AppMode | null => {
  const v = read(K.mode);
  return isAppMode(v) ? v : null;
};

export const saveMode = (mode: AppMode): void => write(K.mode, mode);

export const loadSalary = (): number => {
  const v = read(K.salary);
  const n = v === null ? 0 : parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const saveSalary = (salary: number): void => write(K.salary, String(salary));

/**
 * Guarda el salario solo si el modo lo usa y el valor es válido.
 * Cada modo con salario tiene su propia clave: no se entreveran.
 * Daily nunca borra nada. Devuelve el salario efectivo.
 */
export const saveSalaryForMode = (mode: AppMode, salary: number): number => {
  if (mode !== 'daily' && Number.isFinite(salary) && salary > 0) {
    write(mode === 'biweekly' ? K.salaryBiweekly : K.salaryMonthly, String(salary));
    return salary;
  }
  return mode === 'daily' ? loadSalary() : loadSalaryForMode(mode);
};

const readPositive = (key: string): number => {
  const n = parseFloat(read(key) ?? '');
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Salario del modo indicado. Si aún no tiene uno propio, hereda el
 * legacy `gfp:salary` (migración sin volver a pedir). 0 = vacío, hay que pedirlo.
 */
export const loadSalaryForMode = (mode: Exclude<AppMode, 'daily'>): number =>
  readPositive(mode === 'biweekly' ? K.salaryBiweekly : K.salaryMonthly) || loadSalary();

/** Saldo inicial de Daily. 0 por defecto (no exige historial previo). */
export const loadInitialBalance = (): number => {
  const v = read(K.initial);
  const n = v === null ? 0 : parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export const saveInitialBalance = (value: number): void => write(K.initial, String(value));

export const loadTheme = (): Theme | null => {
  const v = read(K.theme);
  return v === 'light' || v === 'dark' ? v : null;
};

export const saveTheme = (theme: Theme): void => write(K.theme, theme);
