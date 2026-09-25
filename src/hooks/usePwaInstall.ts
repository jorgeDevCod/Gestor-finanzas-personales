import { useCallback, useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Estado de instalación PWA:
 * - visible cuando la app NO está instalada y se puede instalar
 *   (evento beforeinstallprompt) o es iOS no-standalone (instrucciones manuales).
 * - se oculta automáticamente al instalarse (evento appinstalled o display-mode).
 */
export const usePwaInstall = () => {
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return; // ya instalada → botón oculto desde el inicio

    if (isIOS()) {
      setIosMode(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // tomamos control: mostramos nuestro botón
      deferred.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setVisible(false);
    };
    const onDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        deferred.current = null;
        setVisible(false);
      }
    };

    const mq = window.matchMedia('(display-mode: standalone)');
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    mq.addEventListener('change', onDisplayChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener('change', onDisplayChange);
    };
  }, []);

  /** Devuelve 'prompted' | 'ios-help' | 'unavailable' para que la UI reaccione. */
  const install = useCallback(async (): Promise<'prompted' | 'ios-help' | 'unavailable'> => {
    if (iosMode) return 'ios-help';
    const evt = deferred.current;
    if (!evt) return 'unavailable';
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === 'accepted') {
      deferred.current = null;
      setVisible(false);
    }
    return 'prompted';
  }, [iosMode]);

  return { visible, iosMode, install };
};
