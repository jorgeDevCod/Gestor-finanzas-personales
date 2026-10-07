import type { AppMode } from '../types/finance';

/**
 * Regla del flujo de modos: solo se pide el monto si el modo con salario
 * no tiene ninguno registrado. Si ya existe, se entra directo al modo
 * con sus datos. Función pura y testeable.
 */
export const needsSalaryStep = (mode: AppMode, savedSalary: number): boolean =>
  (mode === 'biweekly' || mode === 'monthly') && !(savedSalary > 0);

/**
 * Paso inicial del asistente: 0 bienvenida (primer arranque),
 * 1 selector (al cambiar de modo), 2 monto (edición directa de salario).
 */
export const initialOnboardingStep = (opts: {
  isChanging: boolean;
  editingSalary: boolean;
}): 0 | 1 | 2 => {
  if (opts.editingSalary) return 2;
  if (opts.isChanging) return 1;
  return 0;
};
