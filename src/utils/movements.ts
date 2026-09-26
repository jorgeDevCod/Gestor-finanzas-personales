import type { DayEntry, MoneyRow, PaymentType, RowKind } from '../types/finance';
import { uid } from '../types/finance';

export type MovementKind = 'income' | 'expense';

export const kindToRows = (kind: MovementKind): RowKind =>
  kind === 'income' ? 'incomes' : 'expenses';

export interface MovementInput {
  name: string;
  amount: string;
  paymentType: PaymentType;
}

export const EMPTY_MOVEMENT: MovementInput = { name: '', amount: '', paymentType: '' };

/** Valida un registro antes de guardarlo. Devuelve el error o null si es válido. */
export const validateMovement = (input: MovementInput): string | null => {
  const n = parseFloat(input.amount);
  if (!Number.isFinite(n) || n <= 0) return 'Ingresa un monto válido mayor a cero.';
  return null;
};

/** Construye una fila con id único y monto normalizado. */
export const buildMovement = (input: MovementInput): MoneyRow => ({
  id: uid(),
  name: input.name.trim(),
  amount: String(parseFloat(input.amount)),
  paymentType: input.paymentType,
});

/** Inserta o actualiza (por id) un movimiento en su grupo. Función pura. */
export const upsertMovement = (day: DayEntry, kind: MovementKind, row: MoneyRow): DayEntry => {
  const key = kindToRows(kind);
  const exists = day[key].some((r) => r.id === row.id);
  return {
    ...day,
    [key]: exists ? day[key].map((r) => (r.id === row.id ? row : r)) : [...day[key], row],
  };
};

/** Elimina un movimiento de su grupo. Función pura. */
export const removeMovement = (day: DayEntry, kind: MovementKind, rowId: string): DayEntry => {
  const key = kindToRows(kind);
  return { ...day, [key]: day[key].filter((r) => r.id !== rowId) };
};
