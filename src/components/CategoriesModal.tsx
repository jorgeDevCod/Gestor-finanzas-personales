import { useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import type { Category, CategoryKind } from '../types/finance';
import { useFocusTrap } from './dialogs';

interface Props {
  open: boolean;
  categories: Category[];
  /** Renombra; retorna true si se aplicó (para salir del modo edición). */
  onRename: (id: string, name: string) => boolean;
  /** Pide eliminar (App muestra el ConfirmDialog con el conteo). */
  onRequestDelete: (id: string) => void;
  onClose: () => void;
}

const KIND_TITLE: Record<CategoryKind, string> = {
  expense: 'Gastos',
  income: 'Ingresos',
};

/** Gestión mínima: renombrar y eliminar por tipo. Eliminar jamás borra movimientos. */
export const CategoriesModal = ({ open, categories, onRename, onRequestDelete, onClose }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (open) {
      setEditingId(null);
      setDraft('');
    }
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const startRename = (cat: Category) => {
    setEditingId(cat.id);
    setDraft(cat.name);
  };

  const confirmRename = () => {
    if (editingId && onRename(editingId, draft)) {
      setEditingId(null);
      setDraft('');
    }
  };

  const renderGroup = (kind: CategoryKind) => {
    const items = categories.filter((c) => c.kind === kind);
    return (
      <section aria-label={`Categorías de ${KIND_TITLE[kind].toLowerCase()}`}>
        <h3 className={`col-title ${kind === 'income' ? 'col-title-income' : 'col-title-expense'}`}>
          {KIND_TITLE[kind]}
        </h3>
        {items.length === 0 ? (
          <p className="mov-empty">Sin categorías aquí todavía. Créalas con + al registrar.</p>
        ) : (
          <ul className="cat-manage-list">
            {items.map((cat) => (
              <li key={cat.id} className="cat-manage-row">
                {editingId === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          confirmRename();
                        } else if (e.key === 'Escape') {
                          e.stopPropagation();
                          setEditingId(null);
                          setDraft('');
                        }
                      }}
                      autoFocus
                      maxLength={24}
                      aria-label={`Nuevo nombre para ${cat.name}`}
                      className="input-dark cat-manage-input"
                    />
                    <button
                      type="button"
                      className="icon-btn-44 icon-btn-confirm"
                      aria-label="Guardar nuevo nombre"
                      title="Guardar"
                      onClick={confirmRename}
                    >
                      <Check size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-44"
                      aria-label="Cancelar renombrado"
                      title="Cancelar"
                      onClick={() => {
                        setEditingId(null);
                        setDraft('');
                      }}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="cat-manage-name">{cat.name}</span>
                    <button
                      type="button"
                      className="icon-btn-44"
                      aria-label={`Renombrar ${cat.name}`}
                      title="Renombrar"
                      onClick={() => startRename(cat)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-44 mini-btn-danger"
                      aria-label={`Eliminar ${cat.name}`}
                      title="Eliminar"
                      onClick={() => onRequestDelete(cat.id)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cat-title">
      <div className="modal-box" ref={trapRef}>
        <p className="eyebrow">Organiza</p>
        <h2 id="cat-title" className="modal-title-sm">
          Categorías
        </h2>
        <p className="modal-sub">
          Renombra o elimina. Al eliminar, sus movimientos pasan a “Sin categoría”: nunca se borran.
        </p>
        {renderGroup('expense')}
        {renderGroup('income')}
        <div className="modal-actions">
          <button type="button" className="btn-lime" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
