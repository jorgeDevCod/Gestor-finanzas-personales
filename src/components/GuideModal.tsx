import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

type GuideStep = {
  id: string;
  title: string;
  text: string;
  selector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
};

const STEPS: GuideStep[] = [
  // --- Resumen ---
  {
    id: 'resumen-1',
    title: 'Tu dinero disponible',
    text: 'Este es tu saldo actual: los ingresos suman y los gastos restan automáticamente.',
    selector: '.balance-total',
    position: 'top',
  },
  {
    id: 'resumen-2',
    title: 'Registrar movimiento',
    text: 'Toca el botón + de abajo para anotar un gasto o entrada en segundos.',
    selector: '.fab',
    position: 'right',
  },
  {
    id: 'resumen-3',
    title: 'Cambia tu modo',
    text: 'Elige Diario, Quincena o Mensual. Cada uno calcula tu disponible de forma distinta.',
    selector: '.balance-actions button:first-of-type',
    position: 'left',
  },
  {
    id: 'resumen-4',
    title: 'Tema claro u oscuro',
    text: 'Cambia el aspecto de la app. Se recuerda tu elección.',
    selector: '.icon-btn',
    position: 'left',
  },
  // --- Movimientos ---
  {
    id: 'movimientos-1',
    title: 'Hoy',
    text: 'Abre o crea el registro del día actual para anotar ingresos y gastos.',
    selector: '.toolbar .btn-lime',
    position: 'top',
  },
  {
    id: 'movimientos-2',
    title: 'Fecha',
    text: 'Selecciona cualquier otra fecha (excepto futura) para registrar movimientos.',
    selector: '.toolbar .btn-secondary',
    position: 'top',
  },
  {
    id: 'movimientos-3',
    title: 'Abrir un día',
    text: 'Toca cualquier día de la lista para expandirlo y ver sus ingresos y gastos.',
    selector: '.day-header',
    position: 'top',
  },
  {
    id: 'movimientos-4',
    title: 'Agregar gasto o entrada',
    text: 'Dentro de un día abierto, toca Registrar gasto o Registrar entrada.',
    selector: '.cta-expense, .cta-income',
    position: 'top',
  },
  // --- Ajustes ---
  {
    id: 'ajustes-1',
    title: 'Modo de gestión',
    text: 'Define si gestionas por Diario, Quincena o Mes. Afecta cómo se calcula tu disponible.',
    selector: '.balance-actions button:first-of-type',
    position: 'left',
  },
  {
    id: 'ajustes-2',
    title: 'Apariencia',
    text: 'Cambia entre tema claro y oscuro. Se recuerda tu elección.',
    selector: '.topbar .icon-btn',
    position: 'top',
  },
  {
    id: 'ajustes-3',
    title: 'Instalar aplicación',
    text: 'Agrega Mis Finanzas a tu pantalla de inicio para usarla como app nativa, incluso sin conexión.',
    selector: '.install-btn',
    position: 'top',
  },
  {
    id: 'ajustes-4',
    title: 'Exportar tus datos',
    text: 'Descarga todos tus registros en texto plano (TXT) o hoja de cálculo (Excel).',
    selector: '.set-row:first-of-type',
    position: 'top',
  },
  {
    id: 'ajustes-5',
    title: 'Borrar registros',
    text: 'Elimina todos los movimientos. Tu modo y salario se conservan.',
    selector: '.set-row-danger',
    position: 'top',
  },
];

export const GuideModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const trapRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const currentStep = STEPS[stepIndex];
  const totalSteps = STEPS.length;
  const isLast = stepIndex === totalSteps - 1;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextStep();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevStep();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const nextStep = () => {
    if (stepIndex < totalSteps - 1) setStepIndex((s) => s + 1);
    else onClose();
  };

  const prevStep = () => {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  };

  // Calcular posición del globo respecto al elemento objetivo
  const [bubbleRect, setBubbleRect] = useState<{
    top: number;
    left: number;
    arrowPos: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !currentStep?.selector) {
      setBubbleRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(currentStep.selector);
    if (!el) {
      setBubbleRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const bubbleW = 340;
    const bubbleH = 240;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    let top = rect.top - bubbleH - 16;
    let left = rect.left + rect.width / 2 - bubbleW / 2;
    let arrowPos = 'center';

    if (top < 8) {
      top = rect.bottom + 16;
      arrowPos = 'bottom';
    }
    if (top + bubbleH > vpH - 8) {
      top = rect.top - bubbleH - 16;
      arrowPos = 'top';
    }
    if (left < 8) {
      left = 8;
      arrowPos = 'left';
    }
    if (left + bubbleW > vpW - 8) {
      left = vpW - bubbleW - 8;
      arrowPos = 'right';
    }

    setBubbleRect({ top, left, arrowPos });
  }, [open, currentStep?.selector]);

  if (!open) return null;

  return (
    <div className="guide-overlay" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      {/* Fondo oscuro que cubre todo */}
      <div className="guide-mask" />

      {/* Globo flotante */}
      <div
        className="guide-bubble"
        ref={trapRef}
        style={{
          top: bubbleRect?.top ?? '50%',
          left: bubbleRect?.left ?? '50%',
          transform: bubbleRect ? 'none' : 'translate(-50%, -50%)',
          ...(bubbleRect?.arrowPos ? { '--arrow-pos': bubbleRect.arrowPos } : {}),
        }}
      >
        <div className="guide-header">
          <h2 id="guide-title" className="guide-title">
            {currentStep.title}
          </h2>
          <button
            type="button"
            className="guide-close"
            onClick={onClose}
            aria-label="Cerrar guía"
          >
            <Check size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="guide-body">
          <p className="guide-text">{currentStep.text}</p>
        </div>

        {/* Navegación */}
        <div className="guide-nav">
          <div className="guide-counter">
            {stepIndex + 1} de {totalSteps}
          </div>
          <div className="guide-buttons">
            <button
              type="button"
              className="guide-btn guide-btn-outline"
              disabled={stepIndex === 0}
              onClick={prevStep}
              aria-label="Anterior"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Atrás
            </button>
            <button
              type="button"
              className="guide-btn guide-btn-primary"
              onClick={nextStep}
              aria-label={isLast ? 'Terminar guía' : 'Siguiente'}
            >
              {isLast ? 'Entendido' : 'Siguiente'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Si hay objetivo en el DOM, dibuja el resaltado */}
      {currentStep.selector && targetRef.current && (
        <div className="guide-highlight" ref={targetRef} />
      )}
    </div>
  );
};
