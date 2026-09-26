import { useEffect, useState } from 'react';
import { CircleDollarSign, MinusCircle } from 'lucide-react';
import type { Notice } from '../hooks/useFinance';
import type { PaymentType } from '../types/finance';
import {
  EMPTY_MOVEMENT,
  validateMovement,
  type MovementInput,
  type MovementKind,
} from '../utils/movements';
import { PAYMENT_OPTIONS } from '../utils/constants';
import { todayISO } from '../utils/dates';

/** Toasts no bloqueantes (sustituyen alert/confirm nativos). */
export const Toasts = ({ notices }: { notices: Notice[] }) => (
  <div className="toast-stack" aria-live="polite" aria-atomic="false">
    {notices.map((n) => (
      <div key={n.id} className={`toast toast-${n.kind}`} role="status">
        {n.text}
      </div>
    ))}
  </div>
);

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación accesible (sustituye window.confirm). */
export const ConfirmDialog = ({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-box">
        <h2 id="confirm-title" className="modal-title-sm">
          {title}
        </h2>
        <p className="modal-sub">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface DateModalProps {
  open: boolean;
  onConfirm: (iso: string) => void;
  onClose: () => void;
}

/** Selector de fecha para crear un día (valida en el hook, sin alert). */
export const DateModal = ({ open, onConfirm, onClose }: DateModalProps) => {
  const [value, setValue] = useState(todayISO());

  useEffect(() => {
    if (open) setValue(todayISO());
  }, [open ]);

  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="date-title">
      <div className="modal-box">
        <p className="eyebrow">Nuevo registro</p>
        <h2 id="date-title" className="modal-title-sm">
          Selecciona una fecha
        </h2>
        <label htmlFor="date-picker" className="sr-only">
          Fecha del registro
        </label>
        <input
          id="date-picker"
          type="date"
          value={value}
          max={todayISO()}
          onChange={(e) => setValue(e.target.value)}
          className="input-dark input-block"
        />
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn-lime" onClick={() => onConfirm(value)}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

interface RegisterModalProps {
  open: boolean;
  dayLabel: string;
  kind: MovementKind;
  /** Solo creación: permite alternar gasto/entrada. En edición va fijo. */
  allowKindChange: boolean;
  isEditing: boolean;
  initial: MovementInput;
  incomeLabel: string;
  onKindChange: (kind: MovementKind) => void;
  onSave: (kind: MovementKind, input: MovementInput) => boolean;
  onClose: () => void;
}

/** Formulario de registro/edición de un movimiento (gasto o entrada). */
export const RegisterModal = ({
  open,
  dayLabel,
  kind,
  allowKindChange,
  isEditing,
  initial,
  incomeLabel,
  onKindChange,
  onSave,
  onClose,
}: RegisterModalProps) => {
  const [name, setName] = useState(initial.name);
  const [amount, setAmount] = useState(initial.amount);
  const [payment, setPayment] = useState<PaymentType>(initial.paymentType);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setAmount(initial.amount);
      setPayment(initial.paymentType);
      setError('');
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const isIncome = kind === 'income';

  const submit = () => {
    const input: MovementInput = { name, amount, paymentType: payment };
    const validation = validateMovement(input);
    if (validation) {
      setError(validation);
      return;
    }
    if (onSave(kind, input)) {
      setName(EMPTY_MOVEMENT.name);
      setAmount(EMPTY_MOVEMENT.amount);
      setPayment(EMPTY_MOVEMENT.paymentType);
      setError('');
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="register-title">
      <div className="modal-box">
        <p className="eyebrow">{dayLabel}</p>
        <h2 id="register-title" className="modal-title-sm">
          {isEditing ? 'Editar movimiento' : isIncome ? 'Registrar entrada' : 'Registrar gasto'}
        </h2>

        {allowKindChange && (
          <div className="seg-toggle" role="group" aria-label="Tipo de movimiento">
            <button
              type="button"
              className={`seg-btn seg-expense ${!isIncome ? 'seg-active-expense' : ''}`}
              onClick={() => onKindChange('expense')}
              aria-pressed={!isIncome}
            >
              <MinusCircle size={15} aria-hidden="true" />
              Gasto
            </button>
            <button
              type="button"
              className={`seg-btn seg-income ${isIncome ? 'seg-active-income' : ''}`}
              onClick={() => onKindChange('income')}
              aria-pressed={isIncome}
            >
              <CircleDollarSign size={15} aria-hidden="true" />
              {incomeLabel === 'Ingresos' ? 'Ingreso' : 'Entrada'}
            </button>
          </div>
        )}

        <label className="form-label" htmlFor="mov-name">
          Descripción
        </label>
        <input
          id="mov-name"
          type="text"
          placeholder={isIncome ? 'Ej. Venta, bono, reembolso' : 'Ej. Comida, renta, transporte'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-dark input-block"
          maxLength={80}
        />

        <label className="form-label" htmlFor="mov-amount">
          Monto $
        </label>
        <input
          id="mov-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          autoFocus
          className={`input-dark input-block ${error ? 'input-error' : ''}`}
          min="0"
          step="0.01"
          inputMode="decimal"
        />
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <label className="form-label" htmlFor="mov-pay">
          Método de pago
        </label>
        <select
          id="mov-pay"
          value={payment}
          onChange={(e) => setPayment(e.target.value as PaymentType)}
          className="input-dark select-dark input-block"
        >
          {PAYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={isIncome ? 'btn-income-solid' : 'btn-expense-solid'}
            onClick={submit}
          >
            {isIncome ? 'Guardar entrada' : 'Guardar gasto'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AmountModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  label: string;
  initialValue: number;
  allowZero: boolean;
  confirmLabel: string;
  onConfirm: (value: number) => void;
  onClose: () => void;
}

/** Editor genérico de un monto base (saldo inicial). Valida número finito ≥ 0. */
export const AmountModal = ({
  open,
  title,
  subtitle,
  label,
  initialValue,
  allowZero,
  confirmLabel,
  onConfirm,
  onClose,
}: AmountModalProps) => {
  const [value, setValue] = useState(String(initialValue));
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue(String(initialValue));
      setError('');
    }
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n < 0 || (!allowZero && n === 0)) {
      setError(allowZero ? 'Ingresa un monto válido (0 o mayor).' : 'Ingresa un monto válido mayor a cero.');
      return;
    }
    onConfirm(n);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="amount-title">
      <div className="modal-box">
        <p className="eyebrow">Editar monto</p>
        <h2 id="amount-title" className="modal-title-sm">
          {title}
        </h2>
        <p className="modal-sub">{subtitle}</p>
        <label htmlFor="amount-input" className="form-label">
          {label}
        </label>
        <input
          id="amount-input"
          type="number"
          placeholder="0.00"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          autoFocus
          className={`input-dark input-block ${error ? 'input-error' : ''}`}
          min="0"
          step="0.01"
          inputMode="decimal"
        />
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn-lime" onClick={submit}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
