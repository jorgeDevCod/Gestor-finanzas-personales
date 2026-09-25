import { useCallback, useRef, useState } from 'react';
import {
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Moon,
  Plus,
  Settings,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react';
import type { AppMode } from './types/finance';
import { useTheme } from './hooks/useTheme';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useFinance, type Notice } from './hooks/useFinance';
import { MODE_CONFIG } from './utils/constants';
import { calculateTotals, fmtMoney } from './utils/calculations';
import { formatLong } from './utils/dates';
import { exportToExcel, exportToTextFile } from './utils/exportUtils';
import { BalanceOverview } from './components/BalanceOverview';
import { DaySummary } from './components/DaySummary';
import { IncomeExpenseRow } from './components/IncomeExpenseRow';
import { ModeSelector } from './components/ModeSelector';
import { ConfirmDialog, DateModal, Toasts } from './components/dialogs';

const App = () => {
  const { theme, toggle } = useTheme();
  const { visible: showInstall, install } = usePwaInstall();
  const [notices, setNotices] = useState<Notice[]>([]);
  const noticeSeq = useRef(0);

  const notify = useCallback((kind: Notice['kind'], text: string) => {
    const id = `${Date.now()}-${noticeSeq.current++}`;
    setNotices((prev) => [...prev.slice(-3), { id, kind, text }]);
    setTimeout(() => {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }, 3200);
  }, []);

  const {
    days,
    appMode,
    baseSalary,
    expandedId,
    totals,
    isSalaryMode,
    confirmMode,
    createDay,
    addToday,
    removeDay,
    toggleExpand,
    updateItem,
    addRow,
    removeRow,
    clearAll,
  } = useFinance(notify);

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const mode: AppMode = appMode ?? 'daily';
  const modeConfig = MODE_CONFIG[mode];
  const needsOnboarding = appMode === null;

  const handleConfirmMode = (m: AppMode, salary: number) => {
    confirmMode(m, salary);
    setShowModeSelector(false);
  };

  const handleInstall = async () => {
    const result = await install();
    if (result === 'ios-help') {
      notify('info', 'En iPhone: toca Compartir → “Añadir a pantalla de inicio”.');
    } else if (result === 'unavailable') {
      notify('info', 'Tu navegador no ofrece instalación ahora; puedes seguir usando la app aquí.');
    }
  };
  const handleDateConfirm = (iso: string) => {
    if (createDay(iso)) setShowDateModal(false);
  };

  return (
    <div className="app-shell">
      {/* ── Barra superior fija: herramienta, no landing ── */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">
              <Wallet size={17} />
            </span>
            <div>
              <p className="brand-name">Mis Finanzas</p>
              {appMode && <p className="brand-mode">Modo {modeConfig.label}</p>}
            </div>
          </div>
          <div className="topbar-actions">
            {showInstall && (
              <button
                type="button"
                className="install-btn"
                onClick={handleInstall}
                aria-label="Instalar la aplicación en tu dispositivo"
                title="Instalar app"
              >
                <Download size={15} aria-hidden="true" />
                <span>Instalar</span>
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={toggle}
              aria-label={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
              aria-pressed={theme === 'dark'}
              title={theme === 'light' ? 'Tema oscuro' : 'Tema claro'}
            >
              {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
            </button>
            {appMode && (
              <button type="button" className="icon-btn" onClick={() => setShowModeSelector(true)} aria-label="Cambiar modo o salario">
                <Settings size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="tool-main">
        {appMode && (
          <p className="tool-subtitle">
            {modeConfig.subtitle} {modeConfig.description}
          </p>
        )}

        {/* Balance global solo en modos con salario */}
        {isSalaryMode && appMode && (
          <BalanceOverview
            mode={appMode}
            baseSalary={baseSalary}
            totalIncomes={totals.totalIncomes}
            totalExpenses={totals.totalExpenses}
            onEditSalary={() => setShowModeSelector(true)}
          />
        )}

        {/* ── Barra de acciones (export global, no por día) ── */}
        {appMode && (
          <div className="toolbar" role="toolbar" aria-label="Acciones de registro">
            <button type="button" className="btn-lime" onClick={addToday}>
              <CalendarPlus size={15} aria-hidden="true" />
              Hoy
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowDateModal(true)}>
              <Plus size={15} aria-hidden="true" />
              Fecha
            </button>
            <div className="toolbar-spacer" />
            <button
              type="button"
              className="btn-ghost btn-sm"
              disabled={days.length === 0}
              onClick={() => {
                exportToTextFile(days);
                notify('success', 'Archivo TXT descargado.');
              }}
              title="Exportar todo a texto plano"
            >
              <FileText size={14} aria-hidden="true" />
              TXT
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              disabled={days.length === 0}
              onClick={() => {
                exportToExcel(days);
                notify('success', 'Archivo Excel descargado.');
              }}
              title="Exportar todo a Excel"
            >
              <FileSpreadsheet size={14} aria-hidden="true" />
              Excel
            </button>
            {days.length > 0 && (
              <button
                type="button"
                className="btn-ghost btn-sm btn-danger-ghost"
                onClick={() => setConfirmClear(true)}
                title="Borrar todos los registros"
              >
                <Trash2 size={14} aria-hidden="true" />
                Borrar
              </button>
            )}
          </div>
        )}

        {/* ── Estado vacío compacto ── */}
        {appMode && days.length === 0 && (
          <div className="empty-state" role="status">
            <p className="empty-title">Sin registros todavía</p>
            <p className="empty-text">
              Toca <strong>Hoy</strong> para abrir el día actual o <strong>Fecha</strong> para elegir otra fecha.
              Luego agrega ingresos y gastos con nombre, monto y método de pago.
            </p>
          </div>
        )}

        {/* ── Lista de días (acordeón: un día abierto a la vez) ── */}
        <div className="day-list">
          {days.map((day) => {
            const open = expandedId === day.id;
            const t = calculateTotals(day);
            const dayPositive = t.netBalance >= 0;
            return (
              <article key={day.id} className={`day-card ${open ? 'day-open' : ''}`}>
                <div className="day-header">
                  <button
                    type="button"
                    className="day-toggle"
                    onClick={() => toggleExpand(day.id)}
                    aria-expanded={open}
                    aria-label={`${open ? 'Contraer' : 'Expandir'} registro del ${formatLong(day.dateISO)}`}
                  >
                    <span className="chevron" aria-hidden="true">
                      {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </span>
                    <span className="day-date">{formatLong(day.dateISO)}</span>
                    <span className={`net-chip ${dayPositive ? 'net-pos' : 'net-neg'}`}>
                      {dayPositive ? '+' : '−'}${fmtMoney(Math.abs(t.netBalance))}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-remove-day"
                    onClick={() => removeDay(day.id)}
                    aria-label={`Eliminar registro del ${formatLong(day.dateISO)}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>

                {open && appMode && (
                  <div className="day-body">
                    <div className="day-cols">
                      <section aria-label="Gastos del día">
                        <div className="col-head">
                          <h3 className="col-title col-title-expense">Gastos</h3>
                          <button
                            type="button"
                            className="btn-add-expense"
                            onClick={() => addRow(day.id, 'expenses')}
                            aria-label="Agregar gasto"
                          >
                            <Plus size={14} aria-hidden="true" />
                          </button>
                        </div>
                        {day.expenses.length === 0 && (
                          <p className="col-empty">Sin gastos. Agrega el primero con +.</p>
                        )}
                        {day.expenses.map((row) => (
                          <IncomeExpenseRow
                            key={row.id}
                            item={row}
                            type="expense"
                            onNameChange={(v) => updateItem(day.id, 'expenses', row.id, 'name', v)}
                            onAmountChange={(v) => updateItem(day.id, 'expenses', row.id, 'amount', v)}
                            onPaymentTypeChange={(v) => updateItem(day.id, 'expenses', row.id, 'paymentType', v)}
                            onRemove={() => removeRow(day.id, 'expenses', row.id)}
                          />
                        ))}
                      </section>

                      <section aria-label={`${modeConfig.incomeSection} del día`}>
                        <div className="col-head">
                          <h3 className="col-title col-title-income">{modeConfig.incomeSection}</h3>
                          <button
                            type="button"
                            className="btn-add-income"
                            onClick={() => addRow(day.id, 'incomes')}
                            aria-label="Agregar ingreso"
                          >
                            <Plus size={14} aria-hidden="true" />
                          </button>
                        </div>
                        {day.incomes.length === 0 && (
                          <p className="col-empty">Sin ingresos. Agrega el primero con +.</p>
                        )}
                        {day.incomes.map((row) => (
                          <IncomeExpenseRow
                            key={row.id}
                            item={row}
                            type="income"
                            onNameChange={(v) => updateItem(day.id, 'incomes', row.id, 'name', v)}
                            onAmountChange={(v) => updateItem(day.id, 'incomes', row.id, 'amount', v)}
                            onPaymentTypeChange={(v) => updateItem(day.id, 'incomes', row.id, 'paymentType', v)}
                            onRemove={() => removeRow(day.id, 'incomes', row.id)}
                          />
                        ))}
                      </section>
                    </div>

                    <DaySummary day={day} mode={mode} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>

      {/* ── Modales y avisos (sin alert/confirm nativos) ── */}
      {(needsOnboarding || showModeSelector) && (
        <ModeSelector
          onConfirm={handleConfirmMode}
          isChanging={!needsOnboarding}
          onClose={needsOnboarding ? undefined : () => setShowModeSelector(false)}
        />
      )}
      <DateModal open={showDateModal} onConfirm={handleDateConfirm} onClose={() => setShowDateModal(false)} />
      <ConfirmDialog
        open={confirmClear}
        title="Borrar todos los registros"
        message="Se eliminarán todos los días. El modo y el salario base se conservan."
        confirmLabel="Borrar todo"
        onConfirm={() => {
          clearAll();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
      <Toasts notices={notices} />
    </div>
  );
};

export default App;
