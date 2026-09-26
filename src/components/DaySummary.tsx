import type { AppMode, DayEntry } from '../types/finance';
import { calculateTotals, fmtMoney } from '../utils/calculations';

interface Props {
  day: DayEntry;
  mode: AppMode;
}

/** Totales del día en tiempo real (la lista editable de movimientos vive arriba). */
export const DaySummary = ({ day, mode }: Props) => {
  const { totalIncomes, totalExpenses, netBalance } = calculateTotals(day);
  const positive = netBalance >= 0;
  const incomeLabel = mode === 'daily' ? 'Ingresos' : 'Ingresos extra';

  return (
    <div className="day-summary">
      <div className="stat-grid">
        <div className="stat-card-income">
          <p className="stat-label stat-label-income">{incomeLabel}</p>
          <p className="stat-value stat-value-income">${fmtMoney(totalIncomes)}</p>
        </div>
        <div className="stat-card-expense">
          <p className="stat-label stat-label-expense">Gastos</p>
          <p className="stat-value stat-value-expense">${fmtMoney(totalExpenses)}</p>
        </div>
        <div className={positive ? 'stat-card-balance-pos' : 'stat-card-balance-neg'}>
          <p className={`stat-label ${positive ? 'stat-label-pos' : 'stat-label-expense'}`}>Balance</p>
          <p className={`stat-value ${positive ? 'stat-value-pos' : 'stat-value-expense'}`}>
            {positive ? '+' : ''}${fmtMoney(netBalance)}
          </p>
        </div>
      </div>
      {netBalance !== 0 && (
        <p className={positive ? 'balance-note-pos' : 'balance-note-neg'} role="status">
          {positive
            ? 'Balance positivo — generaste ahorro este día.'
            : 'Los gastos superan los ingresos este día.'}
        </p>
      )}
    </div>
  );
};
