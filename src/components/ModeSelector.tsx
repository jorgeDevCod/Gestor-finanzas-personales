import { useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, CreditCard } from 'lucide-react';
import type { AppMode } from '../types/finance';

interface Props {
  onConfirm: (mode: AppMode, salary: number) => void;
  isChanging: boolean;
  onClose?: () => void;
}

const MODES: { id: AppMode; headline: string; description: string; accentClass: string }[] = [
  {
    id: 'daily',
    headline: 'Registro día a día',
    description: 'Sin salario base. Ideal para freelancers o seguimiento detallado.',
    accentClass: 'mode-accent-income',
  },
  {
    id: 'biweekly',
    headline: 'Salario quincenal',
    description: 'Parte de un salario fijo de quincena. Gastos descuentan, extras suman.',
    accentClass: 'mode-accent-lime',
  },
  {
    id: 'monthly',
    headline: 'Salario mensual',
    description: 'Define tu sueldo mensual y monitorea tu balance del mes.',
    accentClass: 'mode-accent-violet',
  },
];

const MODE_ICON = { daily: CalendarDays, biweekly: CreditCard, monthly: BarChart3 } as const;
const SALARY_PERIOD: Record<Exclude<AppMode, 'daily'>, { periodo: string; articulo: string }> = {
  biweekly: { periodo: 'quincenal', articulo: 'tu quincena' },
  monthly: { periodo: 'mensual', articulo: 'tu mes' },
};

/** Wizard de 2 pasos en modal (no bloquea con fullscreen salvo primer arranque, que lo decide App). */
export const ModeSelector = ({ onConfirm, isChanging, onClose }: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Exclude<AppMode, 'daily'> | null>(null);
  const [salaryInput, setSalaryInput] = useState('');
  const [salaryError, setSalaryError] = useState('');

  const pick = (id: AppMode) => {
    if (id === 'daily') {
      onConfirm('daily', 0);
      return;
    }
    setSelected(id);
    setStep(2);
  };

  const confirmSalary = () => {
    const salary = parseFloat(salaryInput);
    if (!salary || salary <= 0 || !Number.isFinite(salary)) {
      setSalaryError('Ingresa un monto válido mayor a cero.');
      return;
    }
    if (selected) onConfirm(selected, salary);
  };

  const back = () => {
    setStep(1);
    setSalaryError('');
    setSalaryInput('');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mode-title">
      <div className="modal-box modal-box-wide">
        {step === 1 && (
          <>
            <p className="eyebrow">{isChanging ? 'Elige un nuevo modo' : 'Configuración inicial'}</p>
            <h2 id="mode-title" className="modal-title">
              ¿Cómo quieres gestionar tus finanzas?
            </h2>
            <p className="modal-sub">Podrás cambiarlo cuando quieras sin perder tus registros.</p>
            <div className="mode-grid">
              {MODES.map((m) => {
                const Icon = MODE_ICON[m.id];
                return (
                  <button key={m.id} type="button" className={`mode-card ${m.accentClass}`} onClick={() => pick(m.id)}>
                    <span className="mode-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="mode-headline">{m.headline}</span>
                    <span className="mode-desc">{m.description}</span>
                    <span className="mode-cta">Seleccionar →</span>
                  </button>
                );
              })}
            </div>
            {isChanging && onClose && (
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            )}
          </>
        )}

        {step === 2 && selected && (
          <div className="salary-step">
            <button type="button" className="btn-ghost btn-sm" onClick={back}>
              <ArrowLeft size={14} aria-hidden="true" />
              Volver
            </button>
            <h2 className="modal-title">
              ¿Cuánto recibes {SALARY_PERIOD[selected].periodo}?
            </h2>
            <p className="modal-sub">
              Punto de partida para {SALARY_PERIOD[selected].articulo}. Podrás editarlo cuando quieras.
            </p>
            <div className="salary-wrap">
              <span className="salary-symbol" aria-hidden="true">
                $
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={salaryInput}
                onChange={(e) => {
                  setSalaryInput(e.target.value);
                  setSalaryError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmSalary();
                }}
                autoFocus
                className={`input-dark salary-input ${salaryError ? 'input-error' : ''}`}
                aria-label="Salario base"
                min="0"
                step="0.01"
                inputMode="decimal"
              />
            </div>
            {salaryError && (
              <p className="field-error" role="alert">
                {salaryError}
              </p>
            )}
            <button type="button" className="btn-lime btn-block" onClick={confirmSalary}>
              Comenzar →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
