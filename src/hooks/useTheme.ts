import { useCallback, useEffect, useState } from 'react';
import type { Theme } from '../types/finance';
import { loadTheme, saveTheme } from '../utils/storage';

/** Tema claro por defecto; persiste en gfp:theme y refleja en <html data-theme>. */
export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => loadTheme() ?? 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    saveTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, setTheme: setThemeState, toggle };
};
