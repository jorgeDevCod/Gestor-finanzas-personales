import { calculateTotals, sumAll, fmtMoney, parseAmount } from './src/utils/calculations';
import { todayISO, isValidISO, isFutureISO, formatLong } from './src/utils/dates';
import { normalizePaymentType } from './src/types/finance';
import {
  buildMovement,
  kindToRows,
  removeMovement,
  upsertMovement,
  validateMovement,
} from './src/utils/movements';
import {
  daysInMonth,
  getCurrentPeriod,
  getDaysInPeriod,
  toISODate,
} from './src/utils/periods';
import { cashBalance, periodBalance } from './src/utils/calculations';

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

// movements (flujo registrar gasto/entrada)
check('kindToRows', kindToRows('income') === 'incomes' && kindToRows('expense') === 'expenses');
check('validate ok', validateMovement({ name: 'Comida', amount: '250.5', paymentType: 'efectivo' }) === null);
check('validate zero', validateMovement({ name: '', amount: '0', paymentType: '' }) !== null);
check('validate negative', validateMovement({ name: '', amount: '-10', paymentType: '' }) !== null);
check('validate NaN', validateMovement({ name: '', amount: 'abc', paymentType: '' }) !== null);
const m1 = buildMovement({ name: '  Taxi  ', amount: '120.00', paymentType: 'efectivo' });
const m2 = buildMovement({ name: 'Taxi', amount: '120', paymentType: 'efectivo' });
check('build trims+normalizes', m1.name === 'Taxi' && m1.amount === '120');
check('build unique ids', m1.id !== m2.id);
const emptyDay = { id: 'd', dateISO: '2026-09-20', incomes: [], expenses: [] };
const withOne = upsertMovement(emptyDay, 'expense', m1);
check('upsert adds', withOne.expenses.length === 1 && emptyDay.expenses.length === 0);
const edited = { ...m1, name: 'Taxi noche' };
const withEdit = upsertMovement(withOne, 'expense', edited);
check('upsert edits', withEdit.expenses.length === 1 && withEdit.expenses[0].name === 'Taxi noche');
const withIncome = upsertMovement(withEdit, 'income', m2);
const t2 = calculateTotals(withIncome);
check('realtime totals', t2.totalExpenses === 120 && t2.totalIncomes === 120 && t2.netBalance === 0);
const removed = removeMovement(withIncome, 'expense', m1.id);
check('remove keeps income', removed.expenses.length === 0 && removed.incomes.length === 1);

// periods (v1.1)
const p1 = getCurrentPeriod('biweekly', '2026-09-10');
check('biweekly 09-10 first half', p1.startISO === '2026-09-01' && p1.endISO === '2026-09-15');
const p2 = getCurrentPeriod('biweekly', '2026-09-26');
check('biweekly 09-26 second half', p2.startISO === '2026-09-16' && p2.endISO === '2026-09-30');
check('biweekly 09-26 elapsed/remaining', p2.totalDays === 15 && p2.elapsedDays === 11 && p2.daysRemaining === 4);
const p3 = getCurrentPeriod('monthly', '2026-09-26');
check('monthly 09 full month', p3.startISO === '2026-09-01' && p3.endISO === '2026-09-30');
const pd = getCurrentPeriod('daily', '2026-09-26');
check('daily is today', pd.startISO === '2026-09-26' && pd.endISO === '2026-09-26' && pd.totalDays === 1 && pd.daysRemaining === 0);
check('feb non-leap', daysInMonth(2026, 2) === 28 && getCurrentPeriod('biweekly', '2026-02-20').endISO === '2026-02-28');
check('feb leap', daysInMonth(2024, 2) === 29 && getCurrentPeriod('biweekly', '2024-02-20').endISO === '2024-02-29');
check('feb monthly non-leap', getCurrentPeriod('monthly', '2023-02-15').endISO === '2023-02-28');
check('month change', (() => { const p = getCurrentPeriod('biweekly', '2026-10-01'); return p.startISO === '2026-10-01' && p.endISO === '2026-10-15'; })());
check('remaining zero at end', (() => { const p = getCurrentPeriod('biweekly', '2026-09-30'); return p.daysRemaining === 0 && p.elapsedDays === 15; })());
check('toISODate pads', toISODate(2026, 3, 5) === '2026-03-05');

const periodDays = [
  { id: 'a', dateISO: '2026-09-05', incomes: [], expenses: [] },
  { id: 'b', dateISO: '2026-09-20', incomes: [], expenses: [] },
  { id: 'c', dateISO: '2026-10-02', incomes: [], expenses: [] },
];
check('filter in-period', getDaysInPeriod(periodDays, p2).map((d) => d.id).join(',') === 'b');
check('empty period sums zero', (() => { const t = sumAll(getDaysInPeriod([], p2)); return t.totalIncomes === 0 && t.totalExpenses === 0; })());

// biweekly example: 1750 + 120 - 840 = 1030, perDay 257.50
const pb = periodBalance(1750, { totalIncomes: 120, totalExpenses: 840, netBalance: -720 }, 4);
check('period available', pb.available === 1030);
check('period spent/budget', pb.spent === 840 && pb.budget === 1870);
check('period percent', pb.percentUsed === 45);
check('period perDay', pb.perDay === 257.5);
check('perDay null at zero', periodBalance(100, { totalIncomes: 0, totalExpenses: 10, netBalance: -10 }, 0).perDay === null);

// daily cash example: 500 + 100 - 20 - 15 = 565
check('cash balance', cashBalance(500, { totalIncomes: 100, totalExpenses: 35, netBalance: 65 }) === 565);

if (failures > 0) {
  console.error(`${failures} FALLAS`);
  process.exit(1);
}
console.log('SMOKE OK');
