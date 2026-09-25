import { Pencil } from 'lucide-react';
import type { AppMode } from '../types/finance';
import { fmtMoney } from '../utils/calculations';

interface Props {
  mode: AppMode;
  baseSalary: number;
  totalIncomes: number;
  totalExpenses: number;
  onEditSalary: () => void;
}

/** Balance global, solo modos con salario (quincenal / mensual). */
export const BalanceOverview = ({ mode, baseSalary, totalIncomes, totalExpenses, onEditSalary }: Props) => {
  const remaining = baseSalary + totalIncomes - totalExpenses;
  const positive = remaining >= 0;
  const denominator = baseSalary + totalIncomes;
  const percentUsed = denominator > 0 ? Math.min(Math.round((totalExpenses / denominator) * 100), 100) : 0;
  const modeLabel = mode === 'biweekly' ? 'Quincenal' : 'Mensual';
  const barClass = percentUsed > 90 ? 'bar-danger' : percentUsed > 70 ? 'bar-warn' : 'bar-ok';

  return (
    <section className="balance-card" aria-label={`Balance ${modeLabel.toLowerCase()}`}>
      <div className="balance-head">
        <div>
          <p className="eyebrow">Balance {modeLabel}</p>
          <p className="balance-sub">
            Salario base: <strong>${fmtMoney(baseSalary)}</strong>
          </p>
        </div>
        <button type="button" className="btn-ghost btn-sm" onClick={onEditSalary}>
          <Pencil size={13} aria-hidden="true" />
          Editar salario
        </button>
      </div>

      <p className={`balance-total ${positive ? 'txt-pos' : 'txt-expense'}`}>
        {positive ? '' : '−'}${fmtMoney(Math.abs(remaining))}
      </p>
      <p className="balance-sub">
        {positive ? 'disponibles' : 'de déficit'} · {percentUsed}% del período utilizado
      </p>

      <div className="progress" role="progressbar" aria-valuenow={percentUsed} aria-valuemin={0} aria-valuemax={100}>
        <div className={`progress-fill ${barClass}`} style={{ width: `${percentUsed}%` }} />
      </div>

      <div className="balance-grid">
        <div>
          <p className="mini-label">Salario base</p>
          <p className="mini-value">${fmtMoney(baseSalary)}</p>
        </div>
        <div>
          <p className="mini-label txt-income">Ingresos extra</p>
          <p className="mini-value txt-income">+${fmtMoney(totalIncomes)}</p>
        </div>
        <div>
          <p className="mini-label txt-expense">Gastos totales</p>
          <p className="mini-value txt-expense">−${fmtMoney(totalExpenses)}</p>
        </div>
      </div>
    </section>
  );
};
