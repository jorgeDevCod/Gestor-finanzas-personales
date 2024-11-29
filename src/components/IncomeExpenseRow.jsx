import React from 'react';
import { TrashIcon } from 'lucide-react';

export const IncomeExpenseRow = ({
  item,
  onNameChange,
  onAmountChange,
  onPaymentTypeChange,
  onRemove,
  isSelected,
  onSelect,
}) => {
  return (
    <div className="border rounded-lg p-4 mb-2">
      <div className="grid grid-cols-2 gap-6 items-center mt-2">
        <select
          value={item.paymentType}
          onChange={(e) => onPaymentTypeChange(e.target.value)}
          className="border rounded p-2 my-2 w-36"
        >
          <option value="">Tipo de Pago</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta Debito">Tarjeta Debito</option>
          <option value="tarjeta Credito">Tarjeta Credito</option> 
          <option value="transferencia">Transferencia</option>
        </select>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 transition-colors flex justify-center items-center w-full m-0"
        >
          <TrashIcon size={20} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 items-center">
        <input
          type="text"
          placeholder="Nombre"
          value={item.name}
          onChange={(e) => onNameChange(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="number"
          placeholder="Monto"
          value={item.amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      
    </div>
  );
};
