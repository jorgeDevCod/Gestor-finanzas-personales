import { LayoutDashboard, ReceiptText, SlidersHorizontal } from 'lucide-react';
import type { AppView } from '../types/finance';

interface Props {
  view: AppView;
  onChange: (view: AppView) => void;
}

const TABS: { id: AppView; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'resumen', label: 'Resumen', Icon: LayoutDashboard },
  { id: 'movimientos', label: 'Movimientos', Icon: ReceiptText },
  { id: 'ajustes', label: 'Ajustes', Icon: SlidersHorizontal },
];

/** Navegación inferior fija: una vista a la vez, sin rutas ni librerías. */
export const TabBar = ({ view, onChange }: Props) => (
  <nav className="tabbar" aria-label="Vistas principales">
    {TABS.map(({ id, label, Icon }) => (
      <button
        key={id}
        type="button"
        className={`tab-item${view === id ? ' tab-active' : ''}`}
        aria-current={view === id ? 'page' : undefined}
        onClick={() => onChange(id)}
      >
        <Icon size={20} aria-hidden="true" />
        <span>{label}</span>
      </button>
    ))}
  </nav>
);
