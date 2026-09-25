import { useState } from 'react';
import type { AppMode, DayEntry } from '../types/finance';
import { calculateTotals, fmtMoney } from '../utils/calculations';
import { paymentLabel } from '../utils/constants';

interface Props {
  day: DayEntry;
  mode: AppMode;
}

/** Resumen compacto por día: 3 cifras + detalle colapsable (usa calculateTotals, sin duplicar). */
export const DaySummary = ({ day, mode }: Props) => {
  const [showDetail, setShowDetail] = useState(false);
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

      <button
        type="button"
        className="link-toggle"
        onClick={() => setShowDetail((s) => !s)}
        aria-expanded={showDetail}
      >
        {showDetail ? 'Ocultar detalle' : 'Ver detalle de movimientos'}
      </button>

      {showDetail && (
        <div className="detail-lists">
          {day.incomes.filter((r) => r.name || r.amount).length > 0 && (
            <ul className="detail-list" aria-label="Detalle de ingresos">
              {day.incomes
                .filter((r) => r.name || r.amount)
                .map((r) => (
                  <li key={r.id} className="detail-item">
                    <span className="detail-name">{r.name || 'Sin descripción'}</span>
                    <span className="detail-meta">
                      {paymentLabel(r.paymentType)} · <strong className="txt-income">+${fmtMoney(parseFloat(r.amount) || 0)}</strong>
                    </span>
                  </li>
                ))}
            </ul>
          )}
          {day.expenses.filter((r) => r.name || r.amount).length > 0 && (
            <ul className="detail-list" aria-label="Detalle de gastos">
              {day.expenses
                .filter((r) => r.name || r.amount)
                .map((r) => (
                  <li key={r.id} className="detail-item">
                    <span className="detail-name">{r.name || 'Sin descripción'}</span>
                    <span className="detail-meta">
                      {paymentLabel(r.paymentType)} · <strong className="txt-expense">−${fmtMoney(parseFloat(r.amount) || 0)}</strong>
                    </span>
                  </li>
                ))}
            </ul>
          )}
          {netBalance !== 0 && (
            <p className={positive ? 'balance-note-pos' : 'balance-note-neg'} role="status">
              {positive
                ? 'Balance positivo — generaste ahorro este día.'
                : 'Los gastos superan los ingresos este día.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
