export const calculateTotals = (day) => {
    const totalIncomes = day.incomes.reduce((sum, income) => 
      sum + (parseFloat(income.amount) || 0), 0);
    const totalExpenses = day.expenses.reduce((sum, expense) => 
      sum + (parseFloat(expense.amount) || 0), 0);
    
    return {
      totalIncomes,
      totalExpenses,
      netBalance: totalIncomes - totalExpenses
    };
  };