import { useState, useEffect } from 'react';
import {
  PlusIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
  FileTextIcon,
  SettingsIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from 'lucide-react';

import { FEATURES } from './utils/constants';
import { FeatureCard } from './components/FeatureCard';
import { IncomeExpenseRow } from './components/IncomeExpenseRow';
import { DaySummary } from './components/DaySummary';
import { ModeSelector } from './components/ModeSelector';
import { BalanceOverview } from './components/BalanceOverview';
import { exportToTextFile } from './utils/exportUtils';

const MODE_CONFIG = {
  daily: {
    label: 'Diario',
    incomeSection: 'Ingresos',
    subtitle: 'Registra y organiza tus ingresos y gastos personales día a día.',
    description:
      'Mantén el control de tu presupuesto con un seguimiento detallado de cada transacción y mejora tus hábitos financieros desde hoy.',
  },
  biweekly: {
    label: 'Quincenal',
    incomeSection: 'Ingresos adicionales',
    subtitle: 'Controla tus gastos e ingresos adicionales sobre tu salario quincenal.',
    description:
      'Visualiza cuánto dinero te queda disponible en cada quincena y toma decisiones financieras más inteligentes.',
  },
  monthly: {
    label: 'Mensual',
    incomeSection: 'Ingresos adicionales',
    subtitle: 'Gestiona tus gastos e ingresos extras sobre tu salario mensual.',
    description:
      'Monitorea tu balance mensual, evita gastar más de lo que recibes y alcanza tus metas de ahorro.',
  },
};

const HEADER_FEATURES = [
  {
    icon: TrendingUpIcon,
    title: 'Balance en tiempo real',
    description: 'Visualiza tu posición financiera al instante con totales actualizados automáticamente.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Datos seguros y locales',
    description: 'Tus registros se guardan en tu navegador. Sin servidores externos, sin riesgos.',
  },
  {
    icon: SmartphoneIcon,
    title: 'Funciona en cualquier dispositivo',
    description: 'Interfaz adaptada para móvil, tablet y escritorio con la misma experiencia fluida.',
  },
];

const App = () => {
  const [days, setDays] = useState(() => {
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      return parsedData.map(day => ({
        ...day,
        date: new Date(new Date(day.date).toDateString()),
      }));
    }
    return [];
  });

  const [appMode, setAppMode] = useState(() => localStorage.getItem('appMode') || null);
  const [baseSalary, setBaseSalary] = useState(() => {
    const saved = localStorage.getItem('baseSalary');
    return saved ? parseFloat(saved) : 0;
  });
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    localStorage.setItem('financialData', JSON.stringify(days));
  }, [days]);

  const totalAllIncomes = days.reduce(
    (sum, day) => sum + day.incomes.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0),
    0
  );
  const totalAllExpenses = days.reduce(
    (sum, day) => sum + day.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    0
  );

  const handleModeConfirm = (mode, salary) => {
    setAppMode(mode);
    setBaseSalary(salary);
    localStorage.setItem('appMode', mode);
    localStorage.setItem('baseSalary', String(salary));
    setShowModeSelector(false);
  };

  const handleEditSalary = () => setShowModeSelector(true);

  const addDay = () => setShowDateModal(true);

  const addTodayDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateExists = days.some(
      day => day.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );
    if (dateExists) {
      alert('Ya existe un registro para hoy.');
      return;
    }
    setDays([
      ...days,
      {
        date: today,
        incomes: [{ name: '', amount: '', paymentType: '' }],
        expenses: [{ name: '', amount: '', paymentType: '' }],
      },
    ]);
  };

  const confirmDateAndAddDay = () => {
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(0, 0, 0, 0);
    selectedDateTime.setDate(selectedDateTime.getDate() + 1);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (selectedDateTime > currentDate) {
      alert('No puedes agregar una fecha futura.');
      return;
    }
    const dateExists = days.some(
      day => day.date.toISOString().split('T')[0] === selectedDateTime.toISOString().split('T')[0]
    );
    if (dateExists) {
      alert('Ya existe un registro para esta fecha.');
      return;
    }
    setDays([
      ...days,
      {
        date: selectedDateTime,
        incomes: [{ name: '', amount: '', paymentType: '' }],
        expenses: [{ name: '', amount: '', paymentType: '' }],
      },
    ]);
    setShowDateModal(false);
  };

  const removeDay = dayIndex => setDays(days.filter((_, i) => i !== dayIndex));

  const toggleExpand = dayIndex =>
    setExpandedDays(prev => ({ ...prev, [dayIndex]: !prev[dayIndex] }));

  const updateDayItem = (dayIndex, type, rowIndex, field, value) => {
    const newDays = [...days];
    newDays[dayIndex][type][rowIndex][field] = value;
    setDays(newDays);
  };

  const addRow = (dayIndex, type) => {
    const newDays = [...days];
    newDays[dayIndex][type].push({ name: '', amount: '', paymentType: '' });
    setDays(newDays);
  };

  const removeRow = (dayIndex, type, rowIndex) => {
    const newDays = [...days];
    newDays[dayIndex][type].splice(rowIndex, 1);
    setDays(newDays);
  };

  const handleExportResults = () => exportToTextFile(days);

  const clearAllData = () => {
    if (window.confirm('¿Borrar todos los registros de días? El modo y salario base se conservan.')) {
      setDays([]);
      localStorage.removeItem('financialData');
    }
  };

  const modeConfig = MODE_CONFIG[appMode ?? 'daily'] ?? MODE_CONFIG['daily'];
  const incomeSection = modeConfig.incomeSection;
  const isSalaryMode = appMode === 'biweekly' || appMode === 'monthly';

  if (!appMode || showModeSelector) {
    return <ModeSelector onConfirm={handleModeConfirm} isChanging={!!appMode && showModeSelector} />;
  }

  return (
    <div className="max-w-xl mx-auto px-6 sm:px-10 py-12 lg:py-20">

      <header className="mb-14 animate-fade-up" role="banner">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3" aria-label={`Modo activo: ${modeConfig.label}`}>
            <span
              role="status"
              aria-label="Aplicación activa"
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-lime)',
                boxShadow: '0 0 8px rgba(122,191,142,0.5)',
                flexShrink: 0,
              }}
            />
            <span
              className="font-display font-semibold uppercase"
              style={{ fontSize: 11, color: 'var(--color-lime)', letterSpacing: '0.1em' }}
            >
              Modo {modeConfig.label}
            </span>
          </div>

          <button
            onClick={() => setShowModeSelector(true)}
            className="btn-ghost"
            style={{ padding: '7px 16px', fontSize: 12.5 }}
            aria-label="Cambiar modo de seguimiento financiero"
          >
            <SettingsIcon size={13} aria-hidden="true" />
            Cambiar modo
          </button>
        </div>

        <div className="mb-6">
          <span
            className="font-display font-semibold uppercase block mb-3"
            style={{ fontSize: 12, color: 'var(--color-lime)', letterSpacing: '0.18em' }}
            aria-hidden="true"
          >
            Control financiero personal
          </span>

          <h1
            className="font-display font-extrabold mb-4"
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 4.4rem)',
              color: 'var(--color-text)',
              letterSpacing: '-0.04em',
              lineHeight: 1.04,
            }}
          >
            Domina tus finanzas personales profesionalmente.
          </h1>

          <p
            className="font-body mb-2"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'var(--color-text-sec)',
              maxWidth: 640,
              lineHeight: 1.75,
            }}
          >
            {modeConfig.subtitle}
          </p>

          <p
            className="font-body"
            style={{
              fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
              color: 'var(--color-text-ter)',
              maxWidth: 640,
              lineHeight: 1.8,
            }}
          >
            {modeConfig.description}
          </p>
        </div>

        <nav
          aria-label="Características principales de la aplicación"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8"
        >
          {HEADER_FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-[20px] p-5"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon
                  size={16}
                  aria-hidden="true"
                  style={{ color: 'var(--color-lime)', flexShrink: 0 }}
                />
                <h2
                  className="font-display font-semibold"
                  style={{ fontSize: 12, color: 'var(--color-lime)', letterSpacing: '0.1em' }}
                >
                  {title}
                </h2>
              </div>
              <p
                className="font-body"
                style={{ fontSize: 13, color: 'var(--color-text-sec)', lineHeight: 1.65 }}
              >
                {description}
              </p>
            </article>
          ))}
        </nav>
      </header>

      {isSalaryMode && (
        <BalanceOverview
          mode={appMode}
          baseSalary={baseSalary}
          totalIncomes={totalAllIncomes}
          totalExpenses={totalAllExpenses}
          onEditSalary={handleEditSalary}
        />
      )}

      {appMode === 'daily' && days.length === 0 && (
        <section
          aria-label="Características de la aplicación"
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 animate-fade-up delay-100"
        >
          {FEATURES.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </section>
      )}

      <div
        className="flex flex-wrap gap-4 mb-12 animate-fade-up delay-200"
        role="toolbar"
        aria-label="Acciones de registro"
      >
        <button className="btn-lime" onClick={addDay} aria-label="Agregar registro para una fecha específica">
          <CalendarIcon size={15} aria-hidden="true" />
          Agregar Día
        </button>

        <button className="btn-ghost" onClick={addTodayDay} aria-label="Agregar o gestionar el registro de hoy">
          <CalendarIcon size={15} aria-hidden="true" />
          Gestionar Hoy
        </button>

        {days.length > 0 && (
          <button className="btn-danger" onClick={clearAllData} aria-label="Borrar todos los registros de días">
            <TrashIcon size={15} aria-hidden="true" />
            Borrar Registros
          </button>
        )}
      </div>

      {days.length === 0 && (
        <div
          className="animate-fade-up delay-300"
          role="status"
          aria-live="polite"
          aria-label="Sin registros aún"
          style={{
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: 20,
            padding: '72px 48px',
            textAlign: 'center',
          }}
        >
          <p
            className="font-display font-bold mb-3"
            aria-hidden="true"
            style={{ fontSize: 40, color: 'var(--color-border-2)', letterSpacing: '-0.02em' }}
          >
            ◈
          </p>
          <p
            className="font-body mb-3"
            style={{ fontSize: 16, color: 'var(--color-text-sec)', lineHeight: 1.7 }}
          >
            No hay registros.{' '}
            <span style={{ color: 'var(--color-text)' }}>
              Agrega tu primer día para comenzar.
            </span>
          </p>
          <p
            className="font-body"
            style={{
              fontSize: 13.5,
              color: 'var(--color-text-ter)',
              lineHeight: 1.8,
              maxWidth: 520,
              margin: '0 auto',
            }}
          >
            Con este gestor de finanzas personales podrás llevar un registro detallado
            de tus ingresos y gastos, analizar tu balance y exportar tus datos cuando lo necesites.
          </p>
        </div>
      )}

      <main aria-label="Registros de días" className="flex flex-col gap-5">
        {days.map((day, dayIndex) => (
          <article
            key={dayIndex}
            className="day-row animate-fade-up"
            style={{ animationDelay: `${dayIndex * 55}ms` }}
            aria-label={`Registro del ${day.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          >
            <div
              className="day-header"
              onClick={() => toggleExpand(dayIndex)}
              role="button"
              tabIndex={0}
              aria-expanded={!!expandedDays[dayIndex]}
              onKeyDown={e => e.key === 'Enter' && toggleExpand(dayIndex)}
              style={{
                borderBottom: expandedDays[dayIndex]
                  ? '1px solid var(--color-border)'
                  : 'none',
              }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="chevron-icon" aria-hidden="true">
                  {expandedDays[dayIndex]
                    ? <ChevronDownIcon size={14} />
                    : <ChevronRightIcon size={14} />}
                </div>
                <h3
                  className="font-display font-semibold truncate"
                  style={{
                    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                    color: 'var(--color-text)',
                    letterSpacing: '-0.008em',
                    lineHeight: 1.4,
                    textTransform: 'capitalize',
                  }}
                >
                  {day.date.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
              </div>

              <button
                className="btn-remove-day"
                onClick={e => { e.stopPropagation(); removeDay(dayIndex); }}
                aria-label={`Eliminar registro del día ${dayIndex + 1}`}
              >
                <TrashIcon size={14} aria-hidden="true" />
              </button>
            </div>

            {expandedDays[dayIndex] && (
              <div className="p-6 sm:p-8 animate-slide-down">
                <div className="grid md:grid-cols-2 gap-10">

                  <section aria-label="Gastos del día">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          style={{
                            width: 3, height: 20,
                            background: 'var(--color-expense)',
                            borderRadius: 99,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <h4
                          className="font-display font-semibold uppercase"
                          style={{ fontSize: 11, color: 'var(--color-expense)', letterSpacing: '0.08em' }}
                        >
                          Gastos
                        </h4>
                      </div>
                      <button
                        className="btn-add-expense"
                        onClick={() => addRow(dayIndex, 'expenses')}
                        aria-label="Agregar fila de gasto"
                      >
                        <PlusIcon size={14} aria-hidden="true" />
                      </button>
                    </div>

                    {day.expenses.map((expense, rowIndex) => (
                      <IncomeExpenseRow
                        key={rowIndex}
                        item={expense}
                        type="expense"
                        onNameChange={v => updateDayItem(dayIndex, 'expenses', rowIndex, 'name', v)}
                        onAmountChange={v => updateDayItem(dayIndex, 'expenses', rowIndex, 'amount', v)}
                        onPaymentTypeChange={v => updateDayItem(dayIndex, 'expenses', rowIndex, 'paymentType', v)}
                        onRemove={() => removeRow(dayIndex, 'expenses', rowIndex)}
                      />
                    ))}
                  </section>

                  <section aria-label={`${incomeSection} del día`}>
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          style={{
                            width: 3, height: 20,
                            background: 'var(--color-income)',
                            borderRadius: 99,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <h4
                          className="font-display font-semibold uppercase"
                          style={{ fontSize: 11, color: 'var(--color-income)', letterSpacing: '0.08em' }}
                        >
                          {incomeSection}
                        </h4>
                      </div>
                      <button
                        className="btn-add-income"
                        onClick={() => addRow(dayIndex, 'incomes')}
                        aria-label="Agregar fila de ingreso"
                      >
                        <PlusIcon size={14} aria-hidden="true" />
                      </button>
                    </div>

                    {day.incomes.map((income, rowIndex) => (
                      <IncomeExpenseRow
                        key={rowIndex}
                        item={income}
                        type="income"
                        onNameChange={v => updateDayItem(dayIndex, 'incomes', rowIndex, 'name', v)}
                        onAmountChange={v => updateDayItem(dayIndex, 'incomes', rowIndex, 'amount', v)}
                        onPaymentTypeChange={v => updateDayItem(dayIndex, 'incomes', rowIndex, 'paymentType', v)}
                        onRemove={() => removeRow(dayIndex, 'incomes', rowIndex)}
                      />
                    ))}
                  </section>
                </div>

                <DaySummary day={day} mode={appMode} />

                <div className="mt-8 flex justify-end">
                  <button
                    className="btn-export"
                    onClick={handleExportResults}
                    aria-label="Exportar resultados financieros a archivo de texto"
                  >
                    <FileTextIcon size={13} aria-hidden="true" />
                    Exportar Resultados
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </main>

      {showDateModal && (
        <div
          className="modal-overlay animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-box animate-fade-up">
            <span
              className="font-display font-semibold uppercase block mb-2"
              style={{ fontSize: 10.5, color: 'var(--color-lime)', letterSpacing: '0.1em' }}
              aria-hidden="true"
            >
              Nuevo Registro
            </span>

            <h2
              id="modal-title"
              className="font-display font-bold mb-7"
              style={{
                fontSize: 'clamp(1.25rem, 3vw, 1.65rem)',
                color: 'var(--color-text)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
              }}
            >
              Selecciona una fecha
            </h2>

            <label htmlFor="date-picker" className="sr-only">
              Fecha del registro financiero
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="input-dark mb-7"
              aria-required="true"
            />

            <div className="flex gap-3 justify-end">
              <button className="btn-ghost" onClick={() => setShowDateModal(false)}>
                Cancelar
              </button>
              <button className="btn-lime" onClick={confirmDateAndAddDay}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
