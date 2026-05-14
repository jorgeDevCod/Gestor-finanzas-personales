import { TrashIcon } from 'lucide-react';

export const IncomeExpenseRow = ({
  item,
  type = 'expense',
  onNameChange,
  onAmountChange,
  onPaymentTypeChange,
  onRemove,
}) => {
  const isIncome = type === 'income';

  const focusColor  = isIncome ? 'var(--color-income)' : 'var(--color-expense)';
  const focusShadow = isIncome
    ? '0 0 0 3px rgba(90, 181, 165, 0.08)'
    : '0 0 0 3px rgba(224, 144, 144, 0.08)';

  const handleFocus = e => {
    e.target.style.borderColor = focusColor;
    e.target.style.boxShadow   = focusShadow;
  };
  const handleBlur = e => {
    e.target.style.borderColor = 'var(--color-border)';
    e.target.style.boxShadow   = 'none';
  };

  return (
    <div className={isIncome ? 'row-income' : 'row-expense'}>
      {/* Payment type + remove */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 8,
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <select
          value={item.paymentType}
          onChange={e => onPaymentTypeChange(e.target.value)}
          className="input-dark select-dark"
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Tipo de Pago</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta Debito">Tarjeta Débito</option>
          <option value="tarjeta Credito">Tarjeta Crédito</option>
          <option value="transferencia">Transferencia</option>
        </select>

        <button className="btn-remove-row" onClick={onRemove}>
          <TrashIcon size={14} />
        </button>
      </div>

      {/* Name + amount */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input
          type="text"
          placeholder="Nombre"
          value={item.name}
          onChange={e => onNameChange(e.target.value)}
          className="input-dark"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <input
          type="number"
          placeholder="Monto"
          value={item.amount}
          onChange={e => onAmountChange(e.target.value)}
          className="input-dark"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
};
