import { useEffect, useRef, useState } from 'react';
import { featureById } from '../utils/appGuide';

interface Props {
  /** Desactiva los hints (p. ej. mientras el tour está abierto). */
  disabled?: boolean;
}

/**
 * Pista flotante: al enfocar (teclado) o pasar el mouse por un elemento con
 * `data-guide`, muestra su explicación. Usa el mismo catálogo que el tour.
 */
export const GuideHint = ({ disabled = false }: Props) => {
  const [hint, setHint] = useState<{ id: string; x: number; y: number; above: boolean } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (disabled) {
      setHint(null);
      return;
    }

    let active: HTMLElement | null = null;

    const show = (el: HTMLElement) => {
      const id = el.getAttribute('data-guide');
      if (!id || !featureById(id)) return;
      const r = el.getBoundingClientRect();
      const above = r.top > 150;
      setHint({ id, x: r.left + r.width / 2, y: above ? r.top - 10 : r.bottom + 10, above });
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-guide]');
      if (!el || el === active) return;
      active = el;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => show(el), 350);
    };

    const onOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-guide]');
      if (!el) return;
      active = null;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setHint(null);
    };

    const onFocus = (e: FocusEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-guide]');
      if (el) show(el);
      else setHint(null);
    };

    const onBlur = () => setHint(null);

    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [disabled]);

  if (!hint) return null;
  const feature = featureById(hint.id);
  if (!feature) return null;

  return (
    <span
      className={`tour-hint${hint.above ? ' tour-hint-above' : ''}`}
      role="tooltip"
      style={{ left: hint.x, top: hint.y }}
    >
      <strong>{feature.title}</strong>
      <span>{feature.text}</span>
    </span>
  );
};
