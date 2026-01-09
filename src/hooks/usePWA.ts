import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type DevicePlatform = 'ios' | 'android' | 'desktop' | 'unknown';

interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  platform: DevicePlatform;
  canInstall: boolean;
  isOnline: boolean;
  serviceWorkerReady: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    platform: 'unknown',
    canInstall: false,
    isOnline: navigator.onLine,
    serviceWorkerReady: false,
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
    
    let platform: DevicePlatform = 'desktop';
    if (isIOS) platform = 'ios';
    else if (isAndroid) platform = 'android';
    
    console.log('[usePWA] 📱 Platform detection:', { platform, isStandalone });

    setState(prev => ({
      ...prev,
      platform,
      isStandalone,
      isInstalled: isStandalone || sessionStorage.getItem('pwa-installed') === 'true',
    }));

    // Check if Service Worker is ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('[usePWA] ✅ Service Worker is ready');
        setState(prev => ({ ...prev, serviceWorkerReady: true }));
      }).catch((error) => {
        console.error('[usePWA] ⚠️ Service Worker not ready:', error);
      });
    }
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

  // Get platform-specific install instructions
  const getInstallInstructions = useCallback(() => {
    switch (state.platform) {
      case 'ios':
        return {
          title: 'Instalar en iPhone/iPad',
          steps: [
            'Abre esta página en Safari',
            'Toca el botón Compartir (□↑)',
            'Selecciona "Añadir a pantalla de inicio"',
            'Toca "Añadir"'
          ],
          icon: '🍎'
        };
      case 'android':
        return {
          title: 'Instalar en Android',
          steps: [
            'Abre esta página en Chrome',
            'Toca el menú (⋮) arriba a la derecha',
            'Selecciona "Añadir a pantalla de inicio"',
            'Confirma tocando "Añadir"'
          ],
          icon: '🤖'
        };
      default:
        return {
          title: 'Instalar en escritorio',
          steps: [
            'Abre en Chrome, Edge o Safari',
            'Busca el ícono de instalación en la barra de direcciones',
            'Haz clic en "Instalar"'
          ],
          icon: '💻'
        };
    }
  }, [state.platform]);

  return {
    ...state,
    installApp,
    deferredPrompt,
    getInstallInstructions,
  };
}
