import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppView } from '../types/finance';
import type { FeatureDoc } from '../utils/appGuide';
import { tourFeatures } from '../utils/appGuide';
import { placeTooltip, resolveAvailableSteps, type Rect, type Size, type TooltipPlacement } from '../utils/tourGeometry';

const TIP_W = 300;
const TIP_H = 150;

export interface TourState {
  /** Paso actual del recorrido (o null si el tour está cerrado). */
  step: FeatureDoc | null;
  index: number;
  total: number;
  /** Rectángulo del elemento señalado, en coordenadas de viewport. */
  target: Rect | null;
  placement: TooltipPlacement | null;
  next: () => void;
  prev: () => void;
  close: () => void;
  /** Arranca el recorrido (opcionalmente desde un feature concreto). */
  start: (fromId?: string) => void;
  /** Salta a un feature concreto (desde el índice). */
  jumpTo: (id: string) => void;
}

const findEl = (id: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-guide="${id}"]`);

const measure = (el: HTMLElement): Rect => {
  const r = el.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 10;
  return { top: r.top, left: r.left, width: r.width, height: r.height, radius };
};

const exists = (id: string): boolean => findEl(id) !== null;

/**
 * Estado del recorrido guiado: mide el elemento real en el DOM, mantiene el
 * spotlight pegado a él (scroll/resize) y salta de vista cuando el paso
 * pertenece a otra vista.
 */
export const useTour = (
  currentView: AppView,
  onNavigate: (view: AppView) => void,
): TourState => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<Rect | null>(null);
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);
  const pendingView = useRef<AppView | null>(null);
  const stepsRef = useRef<FeatureDoc[]>([]);

  const start = useCallback((fromId?: string) => {
    stepsRef.current = resolveAvailableSteps(tourFeatures(), exists);
    if (stepsRef.current.length === 0) return;
    const idx = fromId ? stepsRef.current.findIndex((s) => s.id === fromId) : 0;
    setIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setTarget(null);
    setPlacement(null);
  }, []);

  const steps = stepsRef.current;
  const step = open && steps.length > 0 ? steps[Math.min(index, steps.length - 1)] : null;

  // Cambia de vista si el paso pertenece a otra y mide cuando ya está montado.
  useEffect(() => {
    if (!open || !step) return;
    if (step.view !== 'global' && step.view !== currentView) {
      if (pendingView.current !== step.view) {
        pendingView.current = step.view;
        onNavigate(step.view);
      }
      return;
    }
    pendingView.current = null;

    let raf = 0;
    const update = () => {
      const el = findEl(step.id);
      if (!el) {
        setTarget(null);
        setPlacement(null);
        return;
      }
      const rect = measure(el);
      setTarget(rect);
      const vp: Size = { w: window.innerWidth, h: window.innerHeight };
      setPlacement(placeTooltip(rect, { w: TIP_W, h: TIP_H }, vp, step.placement));
    };

    // Espera al layout (la vista acaba de cambiar) antes de medir.
    raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, step, currentView, onNavigate]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= stepsRef.current.length - 1) {
        setOpen(false);
        return i;
      }
      return i + 1;
    });
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const jumpTo = useCallback(
    (id: string) => {
      const all = resolveAvailableSteps(tourFeatures(), exists);
      stepsRef.current = all;
      const idx = all.findIndex((s) => s.id === id);
      if (idx < 0) return;
      setIndex(idx);
      setOpen(true);
    },
    [],
  );

  return {
    step,
    index: Math.min(index, Math.max(0, steps.length - 1)),
    total: steps.length,
    target,
    placement,
    next,
    prev,
    close,
    start,
    jumpTo,
  };
};
