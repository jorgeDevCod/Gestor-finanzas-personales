import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  MinusCircle,
  Moon,
  Palette,
  Plus,
  ReceiptText,
  Tags,
  Trash2,
  Wallet,
} from 'lucide-react';
import { GUIDE_SECTIONS, GUIDE_STEPS, type GuideStepMeta } from '../utils/guideSteps';
import { useFocusTrap } from './dialogs';

/* ────────── Mockups: miniaturas de la interfaz real ────────── */

const MockShell = ({ children }: { children: ReactNode }) => (
  <div className="guide-mock" aria-hidden="true">
    <div className="guide-mock-bar">
      <span className="guide-mock-dot" />
      <span className="guide-mock-dot" />
      <span className="guide-mock-dot" />
    </div>
    <div className="guide-mock-body">{children}</div>
  </div>
);

const MockLine = ({ w, tone }: { w: string; tone?: 'pos' | 'exp' | 'muted' }) => (
  <span className={`guide-mock-line${tone ? ` guide-mock-line-${tone}` : ''}`} style={{ width: w }} />
);

const mockBalance = (
  <MockShell>
    <div className="guide-mock-card">
      <MockLine w="42%" tone="muted" />
      <MockLine w="62%" tone="pos" />
      <div className="guide-mock-row">
        <MockLine w="26%" tone="muted" />
        <MockLine w="26%" tone="muted" />
        <MockLine w="26%" tone="muted" />
      </div>
    </div>
  </MockShell>
);

const mockFab = (
  <MockShell>
    <div className="guide-mock-card guide-mock-card-short">
      <MockLine w="80%" tone="muted" />
      <MockLine w="55%" />
    </div>
    <span className="guide-mock-fab">
      <Plus size={18} />
    </span>
  </MockShell>
);

const mockActions = (
  <MockShell>
    <div className="guide-mock-row">
      <span className="guide-mock-chip">Modo</span>
      <span className="guide-mock-chip">Editar</span>
      <span className="guide-mock-chip guide-mock-chip-danger">Reiniciar</span>
    </div>
    <MockLine w="70%" tone="muted" />
  </MockShell>
);

const mockTheme = (
  <MockShell>
    <div className="guide-mock-row">
      <span className="guide-mock-theme">
        <Moon size={16} />
      </span>
      <span className="guide-mock-theme guide-mock-theme-alt">
        <Palette size={16} />
      </span>
    </div>
    <MockLine w="60%" tone="muted" />
  </MockShell>
);

const mockToolbar = (
  <MockShell>
    <div className="guide-mock-row">
      <span className="guide-mock-chip guide-mock-chip-primary">Hoy</span>
      <span className="guide-mock-chip">Fecha</span>
    </div>
    <div className="guide-mock-card guide-mock-card-short">
      <MockLine w="85%" />
      <MockLine w="50%" tone="muted" />
    </div>
  </MockShell>
);

const mockDay = (
  <MockShell>
    <div className="guide-mock-card guide-mock-card-short">
      <div className="guide-mock-row">
        <MockLine w="55%" />
        <span className="guide-mock-chip guide-mock-chip-soft">+120</span>
      </div>
      <MockLine w="40%" tone="muted" />
    </div>
  </MockShell>
);

const mockCta = (
  <MockShell>
    <div className="guide-mock-row">
      <span className="guide-mock-chip guide-mock-chip-expense">Gasto</span>
      <span className="guide-mock-chip guide-mock-chip-primary">Entrada</span>
    </div>
    <MockLine w="75%" tone="muted" />
  </MockShell>
);

const mockList = (
  <MockShell>
    <div className="guide-mock-card guide-mock-card-short">
      <div className="guide-mock-row">
        <MockLine w="45%" />
        <MockLine w="18%" tone="exp" />
      </div>
      <div className="guide-mock-row">
        <MockLine w="38%" />
        <MockLine w="22%" tone="pos" />
      </div>
    </div>
  </MockShell>
);

const mockSettings = (
  <MockShell>
    <div className="guide-mock-card guide-mock-card-short">
      <div className="guide-mock-row">
        <MockLine w="52%" />
        <MockLine w="14%" tone="muted" />
      </div>
      <div className="guide-mock-row">
        <MockLine w="44%" />
        <MockLine w="18%" tone="muted" />
      </div>
    </div>
  </MockShell>
);

const mockExport = (
  <MockShell>
    <div className="guide-mock-row">
      <span className="guide-mock-chip">
        <FileText size={12} />
        TXT
      </span>
      <span className="guide-mock-chip">
        <FileSpreadsheet size={12} />
        Excel
      </span>
    </div>
    <MockLine w="65%" tone="muted" />
  </MockShell>
);

const MOCKS: Record<string, ReactNode> = {
  'resumen-saldo': mockBalance,
  'resumen-modo': mockActions,
  'resumen-metricas': mockList,
  'resumen-registrar': mockFab,
  'mov-hoy': mockToolbar,
  'mov-fecha': mockToolbar,
  'mov-dia': mockDay,
  'mov-gasto': mockCta,
  'ajustes-apariencia': mockTheme,
  'ajustes-categorias': mockSettings,
  'ajustes-exportar': mockExport,
  'ajustes-instalar': mockToolbar,
  'ajustes-borrar': mockSettings,
};

const ICONS: Record<string, typeof Wallet> = {
  'resumen-saldo': Wallet,
  'resumen-modo': LayoutDashboard,
  'resumen-metricas': ReceiptText,
  'resumen-registrar': Plus,
  'mov-hoy': CalendarDays,
  'mov-fecha': CalendarDays,
  'mov-dia': CalendarDays,
  'mov-gasto': MinusCircle,
  'ajustes-apariencia': Palette,
  'ajustes-categorias': Tags,
  'ajustes-exportar': Download,
  'ajustes-instalar': Wallet,
  'ajustes-borrar': Trash2,
};

/** Guía visual: una tarjeta por opción, con miniatura, avance y navegación. */
export const GuideModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [index, setIndex] = useState(0);
  const trapRef = useFocusTrap(open);

  const step: GuideStepMeta = GUIDE_STEPS[index];
  const isLast = index === GUIDE_STEPS.length - 1;

  useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  const goNext = () => {
    if (index < GUIDE_STEPS.length - 1) setIndex((i) => i + 1);
    else onClose();
  };

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  const Icon = ICONS[step.id] ?? Wallet;

  return (
    <div className="guide-overlay" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="guide-backdrop" onClick={onClose} />
      <div className="guide-card" ref={trapRef}>
        <div className="guide-card-head">
          <span className="guide-chip">{GUIDE_SECTIONS[step.section]}</span>
          <span className="guide-count">
            {index + 1} / {GUIDE_STEPS.length}
          </span>
        </div>

        <div className="guide-visual">
          <span className="guide-badge" aria-hidden="true">
            <Icon size={26} />
          </span>
          {MOCKS[step.id] ?? mockBalance}
        </div>

        <h2 id="guide-title" className="guide-title">
          {step.title}
        </h2>
        <p className="guide-text">{step.text}</p>

        <div
          className="guide-progress"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={GUIDE_STEPS.length}
          aria-label="Avance de la guía"
        >
          <span className="guide-progress-fill" style={{ width: `${((index + 1) / GUIDE_STEPS.length) * 100}%` }} />
        </div>

        <div className="guide-card-foot">
          <button type="button" className="guide-skip" onClick={onClose}>
            Saltar
          </button>
          <div className="guide-nav">
            <button
              type="button"
              className="guide-btn guide-btn-outline"
              onClick={goPrev}
              disabled={index === 0}
              aria-label="Paso anterior"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Atrás
            </button>
            <button
              type="button"
              className="guide-btn guide-btn-primary"
              onClick={goNext}
              aria-label={isLast ? 'Terminar guía' : 'Paso siguiente'}
            >
              {isLast ? 'Entendido' : 'Siguiente'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
