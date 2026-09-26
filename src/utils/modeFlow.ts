import type { AppMode } from '../types/finance';

/**
 * Regla del flujo de modos: solo se pide el monto si el modo con salario
 * no tiene ninguno registrado. Si ya existe, se entra directo al modo
 * con sus datos. Función pura y testeable.
 */
export const needsSalaryStep = (mode: AppMode, savedSalary: number): boolean =>
  (mode === 'biweekly' || mode === 'monthly') && !(savedSalary > 0);
