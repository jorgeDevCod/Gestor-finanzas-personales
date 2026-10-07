import type { AppMode } from '../types/finance';

/**
 * Regla del flujo de modos: solo se pide el monto si el modo con salario
 * no tiene ninguno registrado. Si ya existe, se entra directo al modo
 * con sus datos. Función pura y testeable.
 */
export const needsSalaryStep = (mode: AppMode, savedSalary: number): boolean =>
  (mode === 'biweekly' || mode === 'monthly') && !(savedSalary > 0);

/**
 * Paso inicial del asistente: 1 selector (primer arranque y cambio de modo),
 * 2 monto (edición directa de salario). Sin pantallas extra: la bienvenida
 * vive dentro del selector para llegar al valor en un toque.
 */
export const initialOnboardingStep = (opts: {
  isChanging: boolean;
  editingSalary: boolean;
}): 1 | 2 => {
  if (opts.editingSalary) return 2;
  return 1;
};
