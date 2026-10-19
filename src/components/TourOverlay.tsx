import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { GuideView } from '../utils/appGuide';
import { GUIDE_VIEW_LABEL } from '../utils/appGuide';
import type { TourState } from '../hooks/useTour';

interface Props {
  tour: TourState;
}

/**
 * Coachmark: un spotlight perforado sobre el elemento real + burbuja anclada
 * + barra de control inferior. La app queda visible alrededor (no se tapa).
 */
export const TourOverlay = ({ tour }: Props) => {
  const { step, index, total, target, placement, next, prev, close } = tour;
  const barRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, next, prev, close]);

  useEffect(() => {
    if (step) tipRef.current?.focus();
  }, [step]);

  if (!step) return null;

  const isLast = index >= total - 1;

  return (
    <>
      {/* Spotlight: hueco exacto sobre el elemento (box-shadow perfora el resto) */}
      {target && (
        <div
          className="tour-spot"
          aria-hidden="true"
          style={{
            top: target.top,
            left: target.left,
            width: target.width,
            height: target.height,
            borderRadius: target.radius ?? 10,
          }}
        />
      )}

      {/* Burbuja anclada al elemento */}
      {placement && (
        <div
          className={`tour-tip tour-tip-${placement.placement}`}
          ref={tipRef}
          role="dialog"
          aria-modal="false"
          aria-label={`${step.title}. Paso ${index + 1} de ${total}`}
          tabIndex={-1}
          style={{ top: placement.top, left: placement.left }}
        >
          <span
            className="tour-arrow"
            aria-hidden="true"
            style={
              placement.placement === 'top' || placement.placement === 'bottom'
                ? { left: placement.arrow }
                : { top: placement.arrow }
            }
          />
          <div className="tour-tip-head">
            <span className="tour-chip">{GUIDE_VIEW_LABEL[step.view as GuideView]}</span>
            <span className="tour-count">{index + 1}/{total}</span>
          </div>
          <h2 className="tour-title">{step.title}</h2>
          <p className="tour-text">{step.text}</p>
        </div>
      )}

      {/* Barra de control (no tapa la app) */}
      <div className="tour-bar" ref={barRef}>
        <button type="button" className="tour-close" onClick={close} aria-label="Cerrar la guía">
          <X size={16} aria-hidden="true" />
        </button>
        <div className="tour-bar-progress" aria-hidden="true">
          <span style={{ width: `${((index + 1) / Math.max(total, 1)) * 100}%` }} />
        </div>
        <div className="tour-bar-actions">
          <button
            type="button"
            className="tour-btn tour-btn-outline"
            onClick={prev}
            disabled={index === 0}
            aria-label="Paso anterior"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Atrás
          </button>
          <button type="button" className="tour-btn tour-btn-primary" onClick={next} aria-label={isLast ? 'Terminar guía' : 'Paso siguiente'}>
            {isLast ? 'Listo' : 'Siguiente'}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
};
