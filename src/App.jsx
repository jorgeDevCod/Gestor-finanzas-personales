import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
  FileTextIcon
} from 'lucide-react';

import { FEATURES } from './utils/constants';
import { FeatureCard } from './components/FeatureCard';
import { IncomeExpenseRow } from './components/IncomeExpenseRow';
import { DaySummary } from './components/DaySummary';

// Función para exportar los resultados a un archivo de texto
const exportToTextFile = (data) => {
  const formattedData = data
    .map((day) => {
      const incomes = day.incomes.map(
        (income) => `Ingreso: ${income.name} - Monto: ${income.amount} - Tipo: ${income.paymentType}`
      ).join("\n");

      const expenses = day.expenses.map(
        (expense) => `Gasto: ${expense.name} - Monto: ${expense.amount} - Tipo: ${expense.paymentType}`
      ).join("\n");

      return `Fecha: ${day.date.toLocaleDateString()}\n${incomes}\n${expenses}\n`;
    })
    .join("\n");

  const blob = new Blob([formattedData], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "resultados_financieros.txt";
  a.click();
  URL.revokeObjectURL(url);
};

const App = () => {
  // Carga inicial de datos desde localStorage
  const [days, setDays] = useState(() => {
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Convierte las fechas de cadena a objetos Date
      return parsedData.map(day => ({
        ...day,
        date: new Date(day.date)
      }));
    }
    return [];
  });

  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedDays, setExpandedDays] = useState({});

  // Guarda los datos en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('financialData', JSON.stringify(days));
  }, [days]);

  const addDay = () => {
    setShowDateModal(true);
  };

  const addTodayDay = () => {
    const today = new Date();
    setDays([...days, {
      date: today,
      incomes: [{ name: '', amount: '', paymentType: '' }],
      expenses: [{ name: '', amount: '', paymentType: '' }]
    }]);
  };

  const confirmDateAndAddDay = () => {
    setDays([...days, {
      date: new Date(selectedDate),
      incomes: [{ name: '', amount: '', paymentType: '' }],
      expenses: [{ name: '', amount: '', paymentType: '' }]
    }]);
    setShowDateModal(false);
  };

  const removeDay = (dayIndex) => {
    const newDays = days.filter((_, index) => index !== dayIndex);
    setDays(newDays);
  };

  const toggleDayExpansion = (dayIndex) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayIndex]: !prev[dayIndex]
    }));
  };

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

  const handleExportResults = () => {
    exportToTextFile(days);
  };

  // Función para borrar todos los datos
  const clearAllData = () => {
    const confirmClear = window.confirm('¿Estás seguro de borrar todos los datos? Esta acción no se puede deshacer.');
    if (confirmClear) {
      setDays([]);
      localStorage.removeItem('financialData');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          Gestor de Finanzas Personales
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Administra tus ingresos y gastos de manera fácil y organizada
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {FEATURES.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
        <button
          onClick={addDay}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors"
        >
          <CalendarIcon className="mr-2" /> Agregar Día
        </button>
        <button
          onClick={addTodayDay}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors"
        >
          <CalendarIcon className="mr-2" /> Gestionar Hoy
        </button>
        {days.length > 0 && (
          <button
            onClick={clearAllData}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors"
          >
            <TrashIcon className="mr-2" /> Borrar Datos
          </button>
        )}
      </div>

      {days.map((day, dayIndex) => (
        <div key={dayIndex} className="bg-slate-50 shadow-md rounded-lg overflow-hidden border border-gray-200 mb-4">
          <div className="flex justify-between items-center p-4 bg-slate-200">
            <div onClick={() => toggleDayExpansion(dayIndex)} className="flex items-center cursor-pointer">
              {expandedDays[dayIndex] ? <ChevronDownIcon /> : <ChevronRightIcon />}
              <h2 className="text-xl font-semibold ml-2 text-gray-800">
                {day.date.toLocaleDateString()}
              </h2>
            </div>
            <button onClick={() => removeDay(dayIndex)} className="text-red-600 hover:text-red-800 transition-colors">
              <TrashIcon size={24} />
            </button>
          </div>

          {expandedDays[dayIndex] && (
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">Gastos</h3>
                    <button onClick={() => addRow(dayIndex, 'expenses')} className="bg-blue-500 text-white px-2 py-2 rounded">
                      <PlusIcon size={20} />
                    </button>
                  </div>
                  {day.expenses.map((expense, rowIndex) => (
                    <IncomeExpenseRow
                      key={rowIndex}
                      item={expense}
                      onNameChange={(value) =>
                        updateDayItem(dayIndex, 'expenses', rowIndex, 'name', value)
                      }
                      onAmountChange={(value) =>
                        updateDayItem(dayIndex, 'expenses', rowIndex, 'amount', value)
                      }
                      onPaymentTypeChange={(value) =>
                        updateDayItem(dayIndex, 'expenses', rowIndex, 'paymentType', value)
                      }
                      onRemove={() => removeRow(dayIndex, 'expenses', rowIndex)}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">Ingresos</h3>
                    <button onClick={() => addRow(dayIndex, 'incomes')} className="bg-blue-500 text-white px-2 py-2 rounded">
                      <PlusIcon size={20} />
                    </button>
                  </div>
                  {day.incomes.map((income, rowIndex) => (
                    <IncomeExpenseRow
                      key={rowIndex}
                      item={income}
                      onNameChange={(value) =>
                        updateDayItem(dayIndex, 'incomes', rowIndex, 'name', value)
                      }
                      onAmountChange={(value) =>
                        updateDayItem(dayIndex, 'incomes', rowIndex, 'amount', value)
                      }
                      onPaymentTypeChange={(value) =>
                        updateDayItem(dayIndex, 'incomes', rowIndex, 'paymentType', value)
                      }
                      onRemove={() => removeRow(dayIndex, 'incomes', rowIndex)}
                    />
                  ))}
                </div>
              </div>

              <DaySummary day={day} />

              <div className="mt-4 flex justify-end">
                <button onClick={handleExportResults} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center">
                  <FileTextIcon className="mr-2" /> Exportar Resultados
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-screen-2xl">
            <h2 className="text-xl font-semibold mb-4">Selecciona una fecha</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowDateModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDateAndAddDay}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
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