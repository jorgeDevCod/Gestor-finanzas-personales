import type { AppMode, AppView, Category, CategoryKind, DayEntry, Theme } from '../types/finance';
import { isAppMode, isAppView, isCategoryKind, isPaymentType, normalizePaymentType, uid } from '../types/finance';
import { isValidISO } from './dates';
import { cleanName, dedupeCategories, MAX_PER_KIND, seedCategories } from './categories';

/**
 * Persistencia v2 + extensiones (claves nuevas siempre opcionales).
 * Claves: gfp:days-v2, gfp:mode, gfp:salary*, gfp:theme, gfp:initial,
 * gfp:categories (+ flags *-ready). Try/catch en todo acceso.
 */
const K = {
  days: 'gfp:days-v2',
  mode: 'gfp:mode',
  salary: 'gfp:salary',
  salaryBiweekly: 'gfp:salary-biweekly',
  salaryMonthly: 'gfp:salary-monthly',
  salariesReady: 'gfp:salaries-ready',
  theme: 'gfp:theme',
  initial: 'gfp:initial',
  view: 'gfp:view',
  guideSeen: 'gfp:guide-seen',
  categories: 'gfp:categories',
  categoriesReady: 'gfp:categories-ready',
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
  categoryId?: unknown;
}

interface RawDay {
  id?: unknown;
  dateISO?: unknown;
  incomes?: unknown;
  expenses?: unknown;
}

const sanitizeRow = (r: RawRow): { id: string; name: string; amount: string; paymentType: ReturnType<typeof normalizePaymentType>; categoryId?: string } => {
  const base = {
    id: typeof r.id === 'string' && r.id ? r.id : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: typeof r.name === 'string' ? r.name : '',
    amount: typeof r.amount === 'string' || typeof r.amount === 'number' ? String(r.amount) : '',
    paymentType: isPaymentType(r.paymentType) ? r.paymentType : normalizePaymentType(r.paymentType),
  };
  // categoryId es opcional: solo se conserva si es string no vacío. Datos viejos intactos.
  return typeof r.categoryId === 'string' && r.categoryId
    ? { ...base, categoryId: r.categoryId }
    : base;
};

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
 * Migración única: el legacy `gfp:salary` (compartido) se siembra en ambos
 * modos solo si aún no tienen uno propio. Después cada modo es independiente
 * y el reseteo vacía de verdad.
 */
const ensureSalariesMigrated = (): void => {
  if (read(K.salariesReady)) return;
  const legacy = readPositive(K.salary);
  if (legacy > 0) {
    if (!readPositive(K.salaryBiweekly)) write(K.salaryBiweekly, String(legacy));
    if (!readPositive(K.salaryMonthly)) write(K.salaryMonthly, String(legacy));
  }
  write(K.salariesReady, '1');
};

/**
 * Salario del modo indicado (clave propia por modo).
 * 0 = vacío, hay que pedirlo.
 */
export const loadSalaryForMode = (mode: Exclude<AppMode, 'daily'>): number => {
  ensureSalariesMigrated();
  return readPositive(mode === 'biweekly' ? K.salaryBiweekly : K.salaryMonthly);
};

/** Borra el salario propio del modo (vuelve a quedar vacío y lo pedirá). */
export const resetSalaryForMode = (mode: Exclude<AppMode, 'daily'>): void =>
  remove(mode === 'biweekly' ? K.salaryBiweekly : K.salaryMonthly);

/** Saldo inicial de Daily. 0 por defecto (no exige historial previo). */
export const loadInitialBalance = (): number => {
  const v = read(K.initial);
  const n = v === null ? 0 : parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export const saveInitialBalance = (value: number): void => write(K.initial, String(value));

/** Borra el saldo inicial de Daily (vuelve a 0). */
export const resetInitialBalance = (): void => remove(K.initial);

export const loadTheme = (): Theme | null => {
  const v = read(K.theme);
  return v === 'light' || v === 'dark' ? v : null;
};

export const saveTheme = (theme: Theme): void => write(K.theme, theme);

/** Vista activa recordada. Por defecto 'resumen'; inválido → 'resumen'. */
export const loadView = (): AppView => {
  const v = read(K.view);
  return isAppView(v) ? v : 'resumen';
};

export const saveView = (view: AppView): void => write(K.view, view);

/** Guía vista una sola vez (se marca al cerrarla). */
export const hasSeenGuide = (): boolean => read(K.guideSeen) === '1';

export const markGuideSeen = (): void => write(K.guideSeen, '1');

interface RawCategory {
  id?: unknown;
  name?: unknown;
  kind?: unknown;
}

/** Sanea una categoría; null si es irrecuperable (sin id, sin nombre, kind inválido). */
const sanitizeCategory = (c: RawCategory): Category | null => {
  if (typeof c !== 'object' || c === null) return null;
  if (typeof c.id !== 'string' || !c.id) return null;
  if (!isCategoryKind(c.kind)) return null;
  const name = typeof c.name === 'string' ? cleanName(c.name) : '';
  if (!name) return null;
  return { id: c.id, name, kind: c.kind };
};

/** Carga segura: corruptos se descartan, duplicados se colapsan, tope 30/tipo. */
export const loadCategories = (): Category[] => {
  const raw = read(K.categories);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const clean = (parsed as RawCategory[])
      .map(sanitizeCategory)
      .filter((c): c is Category => c !== null);
    const deduped = dedupeCategories(clean);
    const counts = new Map<CategoryKind, number>();
    return deduped.filter((c) => {
      const n = (counts.get(c.kind) ?? 0) + 1;
      counts.set(c.kind, n);
      return n <= MAX_PER_KIND;
    });
  } catch {
    return [];
  }
};

export const saveCategories = (list: Category[]): void =>
  write(K.categories, JSON.stringify(list));

/**
 * Semilla inicial, una sola vez (flag idempotente). Respeta datos previos:
 * si ya hay categorías, no toca nada. Normaliza la semilla por seguridad.
 */
export const seedCategoriesIfNeeded = (): Category[] => {
  const existing = loadCategories();
  if (read(K.categoriesReady) || existing.length > 0) {
    if (!read(K.categoriesReady)) write(K.categoriesReady, '1');
    return existing;
  }
  const seeded = seedCategories(uid);
  saveCategories(seeded);
  write(K.categoriesReady, '1');
  return seeded;
};
