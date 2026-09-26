import { useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, CreditCard } from 'lucide-react';
import type { AppMode } from '../types/finance';
import { needsSalaryStep } from '../utils/modeFlow';

interface Props {
  onConfirm: (mode: AppMode, salary: number) => void;
  isChanging: boolean;
  /** Salario guardado de cada modo (claves independientes, no se entreveran). */
  savedSalaryFor: (mode: Exclude<AppMode, 'daily'>) => number;
  /** Modo actual al abrir (para edición directa del salario). */
  currentMode: AppMode | null;
  /** true al abrir desde "Editar salario": va directo al paso de monto. */
  startAtSalaryStep: boolean;
  onClose?: () => void;
}

const MODES: { id: AppMode; headline: string; description: string; accentClass: string }[] = [
  {
    id: 'daily',
    headline: 'Hoy',
    description: 'Controla cuánto dinero tienes y cómo cambia con cada movimiento.',
    accentClass: 'mode-accent-income',
  },
  {
    id: 'biweekly',
    headline: 'Quincena',
    description: 'Administra tu dinero entre cada quincena. Del 1 al 15 y del 16 al último día del mes.',
    accentClass: 'mode-accent-lime',
  },
  {
    id: 'monthly',
    headline: 'Mes',
    description: 'Controla tu presupuesto durante todo el mes. Del día 1 al último día del mes.',
    accentClass: 'mode-accent-violet',
  },
];

const MODE_ICON = { daily: CalendarDays, biweekly: CreditCard, monthly: BarChart3 } as const;
const SALARY_PERIOD: Record<Exclude<AppMode, 'daily'>, { periodo: string; articulo: string; nota: string }> = {
  biweekly: {
    periodo: 'quincenal',
    articulo: 'tu quincena',
    nota: 'Tu quincena va del 1 al 15 o del 16 al último día del mes. Solo cuentan los movimientos de la quincena actual.',
  },
  monthly: {
    periodo: 'mensual',
    articulo: 'tu mes',
    nota: 'Tu mes va del día 1 al último día del mes. Solo cuentan los movimientos del mes actual.',
  },
};

/** Wizard de modos. Si el modo ya tiene monto, entra directo sin pedirlo. */
export const ModeSelector = ({ onConfirm, isChanging, savedSalaryFor, currentMode, startAtSalaryStep, onClose }: Props) => {
  const editMode: Exclude<AppMode, 'daily'> | null =
    startAtSalaryStep && currentMode !== 'daily' ? currentMode : null;
  const [step, setStep] = useState<1 | 2>(editMode ? 2 : 1);
  const [selected, setSelected] = useState<Exclude<AppMode, 'daily'> | null>(editMode);
  const [salaryInput, setSalaryInput] = useState(() => {
    const saved = editMode ? savedSalaryFor(editMode) : 0;
    return saved > 0 ? String(saved) : '';
  });
  const [salaryError, setSalaryError] = useState('');

  const pick = (id: AppMode) => {
    if (id === 'daily') {
      onConfirm('daily', 0);
      return;
    }
    const saved = savedSalaryFor(id);
    // Modo ya creado con su monto: entrar directo, sin pedir nada.
    if (!needsSalaryStep(id, saved)) {
      onConfirm(id, saved);
      return;
    }
    // Sin monto en ese modo: pedirlo vacío para ese modo.
    setSelected(id);
    setSalaryInput('');
    setSalaryError('');
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

  const selectedSaved = selected ? savedSalaryFor(selected) : 0;

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
              <br />
              {SALARY_PERIOD[selected].nota}
              {selectedSaved > 0 && (
                <>
                  <br />
                  Tienes ${selectedSaved.toLocaleString('es-ES')} guardado en este modo: déjalo igual o escribe uno nuevo.
                </>
              )}
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
