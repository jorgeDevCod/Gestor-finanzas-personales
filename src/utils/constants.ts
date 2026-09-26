import type { AppMode } from '../types/finance';

export const MODE_CONFIG: Record<
  AppMode,
  { label: string; incomeSection: string; subtitle: string; description: string }
> = {
  daily: {
    label: 'Diario',
    incomeSection: 'Ingresos',
    subtitle: 'Tu caja personal en tiempo real: cuánto dinero tienes ahora mismo.',
    description: 'Indica tu saldo inicial y cada movimiento actualizará tu saldo actual al instante.',
  },
  biweekly: {
    label: 'Quincenal',
    incomeSection: 'Ingresos adicionales',
    subtitle: 'Cuánto dinero te queda disponible en tu quincena actual.',
    description: 'Del 1 al 15 o del 16 al último día del mes. Solo cuentan los movimientos de la quincena.',
  },
  monthly: {
    label: 'Mensual',
    incomeSection: 'Ingresos adicionales',
    subtitle: 'Cuánto te queda disponible en tu mes actual.',
    description: 'Del día 1 al último día del mes. Solo cuentan los movimientos del mes.',
  },
};

export const PAYMENT_OPTIONS = [
  { value: '', label: 'Metodo de pago' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Tarjeta Débito' },
  { value: 'credito', label: 'Tarjeta Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
] as const;

export const PAYMENT_LABELS: Record<string, string> = {
  '': 'No especificado',
  efectivo: 'Efectivo',
  debito: 'Tarjeta Débito',
  credito: 'Tarjeta Crédito',
  transferencia: 'Transferencia',
};

export const paymentLabel = (v: string): string => PAYMENT_LABELS[v] ?? 'No especificado';
