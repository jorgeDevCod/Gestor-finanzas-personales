import { PencilIcon } from 'lucide-react';

const fmt = n =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const BalanceOverview = ({
  mode,
  baseSalary,
  totalIncomes,
  totalExpenses,
  onEditSalary,
}) => {
  const remaining    = baseSalary + totalIncomes - totalExpenses;
  const isPositive   = remaining >= 0;
  const percentUsed  = baseSalary > 0
    ? Math.min(Math.round((totalExpenses / (baseSalary + totalIncomes)) * 100), 100)
    : 0;

  const modeLabel = mode === 'biweekly' ? 'Quincenal' : 'Mensual';

  const barColor = percentUsed > 90
    ? 'var(--color-expense)'
    : percentUsed > 70
    ? '#FBBF24'
    : 'var(--color-lime)';

  return (
    <div
      className="animate-fade-up delay-100"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-2)',
        borderRadius: 22,
        padding: '34px 32px',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow decorativo de fondo — muy sutil */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -90,
          right: -90,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: isPositive
            ? 'rgba(122, 191, 142, 0.03)'
            : 'rgba(224, 144, 144, 0.03)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <p
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 10.5,
              color: 'var(--color-lime)',
              letterSpacing: '0.1em',
              marginBottom: 6,
            }}
          >
            Balance {modeLabel}
          </p>
          <p
            className="font-body"
            style={{ fontSize: 14, color: 'var(--color-text-sec)', lineHeight: 1.5 }}
          >
            Salario base:{' '}
            <span
              className="font-body"
              style={{ color: 'var(--color-text)', fontWeight: 500 }}
            >
              ${fmt(baseSalary)}
            </span>
          </p>
        </div>

        <button
          onClick={onEditSalary}
          className="btn-ghost"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <PencilIcon size={13} />
          Editar salario
        </button>
      </div>

      {/* Número principal de balance */}
      <div style={{ marginBottom: 20 }}>
        <p
          className={`font-display font-extrabold ${isPositive ? 'glow-lime' : 'glow-expense'}`}
          style={{
            fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
            color: isPositive ? 'var(--color-lime)' : 'var(--color-expense)',
            letterSpacing: '-0.022em',
            lineHeight: 1.12,
          }}
        >
          {!isPositive && <span>-</span>}${fmt(Math.abs(remaining))}
        </p>
        <p
          className="font-body mt-2"
          style={{ fontSize: 14, color: 'var(--color-text-sec)' }}
        >
          {isPositive ? 'disponibles' : 'de déficit'} ·{' '}
          <span style={{ color: percentUsed > 90 ? 'var(--color-expense)' : 'var(--color-text-sec)' }}>
            {percentUsed}% del período utilizado
          </span>
        </p>
      </div>

      {/* Barra de progreso */}
      <div
        style={{
          background: 'var(--color-surface3)',
          height: 6,
          borderRadius: 99,
          marginBottom: 28,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentUsed}%`,
            height: '100%',
            borderRadius: 99,
            background: barColor,
            transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Fila de estadísticas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          paddingTop: 22,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {/* Salario base */}
        <div>
          <p
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 9.5,
              color: 'var(--color-text-ter)',
              letterSpacing: '0.09em',
              marginBottom: 7,
            }}
          >
            Salario base
          </p>
          <p
            className="font-display font-semibold"
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            ${fmt(baseSalary)}
          </p>
        </div>

        {/* Ingresos adicionales */}
        <div>
          <p
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 9.5,
              color: 'var(--color-income)',
              letterSpacing: '0.09em',
              marginBottom: 7,
            }}
          >
            Ingresos extra
          </p>
          <p
            className="font-display font-semibold"
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
              color: 'var(--color-income)',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            +${fmt(totalIncomes)}
          </p>
        </div>

        {/* Gastos totales */}
        <div>
          <p
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 9.5,
              color: 'var(--color-expense)',
              letterSpacing: '0.09em',
              marginBottom: 7,
            }}
          >
            Gastos totales
          </p>
          <p
            className="font-display font-semibold"
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
              color: 'var(--color-expense)',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            −${fmt(totalExpenses)}
          </p>
        </div>
      </div>
    </div>
  );
};
