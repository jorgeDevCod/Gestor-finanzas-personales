export const DaySummary = ({ day, mode = 'daily' }) => {
  const totalIncome = day.incomes.reduce(
    (sum, income) => sum + (parseFloat(income.amount) || 0), 0
  );
  const totalExpenses = day.expenses.reduce(
    (sum, expense) => sum + (parseFloat(expense.amount) || 0), 0
  );
  const netBalance = totalIncome - totalExpenses;

  const isDaily       = mode === 'daily';
  const incomeLabel   = isDaily ? 'Ingresos' : 'Ingresos adicionales';
  const incomeDetail  = isDaily ? 'Detalle de ingresos' : 'Detalle de ingresos adicionales';

  const fmt = amount =>
    amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const thStyle = color => ({
    padding: '11px 16px',
    textAlign: 'left',
    fontSize: 10,
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  });

  const tdBase = {
    padding: '12px 16px',
    fontSize: 13.5,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-sec)',
    borderBottom: '1px solid var(--color-border)',
    lineHeight: 1.5,
  };

  return (
    <div
      style={{
        marginTop: 30,
        paddingTop: 26,
        borderTop: '1px solid var(--color-border)',
      }}
    >
      {/* ── TARJETAS DE RESUMEN ─────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 26,
        }}
      >
        {/* Ingresos del día */}
        <div className="stat-card-income">
          <p
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 9,
              color: 'var(--color-income)',
              letterSpacing: '0.09em',
              marginBottom: 10,
            }}
          >
            {incomeLabel}
          </p>
          <p
            className="font-display font-bold glow-income"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
              color: 'var(--color-income)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            ${fmt(totalIncome)}
          </p>
        </div>

        {/* Gastos del día */}
        <div className="stat-card-expense">
          <p
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 9,
              color: 'var(--color-expense)',
              letterSpacing: '0.09em',
              marginBottom: 10,
            }}
          >
            Gastos
          </p>
          <p
            className="font-display font-bold glow-expense"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
              color: 'var(--color-expense)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            ${fmt(totalExpenses)}
          </p>
        </div>

        {/* Balance del día */}
        <div className={netBalance >= 0 ? 'stat-card-balance-pos' : 'stat-card-balance-neg'}>
          <p
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 9,
              color: netBalance >= 0 ? 'var(--color-lime)' : 'var(--color-expense)',
              letterSpacing: '0.09em',
              marginBottom: 10,
            }}
          >
            Balance día
          </p>
          <p
            className={`font-display font-bold animate-glow-pulse ${
              netBalance >= 0 ? 'glow-lime' : 'glow-expense'
            }`}
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
              color: netBalance >= 0 ? 'var(--color-lime)' : 'var(--color-expense)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {netBalance >= 0 ? '+' : ''}{fmt(netBalance)}
          </p>
        </div>
      </div>

      {/* ── TABLA DE INGRESOS ───────────────────────────── */}
      {day.incomes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 10,
              color: 'var(--color-income)',
              letterSpacing: '0.07em',
              marginBottom: 11,
              lineHeight: 1.4,
            }}
          >
            {incomeDetail}
          </h3>
          <div className="detail-table-wrap">
            <table style={{ width: '100%', minWidth: 440, borderCollapse: 'collapse' }}>
              <thead
                style={{
                  background: 'rgba(90, 181, 165, 0.04)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <tr>
                  <th style={thStyle('var(--color-income)')}>Descripción</th>
                  <th style={{ ...thStyle('var(--color-income)'), textAlign: 'right' }}>Monto</th>
                  <th style={{ ...thStyle('var(--color-income)'), textAlign: 'right' }}>Método</th>
                </tr>
              </thead>
              <tbody>
                {day.incomes.map((income, index) => (
                  <tr
                    key={index}
                    style={{ transition: 'background 0.12s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(90, 181, 165, 0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdBase}>{income.name || 'Sin descripción'}</td>
                    <td
                      style={{
                        ...tdBase,
                        textAlign: 'right',
                        color: 'var(--color-income)',
                        fontWeight: 600,
                      }}
                    >
                      ${fmt(parseFloat(income.amount) || 0)}
                    </td>
                    <td style={{ ...tdBase, textAlign: 'right', fontSize: 12.5 }}>
                      {income.paymentType || 'No especificado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TABLA DE GASTOS ─────────────────────────────── */}
      {day.expenses.length > 0 && (
        <div style={{ marginBottom: netBalance !== 0 ? 20 : 0 }}>
          <h3
            className="font-display font-semibold uppercase"
            style={{
              fontSize: 10,
              color: 'var(--color-expense)',
              letterSpacing: '0.07em',
              marginBottom: 11,
              lineHeight: 1.4,
            }}
          >
            Detalle de gastos
          </h3>
          <div className="detail-table-wrap">
            <table style={{ width: '100%', minWidth: 440, borderCollapse: 'collapse' }}>
              <thead
                style={{
                  background: 'rgba(224, 144, 144, 0.04)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <tr>
                  <th style={thStyle('var(--color-expense)')}>Descripción</th>
                  <th style={{ ...thStyle('var(--color-expense)'), textAlign: 'right' }}>Monto</th>
                  <th style={{ ...thStyle('var(--color-expense)'), textAlign: 'right' }}>Método</th>
                </tr>
              </thead>
              <tbody>
                {day.expenses.map((expense, index) => (
                  <tr
                    key={index}
                    style={{ transition: 'background 0.12s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224, 144, 144, 0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdBase}>{expense.name || 'Sin descripción'}</td>
                    <td
                      style={{
                        ...tdBase,
                        textAlign: 'right',
                        color: 'var(--color-expense)',
                        fontWeight: 600,
                      }}
                    >
                      ${fmt(parseFloat(expense.amount) || 0)}
                    </td>
                    <td style={{ ...tdBase, textAlign: 'right', fontSize: 12.5 }}>
                      {expense.paymentType || 'No especificado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MENSAJE DE BALANCE ──────────────────────────── */}
      {netBalance !== 0 && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: netBalance > 0
              ? 'rgba(122, 191, 142, 0.05)'
              : 'rgba(224, 144, 144, 0.05)',
            border: netBalance > 0
              ? '1px solid rgba(122, 191, 142, 0.16)'
              : '1px solid rgba(224, 144, 144, 0.16)',
            borderLeft: netBalance > 0
              ? '3px solid var(--color-lime)'
              : '3px solid var(--color-expense)',
          }}
        >
          <p
            className="font-body"
            style={{
              fontSize: 13.5,
              fontWeight: 400,
              color: netBalance > 0 ? 'var(--color-lime)' : 'var(--color-expense)',
              lineHeight: 1.6,
            }}
          >
            {netBalance > 0
              ? 'Balance positivo — has generado ahorro en este día.'
              : 'Los gastos superan los ingresos en este día.'}
          </p>
        </div>
      )}
    </div>
  );
};
