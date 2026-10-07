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
import { initialOnboardingStep, needsSalaryStep } from './src/utils/modeFlow';
import {
  loadInitialBalance,
  loadSalary,
  loadSalaryForMode,
  loadCategories,
  loadView,
  loadView,
  resetInitialBalance,
  resetSalaryForMode,
  saveCategories,
  saveInitialBalance,
  saveSalary,
  saveSalaryForMode,
  saveView,
  saveView,
  seedCategoriesIfNeeded,
} from './src/utils/storage';
import {
  addCategory,
  cleanName,
  countByCategory,
  dedupeCategories,
  MAX_PER_KIND,
  normalizeKey,
  removeCategory,
  renameCategory,
  resolveCategory,
  seedCategories,
  summarizeByCategory,
} from './src/utils/categories';

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

// persistence: cambiar de modo no reinicia montos
const memStore = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k: string, v: string) => {
    memStore.set(k, String(v));
  },
  removeItem: (k: string) => {
    memStore.delete(k);
  },
};
saveSalary(1750);
saveInitialBalance(500);
check('salary roundtrip', loadSalary() === 1750);
check('initial roundtrip', loadInitialBalance() === 500);
check('daily keeps salary', saveSalaryForMode('daily', 0) === 1750 && loadSalary() === 1750);
check('switch mode updates', saveSalaryForMode('monthly', 3500) === 3500 && loadSalaryForMode('monthly') === 3500);
check('invalid ignored', (() => { const before = loadSalaryForMode('biweekly'); return saveSalaryForMode('biweekly', -5) === before; })());
check('initial untouched by mode change', loadInitialBalance() === 500);

// salarios independientes por modo (no se entreveran)
memStore.clear();
check('monthly empty asks', loadSalaryForMode('monthly') === 0 && needsSalaryStep('monthly', 0) === true);
saveSalaryForMode('biweekly', 1400);
check('biweekly keeps 1400', loadSalaryForMode('biweekly') === 1400);
check('monthly still empty', loadSalaryForMode('monthly') === 0);
saveSalaryForMode('monthly', 1700);
check('monthly keeps 1700', loadSalaryForMode('monthly') === 1700);
check('biweekly untouched', loadSalaryForMode('biweekly') === 1400);
saveSalaryForMode('daily', 0);
check('daily touches nothing', loadSalaryForMode('biweekly') === 1400 && loadSalaryForMode('monthly') === 1700);
memStore.clear();
saveSalary(2000);
check('legacy seeds both once', loadSalaryForMode('biweekly') === 2000 && loadSalaryForMode('monthly') === 2000);
saveSalaryForMode('monthly', 1700);
check('independent after seed', loadSalaryForMode('biweekly') === 2000 && loadSalaryForMode('monthly') === 1700);

// reset: solo afecta al modo indicado
memStore.clear();
saveSalaryForMode('biweekly', 1400);
saveSalaryForMode('monthly', 1700);
saveInitialBalance(500);
resetSalaryForMode('biweekly');
check('reset biweekly empties', loadSalaryForMode('biweekly') === 0);
check('reset keeps monthly', loadSalaryForMode('monthly') === 1700);
check('reset biweekly asks again', needsSalaryStep('biweekly', loadSalaryForMode('biweekly')) === true);
resetInitialBalance();
check('reset initial to zero', loadInitialBalance() === 0);

// mode flow: si el modo ya tiene monto, se entra directo sin pedirlo
check('daily never asks', needsSalaryStep('daily', 0) === false && needsSalaryStep('daily', 1750) === false);
check('first biweekly asks', needsSalaryStep('biweekly', 0) === true);
check('created biweekly skips', needsSalaryStep('biweekly', 1750) === false);
check('created monthly skips', needsSalaryStep('monthly', 3500) === false);
check('first run goes to picker', initialOnboardingStep({ isChanging: false, editingSalary: false }) === 1);
check('picker when changing', initialOnboardingStep({ isChanging: true, editingSalary: false }) === 1);
check('salary step when editing', initialOnboardingStep({ isChanging: true, editingSalary: true }) === 2);

// categories: normalización
check('normalizeKey basic', normalizeKey('  Comída ') === 'comida');
check('normalizeKey case/tabs', normalizeKey('\tCOMIDA\n') === 'comida');
check('normalizeKey accents', normalizeKey('niño') === 'nino' && normalizeKey('CRÉDITO') === 'credito');
check('normalizeKey empty', normalizeKey('   ') === '');
check('cleanName collapse', cleanName('  Comida   rápida  ') === 'Comida rápida');
check('cleanName truncates', cleanName('a'.repeat(30)) === 'a'.repeat(24));
check('cleanName empty', cleanName('   ') === '');
check('seed has 8', (() => {
  const seed = seedCategories(() => 'x');
  return seed.length === 8 && seed.filter((c) => c.kind === 'expense').length === 6 && seed.filter((c) => c.kind === 'income').length === 2;
})());

// categories: add con duplicados, vacío y tope
const base: { id: string; name: string; kind: 'expense' | 'income' }[] = [
  { id: 'c1', name: 'Comida', kind: 'expense' },
];
const dup1 = addCategory(base, 'expense', 'COMIDA', 'n1');
check('dup case reuses', dup1.created === false && dup1.category?.id === 'c1' && dup1.list.length === 1);
const dup2 = addCategory(base, 'expense', '  comída ', 'n2');
check('dup accent/space reuses', dup2.created === false && dup2.category?.id === 'c1');
const crossKind = addCategory(base, 'income', 'Comida', 'n3');
check('same word other kind creates', crossKind.created === true && crossKind.category?.id === 'n3' && crossKind.list.length === 2);
const emptyAdd = addCategory(base, 'expense', '   ', 'n4');
check('empty rejected', emptyAdd.created === false && emptyAdd.category === null && emptyAdd.reason === 'empty' && emptyAdd.list.length === 1);
const full: { id: string; name: string; kind: 'expense' }[] = Array.from({ length: MAX_PER_KIND }, (_, i) => ({ id: `e${i}`, name: `Cat${i}`, kind: 'expense' as const }));
const over = addCategory(full, 'expense', 'Otra', 'n5');
check('limit 30 per kind', over.created === false && over.category === null && over.reason === 'limit' && over.list.length === MAX_PER_KIND);
const otherKindOk = addCategory(full, 'income', 'Otra', 'n6');
check('limit is per kind', otherKindOk.created === true);

// categories: rename / remove / resolve / count
const rlist = [
  { id: 'r1', name: 'Comida', kind: 'expense' as const },
  { id: 'r2', name: 'Taxi', kind: 'expense' as const },
];
const ren = renameCategory(rlist, 'r2', 'Transporte');
check('rename ok', ren.ok === true && ren.list.find((c) => c.id === 'r2')?.name === 'Transporte');
check('rename conflict', renameCategory(rlist, 'r2', 'comida').ok === false);
check('rename empty', renameCategory(rlist, 'r2', '  ').ok === false);
check('rename missing', renameCategory(rlist, 'zz', 'X').ok === false);
check('rename same name ok', renameCategory(rlist, 'r1', 'Comida').ok === true);
const rem = removeCategory(rlist, 'r1');
check('remove filters', rem.removed === true && rem.list.length === 1);
check('remove missing', removeCategory(rlist, 'zz').removed === false);
check('resolve valid', resolveCategory(rlist, 'r1')?.name === 'Comida');
check('resolve undefined/empty/missing', resolveCategory(rlist) === null && resolveCategory(rlist, '') === null && resolveCategory(rlist, 'zz') === null);
check('countByCategory', countByCategory(
  [{ categoryId: 'r1' }, {}, { categoryId: 'r1' }, { categoryId: 'other' }],
  'r1',
) === 2);

// categories: resumen ordenado, huérfanos agrupados, pcts suman 100.0
const slist = [
  { id: 's1', name: 'Comida', kind: 'expense' as const },
  { id: 's2', name: 'Taxi', kind: 'expense' as const },
];
const srows = [
  { amount: '100', categoryId: 's1' },
  { amount: '50', categoryId: 's2' },
  { amount: '30' },
  { amount: '5', categoryId: 'zzz-huerfano' },
  { amount: 'abc', categoryId: 's1' },
  { amount: '', categoryId: 's2' },
  { amount: '0', categoryId: 's1' },
  { amount: '-10', categoryId: 's1' },
];
const sum = summarizeByCategory(srows, slist);
check('summary order desc', sum.map((s) => s.id).join(',') === 's1,s2,');
check('summary orphan grouped', (() => {
  const none = sum.find((s) => s.id === null);
  return none?.name === 'Sin categoría' && none.total === 35;
})());
check('summary pcts sum ~100', Math.abs(sum.reduce((a, s) => a + s.pct, 0) - 100) < 0.05);
check('summary empty', summarizeByCategory([], slist).length === 0 && summarizeByCategory([{ amount: '0' }], slist).length === 0);
check('dedupe collapses', dedupeCategories([
  { id: 'a', name: 'Comida', kind: 'expense' as const },
  { id: 'b', name: 'COMIDA', kind: 'expense' as const },
  { id: 'c', name: 'Comida', kind: 'income' as const },
]).length === 2);

// categories: storage (mock localStorage ya instalado arriba)
memStore.clear();
const seeded = seedCategoriesIfNeeded();
check('seed once has 8', seeded.length === 8);
const seededAgain = seedCategoriesIfNeeded();
check('seed idempotent', seededAgain.length === 8 && seededAgain[0].id === seeded[0].id);
check('seed respects existing', (() => {
  memStore.clear();
  saveCategories([{ id: 'mine', name: 'Mía', kind: 'expense' }]);
  const got = seedCategoriesIfNeeded();
  return got.length === 1 && got[0].id === 'mine';
})());
memStore.set('gfp:categories', 'no-es-json{{{');
check('corrupt json safe', loadCategories().length === 0);
memStore.set('gfp:categories', JSON.stringify([
  { id: 'ok1', name: '  Comida  ', kind: 'expense' },
  { id: '', name: 'SinId', kind: 'expense' },
  { id: 'ok2', name: '', kind: 'expense' },
  { id: 'ok3', name: 'X', kind: 'weird' },
  { id: 'ok4', name: 'COMIDA', kind: 'expense' },
  'no-objeto',
  null,
]));
check('sanitize + dedupe', (() => {
  const got = loadCategories();
  return got.length === 1 && got[0].id === 'ok1' && got[0].name === 'Comida';
})());
(globalThis as Record<string, unknown>).localStorage = {
  getItem: () => { throw new Error('bloqueado'); },
  setItem: () => { throw new Error('bloqueado'); },
  removeItem: () => { throw new Error('bloqueado'); },
};
check('storage down safe', (() => {
  try {
    // Sin persistencia: lectura vacía pero la app sigue funcionando en memoria.
    return loadCategories().length === 0 && seedCategoriesIfNeeded().length === 8;
  } catch {
    return false;
  }
})());
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k: string, v: string) => {
    memStore.set(k, String(v));
  },
  removeItem: (k: string) => {
    memStore.delete(k);
  },
};

// categories: buildMovement propaga sin tocar validación
check('build keeps category', buildMovement({ name: 'X', amount: '10', paymentType: 'efectivo', categoryId: 's1' }).categoryId === 's1');
check('build omits empty category', !('categoryId' in buildMovement({ name: 'X', amount: '10', paymentType: 'efectivo', categoryId: '' })));
check('build omits absent category', !('categoryId' in buildMovement({ name: 'X', amount: '10', paymentType: 'efectivo' })));

// view: inválida o ausente → 'resumen'
memStore.delete('gfp:view');
check('view default resumen', loadView() === 'resumen');
memStore.set('gfp:view', 'nube');
check('view invalid resumen', loadView() === 'resumen');
saveView('ajustes');
check('view roundtrip', loadView() === 'ajustes');

if (failures > 0) {
  console.error(`${failures} FALLAS`);
  process.exit(1);
}
console.log('SMOKE OK');
