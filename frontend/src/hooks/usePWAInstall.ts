import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Module-level capture so early beforeinstallprompt events fired before React mounts are never lost
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent default mini-infobar from appearing on mobile
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    globalIsInstalled = true;
    notifyListeners();
  });
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function checkIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isStandalone, setIsStandalone] = useState<boolean>(checkIsStandalone);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => globalIsInstalled || checkIsStandalone());
  const [isIOS] = useState<boolean>(checkIsIOS);

  useEffect(() => {
    const updateState = () => {
      setPromptEvent(globalDeferredPrompt);
      const standalone = checkIsStandalone();
      setIsStandalone(standalone);
      if (globalIsInstalled || standalone) {
        setIsInstalled(true);
      }
    };

    listeners.add(updateState);
    updateState();

    // Listen for display mode changes (e.g. if launched in standalone after opening)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      listeners.delete(updateState);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!globalDeferredPrompt) {
      return false;
    }

    try {
      await globalDeferredPrompt.prompt();
      const choiceResult = await globalDeferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        globalDeferredPrompt = null;
        globalIsInstalled = true;
        setPromptEvent(null);
        setIsInstalled(true);
        notifyListeners();
        return true;
      }
      return false;
    } catch (err) {
      console.error('PWA installation error:', err);
      return false;
    }
  }, []);

  const canInstall = !isStandalone && !isInstalled && promptEvent !== null;

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isIOS,
    install,
  };
}
