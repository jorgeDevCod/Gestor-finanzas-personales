import React from 'react';
import { calculateTotals } from '../utils/calculations';

export const DaySummary = ({ day }) => {
  const { totalIncomes, totalExpenses, netBalance } = calculateTotals(day);
  
  const formatPaymentType = (type) => type || 'Sin tipo';

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-80 m-auto">
      <h3 className="font-bold mb-3 text-gray-800">Resumen del Día</h3>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Ingresos</p>
          <p className="font-semibold text-green-600">
            ${totalIncomes.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Gastos</p>
          <p className="font-semibold text-red-600">
            ${totalExpenses.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Saldo Neto</p>
          <p className={`font-semibold ${
            netBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${netBalance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-2 text-gray-700">Detalles de Ingresos</h4>
        {day.incomes.filter(income => income.name && income.amount).map((income, index) => (
          <div key={index} className="flex justify-between text-sm mb-1 flex-wrap">
            <span>{income.name}</span>
            <span className="font-semibold text-green-600">
              ${parseFloat(income.amount).toFixed(2)} ({formatPaymentType(income.paymentType)})
            </span>
          </div>
        ))}

        <h4 className="font-semibold mt-4 mb-2 text-gray-700">Detalles de Gastos</h4>
        {day.expenses.filter(expense => expense.name && expense.amount).map((expense, index) => (
          <div key={index} className="flex justify-between text-sm mb-1 relative">
            <span className='break-words'>{expense.name}</span>

            <span className="font-semibold text-red-600 break-words">
              ${parseFloat(expense.amount).toFixed(2)} ({formatPaymentType(expense.paymentType)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};