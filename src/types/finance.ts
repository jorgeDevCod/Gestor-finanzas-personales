/** Tipos centrales del Gestor de Finanzas Personales (storage v2, limpio). */

export type AppMode = 'daily' | 'biweekly' | 'monthly';

/** Tipos de pago normalizados (sin espacios ni mayúsculas intermedias). */
export type PaymentType = '' | 'efectivo' | 'debito' | 'credito' | 'transferencia';

export type RowKind = 'incomes' | 'expenses';

export interface MoneyRow {
  id: string;
  name: string;
  /** String porque viene de <input type="number"> controlado; se parsea al calcular. */
  amount: string;
  paymentType: PaymentType;
  /** OPCIONAL. Ausente = "Sin categoría". Huérfano = "Sin categoría". Sin migrar. */
  categoryId?: string;
}

export interface DayEntry {
  id: string;
  /** Fecha local en formato YYYY-MM-DD (evita bugs de timezone de Date). */
  dateISO: string;
  incomes: MoneyRow[];
  expenses: MoneyRow[];
}

export type Theme = 'light' | 'dark';

export type AppView = 'resumen' | 'movimientos' | 'ajustes';

export const isAppView = (v: unknown): v is AppView =>
  v === 'resumen' || v === 'movimientos' || v === 'ajustes';

export type CategoryKind = 'expense' | 'income';

export interface Category {
  id: string;
  /** Ya limpio: trim, espacios colapsados, máximo 24 caracteres. */
  name: string;
  kind: CategoryKind;
}

export const isCategoryKind = (v: unknown): v is CategoryKind =>
  v === 'expense' || v === 'income';

export interface DayTotals {
  totalIncomes: number;
  totalExpenses: number;
  netBalance: number;
}

export const isAppMode = (v: unknown): v is AppMode =>
  v === 'daily' || v === 'biweekly' || v === 'monthly';

export const isPaymentType = (v: unknown): v is PaymentType =>
  v === '' ||
  v === 'efectivo' ||
  v === 'debito' ||
  v === 'credito' ||
  v === 'transferencia';

/** Normaliza valores legacy ('tarjeta Debito', etc.) al nuevo enum. */
export const normalizePaymentType = (v: unknown): PaymentType => {
  if (typeof v !== 'string') return '';
  const s = v.trim().toLowerCase();
  if (s === 'efectivo') return 'efectivo';
  if (s.includes('debito') || s.includes('débito')) return 'debito';
  if (s.includes('credito') || s.includes('crédito')) return 'credito';
  if (s === 'transferencia') return 'transferencia';
  return '';
};

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
