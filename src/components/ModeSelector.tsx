import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CreditCard,
  Wallet,
} from 'lucide-react';
import type { AppMode } from '../types/finance';
import { initialOnboardingStep, needsSalaryStep } from '../utils/modeFlow';
import { useFocusTrap } from './dialogs';

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

const MODES: {
  id: AppMode;
  headline: string;
  description: string;
  accentClass: string;
  badge?: string;
}[] = [
  {
    id: 'daily',
    headline: 'Hoy',
    description: 'Sin montos iniciales. Registras y ves tu saldo al instante.',
    accentClass: 'mode-accent-income',
    badge: 'Recomendado',
  },
  {
    id: 'biweekly',
    headline: 'Quincena',
    description: 'Tu disponible del 1 al 15 y del 16 a fin de mes.',
    accentClass: 'mode-accent-lime',
  },
  {
    id: 'monthly',
    headline: 'Mes',
    description: 'Tu presupuesto del día 1 al último día del mes.',
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

const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="step-dots" aria-hidden="true">
    {Array.from({ length: total }, (_, i) => (
      <span key={i} className={i === current ? 'step-dot step-dot-active' : 'step-dot'} />
    ))}
  </div>
);

/** Asistente en una sola pantalla: bienvenida + modos, y monto solo si falta. */
export const ModeSelector = ({ onConfirm, isChanging, savedSalaryFor, currentMode, startAtSalaryStep, onClose }: Props) => {
  const editMode: Exclude<AppMode, 'daily'> | null =
    startAtSalaryStep && currentMode !== 'daily' ? currentMode : null;
  const [step, setStep] = useState<1 | 2>(() =>
    initialOnboardingStep({ isChanging, editingSalary: editMode !== null }),
  );
  const [selected, setSelected] = useState<Exclude<AppMode, 'daily'> | null>(editMode);
  const [salaryInput, setSalaryInput] = useState(() => {
    const saved = editMode ? savedSalaryFor(editMode) : 0;
    return saved > 0 ? String(saved) : '';
  });
  const [salaryError, setSalaryError] = useState('');
  const trapRef = useFocusTrap(true);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (step === 2) back();
      else if (step === 1 && isChanging && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const selectedSaved = selected ? savedSalaryFor(selected) : 0;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mode-title">
      <div className="modal-box modal-box-wide" ref={trapRef}>
        {step === 1 && (
          <>
            {!isChanging && (
              <div className="welcome-head">
                <span className="welcome-emblem" aria-hidden="true">
                  <Wallet size={24} />
                </span>
                <p className="eyebrow">Bienvenido a Mis Finanzas</p>
                <h2 id="mode-title" className="welcome-title">
                  Tus finanzas, bajo control
                </h2>
              </div>
            )}
            {isChanging ? (
              <h2 id="mode-title" className="modal-title">
                Elige un nuevo modo
              </h2>
            ) : (
              <>
                <p className="eyebrow">Paso 1 de 2</p>
                <h2 className="modal-title-sm">¿Cada cuánto recibes tu dinero?</h2>
              </>
            )}
            <p className="modal-sub">Elige y empieza en segundos. Podrás cambiarlo después sin perder nada.</p>
            <div className="mode-grid">
              {MODES.map((m) => {
                const Icon = MODE_ICON[m.id];
                return (
                  <button key={m.id} type="button" className={`mode-card ${m.accentClass}`} onClick={() => pick(m.id)}>
                    <span className="mode-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="mode-headline">
                      {m.headline}
                      {m.badge && <span className="mode-badge">{m.badge}</span>}
                    </span>
                    <span className="mode-desc">{m.description}</span>
                    <span className="mode-cta">Seleccionar →</span>
                  </button>
                );
              })}
            </div>
            {!isChanging && (
              <>
                <StepDots current={0} total={2} />
                <p className="trust-line">Sin cuentas · Tus datos se quedan en tu dispositivo · Funciona sin conexión</p>
              </>
            )}
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
            {!isChanging && (
              <p className="eyebrow" style={{ marginTop: 18 }}>
                Paso 2 de 2
              </p>
            )}
            <h2 className="modal-title">
              ¿Cuánto recibes {SALARY_PERIOD[selected].periodo}?
            </h2>
            <p className="modal-sub">
              Solo se usa para calcular tu disponible. Podrás editarlo cuando quieras.
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
            {!isChanging && <StepDots current={1} total={2} />}
          </div>
        )}
      </div>
    </div>
  );
};
