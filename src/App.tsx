import { useCallback, useRef, useState } from 'react';
import {
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  MinusCircle,
  Moon,
  Pencil,
  Plus,
  Settings,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react';
import type { AppMode, MoneyRow } from './types/finance';
import { useTheme } from './hooks/useTheme';
import { useFinance, type Notice } from './hooks/useFinance';
import { usePwaInstall } from './hooks/usePwaInstall';
import { MODE_CONFIG, paymentLabel } from './utils/constants';
import { loadSalaryForMode } from './utils/storage';
import { calculateTotals, fmtMoney, periodBalance } from './utils/calculations';
import { EMPTY_MOVEMENT, kindToRows, type MovementInput, type MovementKind } from './utils/movements';
import { formatLong } from './utils/dates';
import { exportToExcel, exportToTextFile } from './utils/exportUtils';
import { BalanceOverview } from './components/BalanceOverview';
import { DaySummary } from './components/DaySummary';
import { ModeSelector } from './components/ModeSelector';
import { AmountModal, ConfirmDialog, DateModal, RegisterModal, Toasts } from './components/dialogs';
import type { DayEntry } from './types/finance';

interface RegisterModalHostProps {
  movModal: { dayId: string; kind: MovementKind; rowId?: string } | null;
  days: DayEntry[];
  incomeSection: string;
  onKindChange: (kind: MovementKind) => void;
  onSave: (dayId: string, kind: MovementKind, input: MovementInput, rowId?: string) => boolean;
  onClose: () => void;
}

/** Resuelve día/fila del modal y lo renderiza (creación o edición). */
const RegisterModalHost = ({ movModal, days, incomeSection, onKindChange, onSave, onClose }: RegisterModalHostProps) => {
  if (!movModal) return null;
  const day = days.find((d) => d.id === movModal.dayId);
  if (!day) return null;
  const row = movModal.rowId
    ? day[kindToRows(movModal.kind)].find((r) => r.id === movModal.rowId)
    : undefined;
  if (movModal.rowId && !row) return null;
  return (
    <RegisterModal
      open
      dayLabel={formatLong(day.dateISO)}
      kind={movModal.kind}
      allowKindChange={!movModal.rowId}
      isEditing={!!movModal.rowId}
      initial={
        row
          ? { name: row.name, amount: row.amount, paymentType: row.paymentType }
          : EMPTY_MOVEMENT
      }
      incomeLabel={incomeSection === 'Ingresos' ? 'Ingresos' : 'Entradas'}
      onKindChange={onKindChange}
      onSave={(kind, input) => onSave(day.id, kind, input, movModal.rowId)}
      onClose={onClose}
    />
  );
};

interface MovementGroupProps {
  title: string;
  tone: 'income' | 'expense';
  rows: MoneyRow[];
  emptyText: string;
  onEdit: (row: MoneyRow) => void;
  onDelete: (row: MoneyRow) => void;
}

/** Lista compacta de movimientos con editar/eliminar (totales arriba en tiempo real). */
const MovementGroup = ({ title, tone, rows, emptyText, onEdit, onDelete }: MovementGroupProps) => {
  const isIncome = tone === 'income';
  return (
    <section aria-label={`${title} del día`}>
      <h3 className={`col-title ${isIncome ? 'col-title-income' : 'col-title-expense'}`}>{title}</h3>
      {rows.length === 0 ? (
        <p className="mov-empty">{emptyText}</p>
      ) : (
        <ul className="mov-list">
          {rows.map((row) => (
            <li key={row.id} className="mov-item">
              <span className={`mov-chip ${isIncome ? 'mov-chip-income' : 'mov-chip-expense'}`} aria-hidden="true">
                {isIncome ? '+' : '−'}
              </span>
              <span className="mov-main">
                <span className="mov-name">{row.name || 'Sin descripción'}</span>
                <span className="mov-meta">{paymentLabel(row.paymentType)}</span>
              </span>
              <span className={`mov-amount ${isIncome ? 'txt-income' : 'txt-expense'}`}>
                {isIncome ? '+' : '−'}${fmtMoney(parseFloat(row.amount) || 0)}
              </span>
              <span className="mov-actions">
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => onEdit(row)}
                  aria-label={`Editar ${row.name || 'movimiento'}`}
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="mini-btn mini-btn-danger"
                  onClick={() => onDelete(row)}
                  aria-label={`Eliminar ${row.name || 'movimiento'}`}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

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
    initialBalance,
    expandedId,
    totals,
    period,
    periodTotals,
    todayTotals,
    confirmMode,
    setInitialBalance,
    resetBase,
    createDay,
    addToday,
    removeDay,
    toggleExpand,
    saveMovement,
    removeRow,
    clearAll,
  } = useFinance(notify);

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [salaryFirst, setSalaryFirst] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showInitialModal, setShowInitialModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [movModal, setMovModal] = useState<{ dayId: string; kind: MovementKind; rowId?: string } | null>(null);

  const mode: AppMode = appMode ?? 'daily';
  const modeConfig = MODE_CONFIG[mode];
  const needsOnboarding = appMode === null;
  const isDaily = mode === 'daily';
  /** Daily: caja global (saldo inicial + todo). Quincena/mes: solo período actual. */
  const overviewBalance = isDaily
    ? periodBalance(initialBalance, totals, 0)
    : periodBalance(baseSalary, periodTotals, period.daysRemaining);

  const handleConfirmMode = (m: AppMode, salary: number) => {
    confirmMode(m, salary);
    setShowModeSelector(false);
    setSalaryFirst(false);
  };

  const openModePicker = () => {
    setSalaryFirst(false);
    setShowModeSelector(true);
  };

  /** Salario guardado de cada modo (lee storage: siempre fresco). */
  const savedSalaryFor = useCallback(
    (m: Exclude<AppMode, 'daily'>): number => loadSalaryForMode(m),
    [],
  );

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
              <button type="button" className="icon-btn" onClick={openModePicker} aria-label="Cambiar modo o salario">
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

        {/* Balance del período actual (o caja en Daily) */}
        {appMode && (
          <BalanceOverview
            mode={appMode}
            period={period}
            balance={overviewBalance}
            baseLabel={isDaily ? 'Saldo inicial' : 'Ingreso base'}
            incomesLabel={isDaily ? 'Ingresos' : 'Ingresos extra'}
            onEditBase={() => {
              if (isDaily) {
                setShowInitialModal(true);
              } else {
                setSalaryFirst(true);
                setShowModeSelector(true);
              }
            }}
            editLabel={isDaily ? 'Editar saldo' : 'Editar salario'}
            onResetBase={() => setConfirmReset(true)}
            today={isDaily ? todayTotals : null}
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
              Luego usa <strong>Registrar gasto $</strong> o <strong>Registrar entrada $</strong> para anotar tus movimientos.
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
                    {/* CTAs de registro: verde dinero para entradas, rojo suave para gastos */}
                    <div className="cta-row">
                      <button
                        type="button"
                        className="cta-expense"
                        onClick={() => setMovModal({ dayId: day.id, kind: 'expense' })}
                      >
                        <MinusCircle size={16} aria-hidden="true" />
                        Registrar gasto $
                      </button>
                      <button
                        type="button"
                        className="cta-income"
                        onClick={() => setMovModal({ dayId: day.id, kind: 'income' })}
                      >
                        <CircleDollarSign size={16} aria-hidden="true" />
                        Registrar entrada $
                      </button>
                    </div>

                    {/* Lista de movimientos del día (tiempo real) */}
                    <div className="day-cols">
                      <MovementGroup
                        title="Gastos"
                        tone="expense"
                        rows={day.expenses}
                        emptyText="Sin gastos registrados."
                        onEdit={(row) => setMovModal({ dayId: day.id, kind: 'expense', rowId: row.id })}
                        onDelete={(row) => removeRow(day.id, 'expense', row.id)}
                      />
                      <MovementGroup
                        title={modeConfig.incomeSection}
                        tone="income"
                        rows={day.incomes}
                        emptyText="Sin entradas registradas."
                        onEdit={(row) => setMovModal({ dayId: day.id, kind: 'income', rowId: row.id })}
                        onDelete={(row) => removeRow(day.id, 'income', row.id)}
                      />
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
          savedSalaryFor={savedSalaryFor}
          currentMode={appMode}
          startAtSalaryStep={salaryFirst}
          onClose={
            needsOnboarding
              ? undefined
              : () => {
                  setShowModeSelector(false);
                  setSalaryFirst(false);
                }
          }
        />
      )}
      <DateModal open={showDateModal} onConfirm={handleDateConfirm} onClose={() => setShowDateModal(false)} />
      <AmountModal
        open={showInitialModal}
        title="Saldo inicial"
        subtitle="¿Cuánto dinero tienes actualmente? Se sumará a tus movimientos para mostrar tu saldo actual."
        label="Saldo inicial $"
        initialValue={initialBalance}
        allowZero
        confirmLabel="Guardar"
        onConfirm={(v) => {
          setInitialBalance(v);
          setShowInitialModal(false);
        }}
        onClose={() => setShowInitialModal(false)}
      />
      <RegisterModalHost
        movModal={movModal}
        days={days}
        incomeSection={modeConfig.incomeSection}
        onKindChange={(kind) => setMovModal((m) => (m ? { ...m, kind } : m))}
        onSave={(dayId, kind, input, rowId) => {
          if (saveMovement(dayId, kind, input, rowId)) {
            setMovModal(null);
            return true;
          }
          return false;
        }}
        onClose={() => setMovModal(null)}
      />
      <ConfirmDialog
        open={confirmReset}
        title={isDaily ? 'Reiniciar saldo inicial' : 'Reiniciar salario'}
        message={
          isDaily
            ? 'El saldo inicial volverá a $0. Tus movimientos se conservan.'
            : 'El salario de este modo volverá a quedar vacío y se pedirá de nuevo. Tus movimientos se conservan.'
        }
        confirmLabel="Reiniciar"
        onConfirm={() => {
          resetBase();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
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
