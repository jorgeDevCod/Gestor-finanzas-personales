import {
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Moon,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react';
import type { Theme } from '../types/finance';

interface Props {
  modeLabel: string;
  onOpenModePicker: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  canInstall: boolean;
  onInstall: () => void;
  hasDays: boolean;
  onExportTxt: () => void;
  onExportXls: () => void;
  onClearRequest: () => void;
}

/** Vista Ajustes: modo, apariencia, instalación, datos y acerca de. */
export const SettingsView = ({
  modeLabel,
  onOpenModePicker,
  theme,
  onToggleTheme,
  canInstall,
  onInstall,
  hasDays,
  onExportTxt,
  onExportXls,
  onClearRequest,
}: Props) => (
  <div className="settings">
    <section aria-label="General">
      <p className="set-section-title">General</p>
      <button type="button" className="set-row" onClick={onOpenModePicker}>
        <span className="set-icon" aria-hidden="true">
          <Wallet size={18} />
        </span>
        <span className="set-main">
          <span className="set-label">Modo de gestión</span>
          <span className="set-value">{modeLabel}</span>
        </span>
        <ChevronRight size={16} aria-hidden="true" className="set-chevron" />
      </button>
      <button type="button" className="set-row" onClick={onToggleTheme} aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}>
        <span className="set-icon" aria-hidden="true">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </span>
        <span className="set-main">
          <span className="set-label">Apariencia</span>
          <span className="set-value">{theme === 'light' ? 'Claro' : 'Oscuro'}</span>
        </span>
        <ChevronRight size={16} aria-hidden="true" className="set-chevron" />
      </button>
      {canInstall && (
        <button type="button" className="set-row" onClick={onInstall}>
          <span className="set-icon" aria-hidden="true">
            <Download size={18} />
          </span>
          <span className="set-main">
            <span className="set-label">Instalar aplicación</span>
            <span className="set-value">Úsala sin conexión</span>
          </span>
          <ChevronRight size={16} aria-hidden="true" className="set-chevron" />
        </button>
      )}
    </section>

    <section aria-label="Datos">
      <p className="set-section-title">Datos</p>
      <button type="button" className="set-row" disabled={!hasDays} onClick={onExportTxt}>
        <span className="set-icon" aria-hidden="true">
          <FileText size={18} />
        </span>
        <span className="set-main">
          <span className="set-label">Exportar TXT</span>
          <span className="set-value">Texto plano</span>
        </span>
        <ChevronRight size={16} aria-hidden="true" className="set-chevron" />
      </button>
      <button type="button" className="set-row" disabled={!hasDays} onClick={onExportXls}>
        <span className="set-icon" aria-hidden="true">
          <FileSpreadsheet size={18} />
        </span>
        <span className="set-main">
          <span className="set-label">Exportar Excel</span>
          <span className="set-value">Movimientos y resumen</span>
        </span>
        <ChevronRight size={16} aria-hidden="true" className="set-chevron" />
      </button>
      {hasDays && (
        <button type="button" className="set-row set-row-danger" onClick={onClearRequest}>
          <span className="set-icon" aria-hidden="true">
            <Trash2 size={18} />
          </span>
          <span className="set-main">
            <span className="set-label">Borrar registros</span>
            <span className="set-value">Conserva modo y montos</span>
          </span>
          <ChevronRight size={16} aria-hidden="true" className="set-chevron" />
        </button>
      )}
    </section>

    <p className="settings-foot">Mis Finanzas · Tus datos se quedan en tu dispositivo</p>
  </div>
);
