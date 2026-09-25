import { useEffect, useState } from 'react';
import type { Notice } from '../hooks/useFinance';
import { todayISO } from '../utils/dates';

/** Toasts no bloqueantes (sustituyen alert/confirm nativos). */
export const Toasts = ({ notices }: { notices: Notice[] }) => (
  <div className="toast-stack" aria-live="polite" aria-atomic="false">
    {notices.map((n) => (
      <div key={n.id} className={`toast toast-${n.kind}`} role="status">
        {n.text}
      </div>
    ))}
  </div>
);

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación accesible (sustituye window.confirm). */
export const ConfirmDialog = ({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-box">
        <h2 id="confirm-title" className="modal-title-sm">
          {title}
        </h2>
        <p className="modal-sub">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface DateModalProps {
  open: boolean;
  onConfirm: (iso: string) => void;
  onClose: () => void;
}

/** Selector de fecha para crear un día (valida en el hook, sin alert). */
export const DateModal = ({ open, onConfirm, onClose }: DateModalProps) => {
  const [value, setValue] = useState(todayISO());

  useEffect(() => {
    if (open) setValue(todayISO());
  }, [open ]);

  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="date-title">
      <div className="modal-box">
        <p className="eyebrow">Nuevo registro</p>
        <h2 id="date-title" className="modal-title-sm">
          Selecciona una fecha
        </h2>
        <label htmlFor="date-picker" className="sr-only">
          Fecha del registro
        </label>
        <input
          id="date-picker"
          type="date"
          value={value}
          max={todayISO()}
          onChange={(e) => setValue(e.target.value)}
          className="input-dark input-block"
        />
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn-lime" onClick={() => onConfirm(value)}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
