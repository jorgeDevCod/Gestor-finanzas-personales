import type { AppMode } from '../types/finance';

export const MODE_CONFIG: Record<
  AppMode,
  { label: string; incomeSection: string; subtitle: string; description: string }
> = {
  daily: {
    label: 'Diario',
    incomeSection: 'Ingresos',
    subtitle: 'Registra y organiza tus ingresos y gastos día a día.',
    description: 'Seguimiento detallado de cada transacción para mejorar tus hábitos financieros.',
  },
  biweekly: {
    label: 'Quincenal',
    incomeSection: 'Ingresos adicionales',
    subtitle: 'Controla gastos e ingresos adicionales sobre tu salario quincenal.',
    description: 'Visualiza cuánto te queda disponible en cada quincena.',
  },
  monthly: {
    label: 'Mensual',
    incomeSection: 'Ingresos adicionales',
    subtitle: 'Gestiona gastos e ingresos extras sobre tu salario mensual.',
    description: 'Monitorea tu balance mensual y alcanza tus metas de ahorro.',
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
