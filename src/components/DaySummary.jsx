export const DaySummary = ({ day }) => {
  // Calcular totales
  const totalIncome = day.incomes.reduce((sum, income) => 
    sum + (parseFloat(income.amount) || 0), 0);
  const totalExpenses = day.expenses.reduce((sum, expense) => 
    sum + (parseFloat(expense.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="bg-gray-50 rounded-lg py-6 px-4 mt-6 border border-gray-200">
      {/* Resumen financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-4 text-center">
          <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">
            Ingresos Totales
          </h4>
          <p className="text-2xl font-bold text-green-700 font-['Inter'] tracking-tight">
            ${totalIncome.toLocaleString('es-ES', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 text-center">
          <h4 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2">
            Gastos Totales
          </h4>
          <p className="text-2xl font-bold text-red-700 font-['Inter'] tracking-tight">
            ${totalExpenses.toLocaleString('es-ES', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 text-center">
          <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Balance Neto
          </h4>
          <p className={`text-2xl font-bold font-['Inter'] tracking-tight ${
            netBalance >= 0 ? 'text-blue-700' : 'text-red-700'
          }`}>
            ${netBalance.toLocaleString('es-ES', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </p>
        </div>
      </div>

      {/* Desglose detallado de ingresos */}
      {day.incomes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-3">Detalle de Ingresos</h3>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-green-50 border-b">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-green-600">Descripción</th>
                  <th className="p-3 text-right text-sm font-medium text-green-600">Monto</th>
                  <th className="p-3 text-right text-sm font-medium text-green-600">Método de Pago</th>
                </tr>
              </thead>
              <tbody>
                {day.incomes.map((income, index) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-green-50 transition-colors">
                    <td className="p-3 text-gray-700">{income.name || 'Sin descripción'}</td>
                    <td className="p-3 text-right text-green-700 font-semibold">
                      ${parseFloat(income.amount).toLocaleString('es-ES', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </td>
                    <td className="p-3 text-right text-gray-600">{income.paymentType || 'No especificado'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Desglose detallado de gastos */}
      {day.expenses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-3">Detalle de Gastos</h3>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-red-50 border-b">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-red-600">Descripción</th>
                  <th className="p-3 text-right text-sm font-medium text-red-600">Monto</th>
                  <th className="p-3 text-right text-sm font-medium text-red-600">Método de Pago</th>
                </tr>
              </thead>
              <tbody>
                {day.expenses.map((expense, index) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-red-50 transition-colors">
                    <td className="p-3 text-gray-700">{expense.name || 'Sin descripción'}</td>
                    <td className="p-3 text-right text-red-700 font-semibold">
                      ${parseFloat(expense.amount).toLocaleString('es-ES', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </td>
                    <td className="p-3 text-right text-gray-600">{expense.paymentType || 'No especificado'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje de balance */}
      {netBalance !== 0 && (
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-800 font-['Inter'] font-medium">
            {netBalance > 0 
              ? "✅ Excelente, has generado un ahorro positivo hoy." 
              : "⚠️ Tus gastos superan tus ingresos. Considera revisar tus gastos."}
          </p>
        </div>
      )}
    </div>
  );
};