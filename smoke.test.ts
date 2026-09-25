import { calculateTotals, sumAll, fmtMoney, parseAmount } from './src/utils/calculations';
import { todayISO, isValidISO, isFutureISO, formatLong } from './src/utils/dates';
import { normalizePaymentType } from './src/types/finance';

let failures = 0;
const check = (name: string, cond: boolean) => {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${name}`);
  } else {
    console.log(`ok: ${name}`);
  }
};

// calculations
const day = {
  incomes: [
    { id: 'a', name: 'Sueldo extra', amount: '800', paymentType: 'transferencia' as const },
    { id: 'b', name: '', amount: '', paymentType: '' as const },
  ],
  expenses: [
    { id: 'c', name: 'Comida', amount: '500.5', paymentType: 'efectivo' as const },
    { id: 'd', name: 'Raro', amount: 'no-num', paymentType: '' as const },
  ],
};
const t = calculateTotals(day);
check('totals income', t.totalIncomes === 800);
check('totals expenses', t.totalExpenses === 500.5);
check('totals net', t.netBalance === 299.5);
check('parseAmount NaN->0', parseAmount('abc') === 0);
check('fmtMoney', fmtMoney(14100) === '14.100,00');

// sumAll
const s = sumAll([
  { id: '1', dateISO: '2026-09-20', incomes: day.incomes, expenses: day.expenses },
  { id: '2', dateISO: '2026-09-21', incomes: [], expenses: [] },
]);
check('sumAll', s.totalIncomes === 800 && s.totalExpenses === 500.5);

// dates
check('todayISO valid', isValidISO(todayISO()));
check('invalid month', !isValidISO('2026-13-01'));
check('invalid day', !isValidISO('2026-02-30'));
check('future', isFutureISO('2999-01-01') && !isFutureISO('2000-01-01'));
check('formatLong es', formatLong('2026-09-20').includes('septiembre'));

// payment normalize (legacy -> nuevo enum)
check('legacy debito', normalizePaymentType('tarjeta Debito') === 'debito');
check('legacy credito', normalizePaymentType('tarjeta Credito') === 'credito');
check('transferencia', normalizePaymentType('transferencia') === 'transferencia');
check('unknown -> empty', normalizePaymentType('bitcoin') === '');

if (failures > 0) {
  console.error(`${failures} FALLAS`);
  process.exit(1);
}
console.log('SMOKE OK');
