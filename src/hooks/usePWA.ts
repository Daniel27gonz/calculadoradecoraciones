import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  canInstall: boolean;
  isOnline: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    canInstall: false,
    isOnline: navigator.onLine,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    
    console.log('[usePWA] 📱 Platform detection:', { isIOS, isAndroid, isStandalone });

    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isStandalone,
      isInstalled: isStandalone || sessionStorage.getItem('pwa-installed') === 'true',
    }));
  }, []);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('[usePWA] 🌐 App is online');
      setState(prev => ({ ...prev, isOnline: true }));
    };
    const handleOffline = () => {
      console.log('[usePWA] 📴 App is offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      console.log('[usePWA] 🎉 beforeinstallprompt event captured!');
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, canInstall: true }));
    };

    const handleAppInstalled = () => {
      console.log('[usePWA] 🎊 App installed successfully!');
      setDeferredPrompt(null);
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        canInstall: false 
      }));
      sessionStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install function
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[usePWA] ⚠️ No install prompt available');
      return false;
    }

    try {
      console.log('[usePWA] 🚀 Triggering install prompt...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[usePWA] 👤 User choice:', outcome);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setState(prev => ({ ...prev, canInstall: false }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[usePWA] ⚠️ Install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    ...state,
    installApp,
    deferredPrompt,
  };
}
