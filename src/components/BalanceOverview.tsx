import { ArrowLeftRight, Pencil, RotateCcw } from 'lucide-react';
import type { AppMode, Category, DayTotals } from '../types/finance';
import type { Period } from '../utils/periods';
import { fmtMoney, type PeriodBalance } from '../utils/calculations';
import { summarizeByCategory } from '../utils/categories';
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
  onChangeMode: () => void;
  /** Solo daily: movimientos de hoy como dato secundario. */
  today: DayTotals | null;
  /** Gastos a resumir por categoría (período actual, o día abierto/hoy en Daily). */
  categoryRows: { amount: string; categoryId?: string }[];
  categories: Category[];
  /** Métricas de anticipación ya calculadas ([] = no mostrar). */
  metrics: { label: string; value: string }[];
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
  onChangeMode,
  today,
  categoryRows,
  categories,
  metrics,
}: Props) => {
  const isDaily = mode === 'daily';
  const positive = balance.available >= 0;
  const barClass =
    balance.percentUsed > 90 ? 'bar-danger' : balance.percentUsed > 70 ? 'bar-warn' : 'bar-ok';
  const eyebrow = isDaily ? 'Saldo actual' : period.label;
  const breakdown = summarizeByCategory(categoryRows, categories);

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
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={onChangeMode}
            title="Cambiar modo de gestión"
          >
            <ArrowLeftRight size={13} aria-hidden="true" />
            Modo
          </button>
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

      {metrics.length > 0 && (
        <div className="metrics-row" aria-live="polite" aria-label="Métricas del período">
          {metrics.map((m) => (
            <div key={m.label} className="metric">
              <p className="mini-label">{m.label}</p>
              <p className="mini-value">{m.value}</p>
            </div>
          ))}
        </div>
      )}

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

      <div className="cat-breakdown">
        <p className="mini-label">En qué se va tu dinero</p>
        {breakdown.length === 0 ? (
          <p className="mov-empty">Categoriza tus gastos para ver en qué se va tu dinero.</p>
        ) : (
          <ul className="cat-breakdown-list">
            {breakdown.map((item) => (
              <li key={item.id ?? 'none'} className="cat-breakdown-row">
                <span className="cat-breakdown-top">
                  <span className="cat-breakdown-name">{item.name}</span>
                  <span className="cat-breakdown-meta">
                    {item.pct.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% · $
                    {fmtMoney(item.total)}
                  </span>
                </span>
                <span
                  className="cat-breakdown-bar"
                  role="progressbar"
                  aria-valuenow={item.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${item.name}: ${item.pct}%`}
                >
                  <span className="cat-breakdown-fill" style={{ width: `${item.pct}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
