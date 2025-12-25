import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Sparkles } from "lucide-react";

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

  // Check if app is already installed/standalone
  const checkStandalone = useCallback((): boolean => {
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    console.log("[PWA Popup] Checking standalone - Mode:", isStandaloneMode, "iOS:", isIOSStandalone);
    return isStandaloneMode || isIOSStandalone;
  }, []);

  useEffect(() => {
    console.log("[PWA Popup] Component mounted");
    
    // Check if already installed
    const standalone = checkStandalone();
    setIsStandalone(standalone);
    
    if (standalone) {
      console.log("[PWA Popup] App is already installed, not showing popup");
      return;
    }

    // Check if dismissed in this session
    const wasDismissed = sessionStorage.getItem("pwa-popup-dismissed");
    if (wasDismissed) {
      console.log("[PWA Popup] Popup was dismissed this session");
      return;
    }

    // Listen for beforeinstallprompt event IMMEDIATELY
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      console.log("[PWA Popup] 🎉 beforeinstallprompt event captured!");
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    console.log("[PWA Popup] Added beforeinstallprompt listener");

    // Show popup after 2 seconds
    const timer = setTimeout(() => {
      console.log("[PWA Popup] ⏰ 2 seconds elapsed - showing popup");
      console.log("[PWA Popup] deferredPrompt available:", !!deferredPrompt);
      setShowPopup(true);
    }, 2000);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("[PWA Popup] 🎊 App was installed!");
      setShowPopup(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(timer);
      console.log("[PWA Popup] Cleanup complete");
    };
  }, [checkStandalone]);

  // Update popup when deferredPrompt changes
  useEffect(() => {
    if (deferredPrompt) {
      console.log("[PWA Popup] deferredPrompt is now available");
    }
  }, [deferredPrompt]);

  const handleInstall = async () => {
    console.log("[PWA Popup] Install button clicked");
    setIsInstalling(true);

    if (deferredPrompt) {
      console.log("[PWA Popup] Triggering native install prompt...");
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[PWA Popup] User choice:", outcome);

        if (outcome === "accepted") {
          console.log("[PWA Popup] ✅ User accepted installation");
          setShowPopup(false);
          sessionStorage.setItem("pwa-popup-dismissed", "true");
        } else {
          console.log("[PWA Popup] ❌ User dismissed installation");
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error("[PWA Popup] Error during install:", error);
      }
    } else {
      console.log("[PWA Popup] No native prompt available - retrying...");
      // Try again after a short delay
      setTimeout(async () => {
        if (deferredPrompt) {
          try {
            await deferredPrompt.prompt();
          } catch (e) {
            console.error("[PWA Popup] Retry failed:", e);
          }
        }
      }, 500);
    }
    
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    console.log("[PWA Popup] Popup dismissed by user");
    setShowPopup(false);
    sessionStorage.setItem("pwa-popup-dismissed", "true");
  };

  // Don't render if already installed or popup not triggered
  if (isStandalone || !showPopup) {
    return null;
  }

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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <img 
                    src="/pwa-icon-192.png" 
                    alt="App icon" 
                    className="w-12 h-12 rounded-xl"
                    onError={(e) => {
                      // Fallback to icon if image fails
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
                  Accede más rápido desde tu pantalla de inicio
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
                <span className="text-xs text-muted-foreground mt-1">Sin ads</span>
              </div>
            </div>

            {/* Install button */}
            <div className="mt-5 flex gap-3">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold shadow-lg"
              >
                <Download className="h-5 w-5 mr-2" />
                {isInstalling ? "Instalando..." : "Instalar ahora"}
              </Button>
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
