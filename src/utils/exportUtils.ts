import * as XLSX from 'xlsx';
import type { DayEntry } from '../types/finance';
import { calculateTotals, fmtMoney } from './calculations';
import { formatLong } from './dates';
import { paymentLabel } from './constants';

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Liberar memoria (faltaba en la versión JS: leak de ObjectURL).
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const stamp = (): string => new Date().toISOString().split('T')[0];

/** Exporta todos los días a texto plano (conserva formato legacy). */
export const exportToTextFile = (days: DayEntry[]): void => {
  const body = days
    .map((day) => {
      const incomeDetails = day.incomes
        .filter((r) => r.name.trim() !== '' || r.amount.trim() !== '')
        .map((r) => `Ingreso: ${r.name || 'Sin descripción'} - $${r.amount || '0'} (${paymentLabel(r.paymentType)})`)
        .join('\n');
      const expenseDetails = day.expenses
        .filter((r) => r.name.trim() !== '' || r.amount.trim() !== '')
        .map((r) => `Gasto: ${r.name || 'Sin descripción'} - $${r.amount || '0'} (${paymentLabel(r.paymentType)})`)
        .join('\n');
      const { totalIncomes, totalExpenses, netBalance } = calculateTotals(day);
      return [
        `Fecha: ${formatLong(day.dateISO)}`,
        incomeDetails,
        expenseDetails,
        `Total Ingresos: $${totalIncomes.toFixed(2)}`,
        `Total Gastos: $${totalExpenses.toFixed(2)}`,
        `Saldo Neto: $${netBalance.toFixed(2)}`,
        '----------------------------',
      ]
        .filter((line) => line !== '')
        .join('\n');
    })
    .join('\n\n');

  downloadBlob(new Blob([body], { type: 'text/plain;charset=utf-8' }), `Mis Finanzas_${stamp()}.txt`);
};

interface ExcelRow {
  Fecha: string;
  Tipo: string;
  Descripción: string;
  Monto: number;
  'Método de pago': string;
}

/** Exporta todos los días a Excel real (.xlsx) usando la dependencia xlsx. */
export const exportToExcel = (days: DayEntry[]): void => {
  const detail: ExcelRow[] = days.flatMap((day) => {
    const fecha = formatLong(day.dateISO);
    const ins: ExcelRow[] = day.incomes
      .filter((r) => r.name.trim() !== '' || r.amount.trim() !== '')
      .map((r) => ({
        Fecha: fecha,
        Tipo: 'Ingreso',
        Descripción: r.name || 'Sin descripción',
        Monto: parseFloat(r.amount) || 0,
        'Método de pago': paymentLabel(r.paymentType),
      }));
    const outs: ExcelRow[] = day.expenses
      .filter((r) => r.name.trim() !== '' || r.amount.trim() !== '')
      .map((r) => ({
        Fecha: fecha,
        Tipo: 'Gasto',
        Descripción: r.name || 'Sin descripción',
        Monto: parseFloat(r.amount) || 0,
        'Método de pago': paymentLabel(r.paymentType),
      }));
    return [...ins, ...outs];
  });

  const summary = days.map((day) => {
    const t = calculateTotals(day);
    return {
      Fecha: formatLong(day.dateISO),
      'Total ingresos': Number(t.totalIncomes.toFixed(2)),
      'Total gastos': Number(t.totalExpenses.toFixed(2)),
      'Saldo neto': Number(t.netBalance.toFixed(2)),
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(detail.length > 0 ? detail : [{ Fecha: '', Tipo: '', Descripción: 'Sin movimientos', Monto: 0, 'Método de pago': '' }]),
    'Movimientos',
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Resumen por día');
  XLSX.writeFile(wb, `Mis Finanzas_${stamp()}.xlsx`);
};

export const fmtMoneyEs = fmtMoney;
