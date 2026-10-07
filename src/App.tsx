import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Download,
  MinusCircle,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react';
import type { AppMode, AppView, Category, MoneyRow } from './types/finance';
import { useTheme } from './hooks/useTheme';
import { useFinance, type Notice } from './hooks/useFinance';
import { usePwaInstall } from './hooks/usePwaInstall';
import { MODE_CONFIG, paymentLabel } from './utils/constants';
import { loadSalaryForMode, loadView, saveView, hasSeenGuide, markGuideSeen } from './utils/storage';
import { calculateTotals, fmtMoney, periodBalance } from './utils/calculations';
import { distinctDates, fullDashboard } from './utils/dashboard';
import { EMPTY_MOVEMENT, kindToRows, lastPrefs, type MovementInput, type MovementKind } from './utils/movements';
import { resolveCategory } from './utils/categories';
import { formatLong, todayISO } from './utils/dates';
import { exportToExcel, exportToTextFile } from './utils/exportUtils';
import { BalanceOverview } from './components/BalanceOverview';
import { CategoriesModal } from './components/CategoriesModal';
import { DaySummary } from './components/DaySummary';
import { ModeSelector } from './components/ModeSelector';
import { SettingsView } from './components/SettingsView';
import { TabBar } from './components/TabBar';
import { AmountModal, ConfirmDialog, DateModal, GuideModal, RegisterModal, Toasts } from './components/dialogs';
import type { DayEntry } from './types/finance';

interface RegisterModalHostProps {
  movModal: { dayId: string; kind: MovementKind; rowId?: string } | null;
  days: DayEntry[];
  incomeSection: string;
  categories: Category[];
  onAddCategory: (kind: 'expense' | 'income', name: string) => Category | null;
  onManageCategories: () => void;
  onKindChange: (kind: MovementKind) => void;
  onSave: (dayId: string, kind: MovementKind, input: MovementInput, rowId?: string) => boolean;
  onClose: () => void;
}

/** Resuelve día/fila del modal y lo renderiza (creación o edición). */
const RegisterModalHost = ({ movModal, days, incomeSection, categories, onAddCategory, onManageCategories, onKindChange, onSave, onClose }: RegisterModalHostProps) => {
  const initialKey = movModal ? `${movModal.dayId}|${movModal.kind}|${movModal.rowId ?? 'new'}` : '';
  // Estable mientras el modal está abierto: evita que re-renders (toasts)
  // reinicien lo que el usuario escribe.
  const initial = useMemo((): MovementInput => {
    if (!movModal) return EMPTY_MOVEMENT;
    const day = days.find((d) => d.id === movModal.dayId);
    const row = movModal.rowId
      ? day?.[kindToRows(movModal.kind)].find((r) => r.id === movModal.rowId)
      : undefined;
    if (row) {
      return {
        name: row.name,
        amount: row.amount,
        paymentType: row.paymentType,
        ...(row.categoryId ? { categoryId: row.categoryId } : {}),
      };
    }
    // Creación: hereda pago + categoría del último movimiento del tipo.
    return { ...EMPTY_MOVEMENT, ...lastPrefs(days, movModal.kind) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);
  if (!movModal) return null;
  const day = days.find((d) => d.id === movModal.dayId);
  if (!day) return null;
  if (movModal.rowId && !day[kindToRows(movModal.kind)].some((r) => r.id === movModal.rowId)) return null;
  return (
    <RegisterModal
      open
      dayLabel={formatLong(day.dateISO)}
      kind={movModal.kind}
      allowKindChange={!movModal.rowId}
      isEditing={!!movModal.rowId}
      initial={initial}
      incomeLabel={incomeSection === 'Ingresos' ? 'Ingresos' : 'Entradas'}
      categories={categories}
      onAddCategory={onAddCategory}
      onManageCategories={onManageCategories}
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
  categories: Category[];
  emptyText: string;
  onEdit: (row: MoneyRow) => void;
  onDelete: (row: MoneyRow) => void;
}

/** Lista compacta de movimientos con editar/eliminar (totales arriba en tiempo real). */
const MovementGroup = ({ title, tone, rows, categories, emptyText, onEdit, onDelete }: MovementGroupProps) => {
  const isIncome = tone === 'income';
  return (
    <section aria-label={`${title} del día`}>
      <h3 className={`col-title ${isIncome ? 'col-title-income' : 'col-title-expense'}`}>{title}</h3>
      {rows.length === 0 ? (
        <p className="mov-empty">{emptyText}</p>
      ) : (
        <ul className="mov-list">
          {rows.map((row) => {
            const catName = resolveCategory(categories, row.categoryId)?.name;
            return (
            <li key={row.id} className="mov-item">
              <span className={`mov-chip ${isIncome ? 'mov-chip-income' : 'mov-chip-expense'}`} aria-hidden="true">
                {isIncome ? '+' : '−'}
              </span>
              <span className="mov-main">
                <span className="mov-name">
                  {row.name || 'Sin descripción'}
                  {catName && <span className="cat-chip">{catName}</span>}
                </span>
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
            );
          })}
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
    periodDays,
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
    categories,
    addCategory,
    renameCategory,
    removeCategory,
    countMovementsWithCategory,
  } = useFinance(notify);

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [salaryFirst, setSalaryFirst] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showInitialModal, setShowInitialModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [movModal, setMovModal] = useState<{ dayId: string; kind: MovementKind; rowId?: string } | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [catDelete, setCatDelete] = useState<{ id: string; name: string; affected: number } | null>(null);
  const [view, setViewState] = useState<AppView>(() => loadView());

  const mode: AppMode = appMode ?? 'daily';
  const modeConfig = MODE_CONFIG[mode];
  const needsOnboarding = appMode === null;
  const isDaily = mode === 'daily';
  /** Daily: caja global (saldo inicial + todo). Quincena/mes: solo período actual. */
  const overviewBalance = isDaily
    ? periodBalance(initialBalance, totals, 0)
    : periodBalance(baseSalary, periodTotals, period.daysRemaining);

  /** Gastos del bloque "En qué se va tu dinero": período actual, o día abierto/hoy en Daily. */
  const openDay = days.find((d) => d.id === expandedId);
  const todayDay = days.find((d) => d.dateISO === todayISO());
  const breakdownRows = isDaily
    ? ((openDay ?? todayDay)?.expenses ?? [])
    : periodDays.flatMap((d) => d.expenses);

  const handleConfirmMode = (m: AppMode, salary: number) => {
    confirmMode(m, salary);
    setShowModeSelector(false);
    setSalaryFirst(false);
  };

  const openModePicker = () => {
    setSalaryFirst(false);
    setShowModeSelector(true);
  };

  const changeView = useCallback((v: AppView) => {
    setViewState(v);
    saveView(v);
    window.scrollTo({ top: 0 });
  }, []);

  /** Desde cualquier vista: asegura el día de hoy y abre el registro directo. */
  const quickRegister = useCallback(() => {
    const iso = todayISO();
    const existing = days.find((d) => d.dateISO === iso);
    const id = existing ? existing.id : createDay(iso);
    if (!id) return;
    setMovModal({ dayId: id, kind: 'expense' });
  }, [createDay, days]);

  const [showGuide, setShowGuide] = useState(false);

  // Guía automática una sola vez, tras completar el onboarding.
  useEffect(() => {
    if (appMode && !hasSeenGuide()) setShowGuide(true);
  }, [appMode]);

  const closeGuide = useCallback(() => {
    markGuideSeen();
    setShowGuide(false);
  }, []);

  /** Métricas del alcance visible (período, o todo en Daily). */
  const metricScope = isDaily ? days : periodDays;
  const metricElapsed = isDaily ? distinctDates(metricScope) : period.elapsedDays;
  const metricTotal = isDaily ? Math.max(metricElapsed, 1) : period.totalDays;
  const dash = fullDashboard(days, metricScope, metricElapsed, metricTotal, todayISO());
  const metricItems = isDaily
    ? [
        { label: 'Promedio diario', value: `$${fmtMoney(dash.avgDailyExpense)}` },
        { label: 'Movimientos', value: `${dash.movementCount}` },
        { label: 'Racha', value: `${dash.streakDays} ${dash.streakDays === 1 ? 'día' : 'días'}` },
      ]
    : [
        { label: 'Promedio diario', value: `$${fmtMoney(dash.avgDailyExpense)}` },
        {
          label: 'Proyección al cierre',
          value: dash.projectedSpend !== null ? `$${fmtMoney(dash.projectedSpend)}` : '—',
        },
        { label: 'Racha', value: `${dash.streakDays} ${dash.streakDays === 1 ? 'día' : 'días'}` },
      ];

  const handleExportTxt = useCallback(() => {
    exportToTextFile(days, categories);
    notify('success', 'Archivo TXT descargado.');
  }, [days, categories, notify]);

  const handleExportXls = useCallback(() => {
    exportToExcel(days, categories);
    notify('success', 'Archivo Excel descargado.');
  }, [days, categories, notify]);

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
          </div>
        </div>
      </header>

      <main className="tool-main">
        {appMode && view === 'resumen' && (
          <>
            <p className="tool-subtitle">
              {modeConfig.subtitle} {modeConfig.description}
            </p>

            {/* Balance del período actual (o caja en Daily) */}
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
            categoryRows={breakdownRows}
            categories={categories}
            metrics={dash.movementCount > 0 ? metricItems : []}
          />

            {days.length === 0 && (
              <div className="empty-state" role="status">
                <p className="empty-title">Empieza tu primer registro</p>
                <p className="empty-text">
                  Anota tu primer gasto o entrada de hoy y verás tu balance al instante.
                </p>
                <button type="button" className="btn-lime" onClick={quickRegister}>
                  <Plus size={15} aria-hidden="true" />
                  Registrar
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Vista Movimientos: registro por día ── */}
        {appMode && view === 'movimientos' && (
          <>
            <div className="toolbar" role="toolbar" aria-label="Acciones de registro">
              <button type="button" className="btn-lime" onClick={addToday}>
                <CalendarPlus size={15} aria-hidden="true" />
                Hoy
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowDateModal(true)}>
                <Plus size={15} aria-hidden="true" />
                Fecha
              </button>
            </div>

            {days.length === 0 && (
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
                        categories={categories}
                        emptyText="Sin gastos registrados."
                        onEdit={(row) => setMovModal({ dayId: day.id, kind: 'expense', rowId: row.id })}
                        onDelete={(row) => removeRow(day.id, 'expense', row.id)}
                      />
                      <MovementGroup
                        title={modeConfig.incomeSection}
                        tone="income"
                        rows={day.incomes}
                        categories={categories}
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
          </>
        )}

        {/* ── Vista Ajustes: modo, apariencia, instalación y datos ── */}
        {appMode && view === 'ajustes' && (
          <SettingsView
            modeLabel={modeConfig.label}
            onOpenModePicker={openModePicker}
            theme={theme}
            onToggleTheme={toggle}
            canInstall={showInstall}
            onInstall={handleInstall}
            hasDays={days.length > 0}
            onExportTxt={handleExportTxt}
            onExportXls={handleExportXls}
            onOpenCategories={() => setShowCategories(true)}
            onOpenGuide={() => setShowGuide(true)}
            onClearRequest={() => setConfirmClear(true)}
          />
        )}
      </main>

      {appMode && <TabBar view={view} onChange={changeView} />}

      {appMode && (
        <button
          type="button"
          className="fab"
          onClick={quickRegister}
          aria-label="Registrar movimiento de hoy"
          title="Registrar movimiento"
        >
          <Plus size={24} aria-hidden="true" />
        </button>
      )}
      <GuideModal open={showGuide} onClose={closeGuide} />

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
        categories={categories}
        onAddCategory={(kind, name) => addCategory(kind, name)}
        onManageCategories={() => setShowCategories(true)}
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
      <CategoriesModal
        open={showCategories}
        categories={categories}
        onRename={(id, name) => renameCategory(id, name)}
        onRequestDelete={(id) => {
          const target = categories.find((c) => c.id === id);
          if (!target) return;
          setCatDelete({ id, name: target.name, affected: countMovementsWithCategory(id) });
        }}
        onClose={() => setShowCategories(false)}
      />
      <ConfirmDialog
        open={catDelete !== null}
        title="Eliminar categoría"
        message={
          catDelete
            ? catDelete.affected > 0
              ? `“${catDelete.name}” desaparecerá y ${catDelete.affected} ${catDelete.affected === 1 ? 'movimiento quedará' : 'movimientos quedarán'} sin categoría. No se borra ningún movimiento.`
              : `“${catDelete.name}” desaparecerá de la lista. No se borra ningún movimiento.`
            : ''
        }
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (catDelete) removeCategory(catDelete.id);
          setCatDelete(null);
        }}
        onCancel={() => setCatDelete(null)}
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
