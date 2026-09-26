import { Pencil, RotateCcw } from 'lucide-react';
import type { AppMode, DayTotals } from '../types/finance';
import type { Period } from '../utils/periods';
import { fmtMoney, type PeriodBalance } from '../utils/calculations';
import { formatLong } from '../utils/dates';

interface Props {
  mode: AppMode;
  period: Period;
  /** Ya calculado por el llamador (período o caja global). Nunca se persiste. */
  balance: PeriodBalance;
  baseLabel: string;
  incomesLabel: string;
  onEditBase: () => void;
  editLabel: string;
  onResetBase: () => void;
  /** Solo daily: movimientos de hoy como dato secundario. */
  today: DayTotals | null;
}

/**
 * Balance del período actual (quincena/mes) o caja en tiempo real (daily).
 * Progreso con texto + barra (no depende solo del color).
 */
export const BalanceOverview = ({
  mode,
  period,
  balance,
  baseLabel,
  incomesLabel,
  onEditBase,
  editLabel,
  onResetBase,
  today,
}: Props) => {
  const isDaily = mode === 'daily';
  const positive = balance.available >= 0;
  const barClass =
    balance.percentUsed > 90 ? 'bar-danger' : balance.percentUsed > 70 ? 'bar-warn' : 'bar-ok';
  const eyebrow = isDaily ? 'Saldo actual' : period.label;

  return (
    <section className="balance-card" aria-label={isDaily ? 'Saldo actual' : `Balance ${period.label}`}>
      <div className="balance-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <p className="balance-sub">
            {isDaily ? formatLong(period.startISO) : period.range}
          </p>
        </div>
        <div className="balance-actions">
          <button type="button" className="btn-ghost btn-sm" onClick={onEditBase}>
            <Pencil size={13} aria-hidden="true" />
            {editLabel}
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm btn-danger-ghost"
            onClick={onResetBase}
            title="Reiniciar el monto base a cero"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reiniciar
          </button>
        </div>
      </div>

      <p className={`balance-total ${positive ? 'txt-pos' : 'txt-expense'}`}>
        {positive ? '' : '−'}${fmtMoney(Math.abs(balance.available))}
      </p>
      <p className="balance-sub">
        {isDaily ? 'disponibles ahora mismo' : positive ? 'disponibles' : 'de déficit'}
      </p>

      {!isDaily && (
        <>
          <p className="balance-sub" style={{ marginTop: 14 }}>
            Gastado ${fmtMoney(balance.spent)} de ${fmtMoney(balance.budget)} ·{' '}
            <strong>{balance.percentUsed}% utilizado</strong>
          </p>
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={balance.percentUsed}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${balance.percentUsed}% utilizado`}
          >
            <div className={`progress-fill ${barClass}`} style={{ width: `${balance.percentUsed}%` }} />
          </div>
        </>
      )}

      <div className="balance-grid">
        <div>
          <p className="mini-label">{baseLabel}</p>
          <p className="mini-value">${fmtMoney(balance.base)}</p>
        </div>
        <div>
          <p className="mini-label txt-income">{incomesLabel}</p>
          <p className="mini-value txt-income">+${fmtMoney(balance.totalIncomes)}</p>
        </div>
        <div>
          <p className="mini-label txt-expense">Gastos</p>
          <p className="mini-value txt-expense">−${fmtMoney(balance.totalExpenses)}</p>
        </div>
      </div>

      {!isDaily && (
        <p className="balance-sub" style={{ marginTop: 14 }}>
          Días restantes: <strong>{period.daysRemaining}</strong>
          {balance.perDay !== null ? (
            <> · Disponible aprox. por día: <strong>${fmtMoney(balance.perDay)}</strong></>
          ) : (
            <> · Último día del período</>
          )}
        </p>
      )}
      {isDaily && today && (
        <p className="balance-sub" style={{ marginTop: 14 }}>
          Hoy: <span className="txt-income">+${fmtMoney(today.totalIncomes)}</span>
          {' · '}
          <span className="txt-expense">−${fmtMoney(today.totalExpenses)}</span>
          {' · Balance '}
          <strong className={today.netBalance >= 0 ? 'txt-pos' : 'txt-expense'}>
            {today.netBalance >= 0 ? '+' : '−'}${fmtMoney(Math.abs(today.netBalance))}
          </strong>
        </p>
      )}
    </section>
  );
};
