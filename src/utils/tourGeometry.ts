import type { FeatureDoc, Placement } from './appGuide';

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  /** Radio de borde real del elemento (para que el spotlight encaje). */
  radius?: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface TooltipPlacement {
  top: number;
  left: number;
  /** Distancia del borde de la burbuja al centro del objetivo (para la flecha). */
  arrow: number;
  placement: Placement | 'center';
}

const GAP = 14;

const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max);

/**
 * Coloca la burbuja junto al objetivo sin salirse nunca del viewport.
 * Prueba la posición preferida, la opuesta y las perpendiculares; si ninguna
 * cabe, centra la burbuja. La flecha se clampa para que apunte al objetivo.
 */
export const placeTooltip = (
  target: Rect,
  tip: Size,
  viewport: Size,
  preferred: Placement,
): TooltipPlacement => {
  const targetCx = target.left + target.width / 2;
  const targetCy = target.top + target.height / 2;

  const fits = (p: Placement): boolean => {
    if (p === 'top') return target.top - GAP - tip.h >= 0;
    if (p === 'bottom') return target.top + target.height + GAP + tip.h <= viewport.h;
    if (p === 'left') return target.left - GAP - tip.w >= 0;
    return target.left + target.width + GAP + tip.w <= viewport.w;
  };

  const opposite: Record<Placement, Placement> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };

  const order: Placement[] = [preferred, opposite[preferred], ...(['top', 'bottom', 'left', 'right'] as Placement[]).filter(
    (p) => p !== preferred && p !== opposite[preferred],
  )];

  const chosen = order.find(fits) ?? 'center';

  if (chosen === 'center') {
    return {
      top: clamp(targetCy - tip.h / 2, 8, Math.max(8, viewport.h - tip.h - 8)),
      left: clamp(targetCx - tip.w / 2, 8, Math.max(8, viewport.w - tip.w - 8)),
      arrow: clamp(targetCx, 8 + 16, Math.max(8 + 16, viewport.w - 8 - 16)),
      placement: 'center',
    };
  }

  let top = 0;
  let left = 0;
  let arrow = 0;

  if (chosen === 'top') {
    top = target.top - GAP - tip.h;
    left = targetCx - tip.w / 2;
    arrow = targetCx - left;
  } else if (chosen === 'bottom') {
    top = target.top + target.height + GAP;
    left = targetCx - tip.w / 2;
    arrow = targetCx - left;
  } else if (chosen === 'left') {
    top = targetCy - tip.h / 2;
    left = target.left - GAP - tip.w;
    arrow = targetCy - top;
  } else {
    top = targetCy - tip.h / 2;
    left = target.left + target.width + GAP;
    arrow = targetCy - top;
  }

  const maxLeft = Math.max(8, viewport.w - tip.w - 8);
  const maxTop = Math.max(8, viewport.h - tip.h - 8);
  left = clamp(left, 8, maxLeft);
  top = clamp(top, 8, maxTop);

  // La flecha sigue apuntando al objetivo aunque la burbuja se haya movido.
  if (chosen === 'top' || chosen === 'bottom') {
    arrow = clamp(targetCx - left, 16, Math.max(16, tip.w - 16));
  } else {
    arrow = clamp(targetCy - top, 16, Math.max(16, tip.h - 16));
  }

  return { top, left, arrow, placement: chosen };
};

/**
 * Filtra los pasos disponibles: si un feature opcional no está en el DOM
 * (por ejemplo no hay días registrados), se omite del recorrido.
 */
export const resolveAvailableSteps = (
  features: FeatureDoc[],
  exists: (id: string) => boolean,
): FeatureDoc[] => features.filter((f) => !f.optional || exists(f.id));
