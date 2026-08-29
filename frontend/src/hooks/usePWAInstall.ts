import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWA_INSTALLED_STORAGE_KEY = 'klu_pwa_installed';

// Module-level capture so early beforeinstallprompt events fired before React mounts are never lost
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function checkIsPersistedInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (checkIsStandalone()) return true;
  try {
    return localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function checkIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

if (typeof window !== 'undefined') {
  globalIsInstalled = checkIsPersistedInstalled();

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent default mini-infobar from appearing on mobile
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    // If browser triggered install prompt, app is installable
    if (!checkIsStandalone()) {
      globalIsInstalled = false;
      try {
        localStorage.removeItem(PWA_INSTALLED_STORAGE_KEY);
      } catch {}
    }
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    globalIsInstalled = true;
    try {
      localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
    } catch {}
    notifyListeners();
  });
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isStandalone, setIsStandalone] = useState<boolean>(checkIsStandalone);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => globalIsInstalled || checkIsPersistedInstalled());
  const [isIOS] = useState<boolean>(checkIsIOS);

  useEffect(() => {
    const updateState = () => {
      setPromptEvent(globalDeferredPrompt);
      const standalone = checkIsStandalone();
      setIsStandalone(standalone);
      if (globalIsInstalled || standalone || checkIsPersistedInstalled()) {
        setIsInstalled(true);
      } else {
        setIsInstalled(false);
      }
    };

    listeners.add(updateState);
    updateState();

    // Check modern Chromium getInstalledRelatedApps API
    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
        .getInstalledRelatedApps()
        .then((apps) => {
          if (apps && apps.length > 0) {
            globalIsInstalled = true;
            try {
              localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
            } catch {}
            updateState();
          }
        })
        .catch(() => {});
    }

    // Listen for display mode changes (e.g. if launched in standalone after opening)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        globalIsInstalled = true;
        try {
          localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
        } catch {}
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
        try {
          localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
        } catch {}
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
