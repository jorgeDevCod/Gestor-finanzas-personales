import { calculateTotals } from './calculations';

export const exportToTextFile = (days) => {
  const exportContent = days.map(day => {
    const incomeDetails = day.incomes
      .filter(income => income.name && income.amount)
      .map(income =>
        `Ingreso: ${income.name} - $${income.amount} (${income.paymentType || 'Sin tipo'})`
      ).join('\n');

    const expenseDetails = day.expenses
      .filter(expense => expense.name && expense.amount)
      .map(expense =>
        `Gasto: ${expense.name} - $${expense.amount} (${expense.paymentType || 'Sin tipo'})`
      ).join('\n');

    const { totalIncomes, totalExpenses, netBalance } = calculateTotals(day);

    return `Fecha: ${day.date.toLocaleDateString()}
${incomeDetails}
${expenseDetails}
Total Ingresos: $${totalIncomes.toFixed(2)}
Total Gastos: $${totalExpenses.toFixed(2)}
Saldo Neto: $${netBalance.toFixed(2)}
----------------------------`;
  }).join('\n\n');

  const blob = new Blob([exportContent], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `finanzas_${new Date().toISOString().split('T')[0]}.txt`;
  link.click();
};