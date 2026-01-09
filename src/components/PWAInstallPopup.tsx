import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Sparkles, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const PWAInstallPopup = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Check if device is iOS
  const checkIsIOS = useCallback((): boolean => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    console.log("[PWA Popup] 📱 iOS check - Device:", isIOSDevice, "Safari:", isSafari);
    return isIOSDevice;
  }, []);

  // Check if app is already installed/standalone
  const checkStandalone = useCallback((): boolean => {
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    console.log("[PWA Popup] 🔍 Standalone check - Mode:", isStandaloneMode, "iOS:", isIOSStandalone);
    return isStandaloneMode || isIOSStandalone;
  }, []);

  useEffect(() => {
    console.log("[PWA Popup] 🚀 Component mounted at", new Date().toISOString());
    
    // Check if iOS device
    const iosDevice = checkIsIOS();
    setIsIOS(iosDevice);
    
    // Check if already installed
    const standalone = checkStandalone();
    setIsStandalone(standalone);
    
    if (standalone) {
      console.log("[PWA Popup] ✅ App is already installed, hiding popup");
      return;
    }

    // Check if dismissed in this session
    const wasDismissed = sessionStorage.getItem("pwa-popup-dismissed");
    if (wasDismissed) {
      console.log("[PWA Popup] 🚫 Popup was dismissed this session, not showing");
      return;
    }

    console.log("[PWA Popup] 📣 Setting up beforeinstallprompt listener...");

    // Listen for beforeinstallprompt event IMMEDIATELY
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      console.log("[PWA Popup] 🎉 beforeinstallprompt event CAPTURED!");
      e.preventDefault();
      promptRef.current = e;
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    console.log("[PWA Popup] ✅ beforeinstallprompt listener added");

    // Show popup after 2 seconds - ALWAYS (for iOS show manual instructions)
    const timer = setTimeout(() => {
      console.log("[PWA Popup] ⏰ 2 seconds elapsed!");
      console.log("[PWA Popup] 📊 State: isIOS=", iosDevice, "deferredPrompt=", !!promptRef.current);
      setShowPopup(true);
      console.log("[PWA Popup] ✨ Popup is now VISIBLE");
    }, 2000);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("[PWA Popup] 🎊 App was successfully installed!");
      setShowPopup(false);
      setDeferredPrompt(null);
      promptRef.current = null;
      sessionStorage.setItem("pwa-installed", "true");
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    console.log("[PWA Popup] ✅ appinstalled listener added");

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(timer);
      console.log("[PWA Popup] 🧹 Cleanup complete");
    };
  }, [checkStandalone, checkIsIOS]);

  // Update ref when deferredPrompt changes
  useEffect(() => {
    if (deferredPrompt) {
      console.log("[PWA Popup] ✅ deferredPrompt is now available in state");
      promptRef.current = deferredPrompt;
    }
  }, [deferredPrompt]);

  const handleInstall = async () => {
    console.log("[PWA Popup] 🔘 Install button clicked!");
    setIsInstalling(true);

    const prompt = promptRef.current || deferredPrompt;
    
    if (prompt) {
      console.log("[PWA Popup] 🚀 Triggering native install prompt...");
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        console.log("[PWA Popup] 👤 User choice:", outcome);

        if (outcome === "accepted") {
          console.log("[PWA Popup] ✅ Installation ACCEPTED!");
          setShowPopup(false);
          sessionStorage.setItem("pwa-popup-dismissed", "true");
        } else {
          console.log("[PWA Popup] ❌ Installation dismissed by user");
        }
        setDeferredPrompt(null);
        promptRef.current = null;
      } catch (error) {
        console.error("[PWA Popup] ⚠️ Error during installation:", error);
        // On error, don't hide the popup - user might want to retry
      }
    } else {
      console.log("[PWA Popup] ⚠️ No native prompt available");
      if (isIOS) {
        console.log("[PWA Popup] 📱 iOS device - showing manual instructions");
      } else {
        console.log("[PWA Popup] 🔄 Non-iOS without prompt - check browser support");
      }
    }
    
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    console.log("[PWA Popup] 👋 Popup dismissed by user");
    setShowPopup(false);
    sessionStorage.setItem("pwa-popup-dismissed", "true");
  };

  // Don't render if already installed or popup not triggered
  if (isStandalone) {
    console.log("[PWA Popup] 🛑 Not rendering - app is standalone");
    return null;
  }

  if (!showPopup) {
    return null;
  }

  const canInstallNatively = !!promptRef.current || !!deferredPrompt;
  console.log("[PWA Popup] 🎨 Rendering popup - canInstallNatively:", canInstallNatively, "isIOS:", isIOS);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div 
        className="w-full max-w-md pointer-events-auto animate-in slide-in-from-bottom-5 duration-300"
        role="dialog"
        aria-labelledby="pwa-install-title"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-accent to-lavender p-1 shadow-2xl">
          <div className="rounded-[22px] bg-background/95 backdrop-blur-xl p-5">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-4">
              {/* App icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="/pwa-icon-192.png" 
                    alt="App icon" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log("[PWA Popup] ⚠️ Icon failed to load");
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-8">
                <h3 
                  id="pwa-install-title" 
                  className="font-display text-lg font-semibold text-foreground flex items-center gap-2"
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  ¡Instala la app!
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isIOS && !canInstallNatively
                    ? "Agrégala a tu pantalla de inicio"
                    : "Accede más rápido desde tu pantalla de inicio"
                  }
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 rounded-xl bg-rose-light/30">
                <span className="text-xl">⚡</span>
                <span className="text-xs text-muted-foreground mt-1">Rápido</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-lavender-light/30">
                <span className="text-xl">📱</span>
                <span className="text-xs text-muted-foreground mt-1">Como app</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-beige/50">
                <span className="text-xl">✨</span>
                <span className="text-xs text-muted-foreground mt-1">Offline</span>
              </div>
            </div>

            {/* iOS Manual Instructions */}
            {isIOS && !canInstallNatively && (
              <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-muted">
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  En Safari:
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 ml-6 list-decimal">
                  <li>Toca el botón <strong>Compartir</strong> (□↑)</li>
                  <li>Selecciona <strong>"Añadir a inicio"</strong></li>
                  <li>Toca <strong>"Añadir"</strong></li>
                </ol>
              </div>
            )}

            {/* Install button */}
            <div className="mt-5 flex gap-3">
              {canInstallNatively ? (
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold shadow-lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {isInstalling ? "Instalando..." : "Instalar ahora"}
                </Button>
              ) : (
                <Button
                  onClick={handleDismiss}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold shadow-lg"
                >
                  ¡Entendido!
                </Button>
              )}
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="h-12 px-4 rounded-xl"
              >
                Después
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPopup;
