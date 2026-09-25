import { Trash2 } from 'lucide-react';
import type { MoneyRow } from '../types/finance';
import { PAYMENT_OPTIONS } from '../utils/constants';

interface Props {
  item: MoneyRow;
  type: 'income' | 'expense';
  onNameChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onPaymentTypeChange: (v: string) => void;
  onRemove: () => void;
}

export const IncomeExpenseRow = ({
  item,
  type,
  onNameChange,
  onAmountChange,
  onPaymentTypeChange,
  onRemove,
}: Props) => {
  const isIncome = type === 'income';

  return (
    <div className={isIncome ? 'row-income' : 'row-expense'}>
      <div className="row-top">
        <select
          value={item.paymentType}
          onChange={(e) => onPaymentTypeChange(e.target.value)}
          className="input-dark select-dark"
          aria-label="Metodo de pago"
        >
          {PAYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-remove-row"
          onClick={onRemove}
          aria-label={`Eliminar ${isIncome ? 'ingreso' : 'gasto'} ${item.name || 'sin nombre'}`}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="row-fields">
        <input
          type="text"
          placeholder="Nombre"
          value={item.name}
          onChange={(e) => onNameChange(e.target.value)}
          className="input-dark"
          aria-label="Nombre del movimiento"
          maxLength={80}
        />
        <input
          type="number"
          placeholder="Monto"
          value={item.amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="input-dark"
          aria-label="Monto"
          min="0"
          step="0.01"
          inputMode="decimal"
        />
      </div>
    </div>
  );
};
