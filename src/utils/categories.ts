import type { Category, CategoryKind } from '../types/finance';

/** Tope de categorías por tipo (gasto / ingreso por separado). */
export const MAX_PER_KIND = 30;

/** Longitud máxima visible del nombre (se trunca, no se rechaza). */
export const MAX_NAME_LENGTH = 24;

export const SEED_EXPENSES: readonly string[] = [
  'Comida',
  'Transporte',
  'Servicios',
  'Hogar',
  'Salud',
  'Ocio',
];

export const SEED_INCOMES: readonly string[] = ['Sueldo', 'Extra'];

export interface CategorySummaryItem {
  /** null = "Sin categoría" (ausente o huérfano). */
  id: string | null;
  name: string;
  total: number;
  /** Décimas de punto; suman exactamente 100.0. */
  pct: number;
}

export interface AddCategoryResult {
  list: Category[];
  /** null cuando se rechaza (vacío o tope). */
  category: Category | null;
  /** false = se reutilizó la existente (mismo id). */
  created: boolean;
  reason?: 'empty' | 'limit';
}

export interface RenameCategoryResult {
  list: Category[];
  ok: boolean;
  reason?: 'empty' | 'duplicate' | 'not-found';
}

/**
 * Clave de unicidad: sin tildes, minúsculas, trim, espacios colapsados.
 * "  Comída " → "comida". "COMIDA" → "comida".
 */
export const normalizeKey = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

/** Nombre visible: trim, espacios colapsados, máximo 24 caracteres. */
export const cleanName = (s: string): string =>
  s.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);

const keyOf = (kind: CategoryKind, key: string): string => `${kind}:${key}`;

/** Semilla inicial (una sola vez, vía flag). Ids frescos del llamador. */
export const seedCategories = (makeId: () => string): Category[] => [
  ...SEED_EXPENSES.map((name) => ({ id: makeId(), name, kind: 'expense' as const })),
  ...SEED_INCOMES.map((name) => ({ id: makeId(), name, kind: 'income' as const })),
];

/**
 * Crea o reutiliza una categoría del tipo indicado.
 * - Vacío (tras limpiar) → rechaza con reason 'empty'.
 * - Duplicado en el tipo (normalizeKey) → reutiliza, created: false.
 * - Tope 30/tipo → rechaza con reason 'limit'.
 * La unicidad es SOLO por tipo: "Sueldo" puede existir en gasto e ingreso.
 */
export const addCategory = (
  list: readonly Category[],
  kind: CategoryKind,
  rawName: string,
  newId: string,
): AddCategoryResult => {
  const name = cleanName(rawName);
  if (!name) return { list: [...list], category: null, created: false, reason: 'empty' };
  const key = normalizeKey(name);
  const existing = list.find((c) => c.kind === kind && normalizeKey(c.name) === key);
  if (existing) return { list: [...list], category: existing, created: false };
  if (list.filter((c) => c.kind === kind).length >= MAX_PER_KIND) {
    return { list: [...list], category: null, created: false, reason: 'limit' };
  }
  const category: Category = { id: newId, name, kind };
  return { list: [...list, category], category, created: true };
};

/**
 * Renombra. Rechaza vacío, duplicado con OTRA del mismo tipo e id inexistente.
 * Renombrar al mismo nombre (propio id) es ok:true sin cambios.
 */
export const renameCategory = (
  list: readonly Category[],
  id: string,
  rawName: string,
): RenameCategoryResult => {
  const target = list.find((c) => c.id === id);
  if (!target) return { list: [...list], ok: false, reason: 'not-found' };
  const name = cleanName(rawName);
  if (!name) return { list: [...list], ok: false, reason: 'empty' };
  const key = normalizeKey(name);
  const clash = list.find((c) => c.id !== id && c.kind === target.kind && normalizeKey(c.name) === key);
  if (clash) return { list: [...list], ok: false, reason: 'duplicate' };
  return {
    list: list.map((c) => (c.id === id ? { ...c, name } : c)),
    ok: true,
  };
};

/**
 * Elimina de la lista. Los movimientos NO se tocan: su categoryId queda
 * huérfano y `resolveCategory` lo trata como "Sin categoría".
 */
export const removeCategory = (
  list: readonly Category[],
  id: string,
): { list: Category[]; removed: boolean } => {
  if (!list.some((c) => c.id === id)) return { list: [...list], removed: false };
  return { list: list.filter((c) => c.id !== id), removed: true };
};

/** Resuelve o null (= "Sin categoría"): ausente, vacío o inexistente. Sin migrar. */
export const resolveCategory = (
  list: readonly Category[],
  id?: string,
): Category | null => {
  if (!id) return null;
  return list.find((c) => c.id === id) ?? null;
};

/** Cuenta movimientos (cualquier grupo) que apuntan a la categoría. */
export const countByCategory = (
  rows: readonly { categoryId?: string }[],
  id: string,
): number => rows.filter((r) => r.categoryId === id).length;

/**
 * Resume montos por categoría, de mayor a menor, con "Sin categoría" (id null)
 * cuando aplique. Porcentajes en décimas con largest-remainder: suman 100.0.
 * Sin montos > 0 → []. El llamador decide el alcance (período, día, hoy).
 */
export const summarizeByCategory = (
  rows: readonly { amount: string; categoryId?: string }[],
  list: readonly Category[],
): CategorySummaryItem[] => {
  const totals = new Map<string | null, number>();
  for (const r of rows) {
    const n = parseFloat(r.amount);
    if (!Number.isFinite(n) || n <= 0) continue;
    const cat = resolveCategory(list, r.categoryId);
    const key: string | null = cat ? cat.id : null;
    totals.set(key, (totals.get(key) ?? 0) + n);
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  if (grand <= 0) return [];
  const entries = [...totals.entries()].map(([id, total]) => ({
    id,
    name: id ? (list.find((c) => c.id === id)?.name ?? 'Sin categoría') : 'Sin categoría',
    total,
    raw: (total / grand) * 100,
  }));
  entries.sort((a, b) => b.total - a.total);
  // Décimas + largest-remainder para sumar exactamente 100.0.
  const tenths = entries.map((e) => Math.floor(e.raw * 10));
  let rest = 1000 - tenths.reduce((a, b) => a + b, 0);
  const order = entries
    .map((e, i) => ({ i, frac: e.raw * 10 - tenths[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (rest <= 0) break;
    tenths[i] += 1;
    rest -= 1;
  }
  return entries.map((e, i) => ({
    id: e.id,
    name: e.name,
    total: e.total,
    pct: tenths[i] / 10,
  }));
};

/** Dedupe técnico por (kind, normalizeKey) para semilla y saneo de storage. */
export const dedupeCategories = (list: readonly Category[]): Category[] => {
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const c of list) {
    const k = keyOf(c.kind, normalizeKey(c.name));
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
};
