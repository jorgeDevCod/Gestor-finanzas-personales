import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { GuideView } from '../utils/appGuide';
import { FEATURES, GUIDE_VIEW_LABEL, GUIDE_VIEW_ORDER } from '../utils/appGuide';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Salta al recorrido en un feature concreto. */
  onPick: (id: string) => void;
  /** Arranca el recorrido desde el principio. */
  onStartTour: () => void;
}

/** Índice: el catálogo completo de la app, agrupado por vista y buscable. */
export const GuideIndex = ({ open, onClose, onPick, onStartTour }: Props) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = FEATURES.filter(
      (f) =>
        q === '' ||
        f.title.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.text.toLowerCase().includes(q),
    );
    return GUIDE_VIEW_ORDER.map((view) => ({
      view,
      items: match.filter((f) => f.view === view),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="index-title">
      <div className="modal-box index-box">
        <div className="index-head">
          <div>
            <p className="eyebrow">Guía de uso</p>
            <h2 id="index-title" className="modal-title-sm">
              Todas las opciones de la app
            </h2>
          </div>
          <button type="button" className="icon-btn-44" onClick={onClose} aria-label="Cerrar la guía">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="index-search">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar una opción…"
            aria-label="Buscar una opción"
          />
        </div>

        <div className="index-scroll">
          {total === 0 && (
            <p className="index-empty">No encontramos nada con “{query}”. Prueba con otra palabra.</p>
          )}
          {groups.map((g) => (
            <section key={g.view} aria-label={GUIDE_VIEW_LABEL[g.view as GuideView]}>
              <p className="index-section">{GUIDE_VIEW_LABEL[g.view as GuideView]}</p>
              <ul className="index-list">
                {g.items.map((f) => (
                  <li key={f.id}>
                    <button type="button" className="index-item" onClick={() => onPick(f.id)}>
                      <span className="index-item-head">
                        <strong>{f.label}</strong>
                        <span className="index-item-title">{f.title}</span>
                      </span>
                      <span className="index-item-text">{f.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="index-foot">
          <button type="button" className="btn-lime btn-block" onClick={onStartTour}>
            Recorrer la app paso a paso
          </button>
        </div>
      </div>
    </div>
  );
};
