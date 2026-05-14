import { useState } from 'react';
import { CalendarDaysIcon, CreditCardIcon, BarChart3Icon, ArrowLeftIcon } from 'lucide-react';

const MODES = [
  {
    id: 'daily',
    Icon: CalendarDaysIcon,
    label: 'Diario',
    headline: 'Registro día a día',
    description:
      'Anota cada ingreso y gasto por día sin un salario base. Ideal para freelancers o para un seguimiento financiero detallado.',
    accent: 'var(--color-income)',
    accentBg: 'rgba(90, 181, 165, 0.06)',
    accentBorderCSS: 'rgba(90, 181, 165, 0.18)',
    glowColor: 'rgba(90, 181, 165, 0.2)',
  },
  {
    id: 'biweekly',
    Icon: CreditCardIcon,
    label: 'Quincenal',
    headline: 'Salario quincenal',
    description:
      'Parte de un salario fijo de quincena. Los gastos se descuentan y los ingresos extra se suman al balance disponible.',
    accent: 'var(--color-lime)',
    accentBg: 'rgba(122, 191, 142, 0.06)',
    accentBorderCSS: 'rgba(122, 191, 142, 0.18)',
    glowColor: 'rgba(122, 191, 142, 0.2)',
  },
  {
    id: 'monthly',
    Icon: BarChart3Icon,
    label: 'Mensual',
    headline: 'Salario mensual',
    description:
      'Define tu sueldo mensual y monitorea tu balance conforme registras gastos e ingresos adicionales a lo largo del mes.',
    accent: '#A78BFA',
    accentBg: 'rgba(167, 139, 250, 0.06)',
    accentBorderCSS: 'rgba(167, 139, 250, 0.18)',
    glowColor: 'rgba(167, 139, 250, 0.2)',
  },
];

const SALARY_LABELS = {
  biweekly: { periodo: 'quincenal', articulo: 'tu quincena' },
  monthly:  { periodo: 'mensual',   articulo: 'tu mes' },
};

export const ModeSelector = ({ onConfirm, isChanging = false }) => {
  const [step, setStep]                 = useState(1);
  const [selectedMode, setSelectedMode] = useState(null);
  const [salaryInput, setSalaryInput]   = useState('');
  const [salaryError, setSalaryError]   = useState('');

  const handleModeSelect = mode => {
    if (mode.id === 'daily') {
      onConfirm('daily', 0);
    } else {
      setSelectedMode(mode);
      setStep(2);
    }
  };

  const handleConfirmSalary = () => {
    const salary = parseFloat(salaryInput);
    if (!salary || salary <= 0) {
      setSalaryError('Ingresa un monto válido mayor a cero.');
      return;
    }
    onConfirm(selectedMode.id, salary);
  };

  return (
    <div className="mode-overlay animate-fade-in">
      <div
        style={{
          width: '100%',
          maxWidth: 860,
          margin: '0 auto',      
          padding: '0 0',
          boxSizing: 'border-box',
        }}
      >
        {step === 1 && (
          <div className="animate-fade-up">
            {isChanging && (
              <p
                className="font-display font-semibold uppercase mb-6"
                style={{ fontSize: 10.5, color: 'var(--color-text-sec)', letterSpacing: '0.1em' }}
              >
                Cambiar modo de gestión
              </p>
            )}

            <p
              className="font-display font-semibold uppercase mb-3"
              style={{ fontSize: 10.5, color: 'var(--color-lime)', letterSpacing: '0.1em' }}
            >
              {isChanging ? 'Elige un nuevo modo' : 'Configuración inicial'}
            </p>

            <h1
              className="font-display font-extrabold mb-3"
              style={{
                fontSize: 'clamp(1.9rem, 5vw, 3.2rem)',
                color: 'var(--color-text)',
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
              }}
            >
              ¿Cómo quieres gestionar
              <br />tus finanzas?
            </h1>

            <p
              className="font-body mb-10"
              style={{
                fontSize: 'clamp(14px, 2vw, 15px)',
                color: 'var(--color-text-sec)',
                lineHeight: 1.7,
                maxWidth: 560,
              }}
            >
              Elige el flujo que mejor se adapte a tu situación financiera. Podrás cambiarlo cuando quieras.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode)}
                  className="mode-card"
                  style={{
                    background: mode.accentBg,
                    borderColor: mode.accentBorderCSS,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = mode.accent;
                    e.currentTarget.style.boxShadow = `0 24px 52px rgba(0,0,0,0.38), 0 0 0 1px ${mode.glowColor}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = mode.accentBorderCSS;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 13,
                      background: mode.accentBg,
                      border: `1px solid ${mode.accentBorderCSS}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: mode.accent,
                      flexShrink: 0,
                    }}
                  >
                    <mode.Icon size={22} aria-hidden="true" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      className="font-display font-semibold mb-2"
                      style={{
                        fontSize: 16,
                        color: 'var(--color-text)',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.3,
                      }}
                    >
                      {mode.headline}
                    </p>
                    <p
                      className="font-body"
                      style={{
                        fontSize: 13.5,
                        color: 'var(--color-text-sec)',
                        lineHeight: 1.65,
                      }}
                    >
                      {mode.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      paddingTop: 6,
                      borderTop: `1px solid ${mode.accentBorderCSS}`,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="font-body font-medium"
                      style={{ fontSize: 13, color: mode.accent }}
                    >
                      Seleccionar
                    </span>
                    <span style={{ color: mode.accent, fontSize: 14, lineHeight: 1 }}>→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedMode && (
          <div className="animate-fade-up" style={{ maxWidth: 480, margin: '0 auto' }}>
            <button
              onClick={() => { setStep(1); setSalaryError(''); setSalaryInput(''); }}
              className="btn-ghost mb-9"
              style={{ padding: '9px 18px', fontSize: 13.5 }}
            >
              <ArrowLeftIcon size={14} aria-hidden="true" />
              Volver
            </button>

            <p
              className="font-display font-semibold uppercase mb-3"
              style={{ fontSize: 10.5, color: selectedMode.accent, letterSpacing: '0.1em' }}
            >
              Modo {selectedMode.label}
            </p>

            <h1
              className="font-display font-extrabold mb-3"
              style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
                color: 'var(--color-text)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              ¿Cuánto recibes{' '}
              <span style={{ color: selectedMode.accent }}>
                {SALARY_LABELS[selectedMode.id].periodo}
              </span>?
            </h1>

            <p
              className="font-body mb-8"
              style={{ fontSize: 15, color: 'var(--color-text-sec)', lineHeight: 1.7 }}
            >
              Este será tu punto de partida para {SALARY_LABELS[selectedMode.id].articulo}.
              Podrás editarlo cuando quieras.
            </p>

            <div style={{ position: 'relative', marginBottom: salaryError ? 10 : 26 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 18,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-sec)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 22,
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}
              >
                $
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={salaryInput}
                onChange={e => { setSalaryInput(e.target.value); setSalaryError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleConfirmSalary()}
                autoFocus
                className="input-dark"
                style={{
                  paddingLeft: 42,
                  fontSize: 22,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  height: 66,
                  borderColor: salaryError ? 'var(--color-expense)' : undefined,
                }}
              />
            </div>

            {salaryError && (
              <p
                className="font-body mb-6"
                style={{ fontSize: 13.5, color: 'var(--color-expense)' }}
              >
                {salaryError}
              </p>
            )}

            <button
              className="btn-lime"
              onClick={handleConfirmSalary}
              style={{ width: '100%', justifyContent: 'center', height: 54, fontSize: 15.5 }}
            >
              Comenzar →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
