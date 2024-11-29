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
import { exportToTextFile } from './utils/exportUtils';

const App = () => {
  // Carga inicial de datos desde localStorage con corrección de fecha
  const [days, setDays] = useState(() => {
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Convierte las fechas de cadena a objetos Date con corrección de zona horaria
      return parsedData.map(day => ({
        ...day,
        date: new Date(new Date(day.date).toDateString())
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
    today.setHours(0, 0, 0, 0);
  
    // Verificar si ya existe un registro para hoy
    const dateExists = days.some(day => 
      day.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );
  
    if (dateExists) {
      alert('Ya existe un registro para hoy.');
      return;
    }
  
    setDays([...days, {
      date: today,
      incomes: [{ name: '', amount: '', paymentType: '' }],
      expenses: [{ name: '', amount: '', paymentType: '' }]
    }]);
  };

  const confirmDateAndAddDay = () => {
    // Crear la fecha seleccionada con la hora establecida a la medianoche
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(0, 0, 0, 0);

    // Obtener la fecha actual del dispositivo
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Verificar si la fecha seleccionada es posterior a la fecha actual
    if (selectedDateTime > currentDate) {
      alert('No puedes agregar una fecha futura.');
      return;
    }

    // Verificar si la fecha ya existe en los registros
    const dateExists = days.some(day => 
      day.date.toISOString().split('T')[0] === selectedDateTime.toISOString().split('T')[0]
    );

    if (dateExists) {
      alert('Ya existe un registro para esta fecha.');
      return;
    }

    setDays([...days, {
      date: selectedDateTime,
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

  const clearAllData = () => {
    const confirmClear = window.confirm('¿Estás seguro de borrar todos los datos? Esta acción no se puede deshacer.');
    if (confirmClear) {
      setDays([]);
      localStorage.removeItem('financialData');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-10 bg-white shadow-md rounded-lg p-6">
        <h1 className="text-4xl font-bold mb-3 text-blue-600">
          Gestor de Finanzas Personales
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto text-lg">
          Administra tus ingresos y gastos de manera intuitiva y organizada
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {FEATURES.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
        <button
          onClick={addDay}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors shadow-md"
        >
          <CalendarIcon className="mr-2" /> Agregar Día
        </button>
        <button
          onClick={addTodayDay}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors shadow-md"
        >
          <CalendarIcon className="mr-2" /> Gestionar Hoy
        </button>
        {days.length > 0 && (
          <button
            onClick={clearAllData}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors shadow-md"
          >
            <TrashIcon className="mr-2" /> Borrar Datos
          </button>
        )}
      </div>

      {days.length === 0 && (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500 text-xl">
            No hay registros financieros. ¡Comienza agregando un día!
          </p>
        </div>
      )}

      {days.map((day, dayIndex) => (
        <div key={dayIndex} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 mb-6">
          <div className="flex justify-between items-center p-4 bg-blue-100">
            <div 
              onClick={() => toggleDayExpansion(dayIndex)} 
              className="flex items-center cursor-pointer hover:text-blue-700 transition-colors"
            >
              {expandedDays[dayIndex] ? <ChevronDownIcon /> : <ChevronRightIcon />}
              <h2 className="text-xl font-semibold ml-2 text-gray-800">
                {day.date.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
            </div>
            <button 
              onClick={() => removeDay(dayIndex)} 
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <TrashIcon size={24} />
            </button>
          </div>

          {expandedDays[dayIndex] && (
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 text-lg">Gastos</h3>
                    <button 
                      onClick={() => addRow(dayIndex, 'expenses')} 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors"
                    >
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
                    <h3 className="font-bold text-gray-700 text-lg">Ingresos</h3>
                    <button 
                      onClick={() => addRow(dayIndex, 'incomes')} 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors"
                    >
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

              <div className="mt-6 flex justify-end space-x-4">
                <button 
                  onClick={handleExportResults} 
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded flex items-center transition-colors shadow-md"
                >
                  <FileTextIcon className="mr-2" /> Exportar Resultados
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Selecciona una fecha</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-blue-300 p-3 rounded w-full mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDateModal(false)}
                className="bg-gray-300 text-gray-700 px-5 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDateAndAddDay}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition-colors"
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