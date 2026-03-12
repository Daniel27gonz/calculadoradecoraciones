import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Check if app is already installed/standalone
  const checkStandalone = (): boolean => {
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    console.log("[PWA Debug] Is Standalone Mode:", isStandaloneMode);
    console.log("[PWA Debug] Is iOS Standalone:", isIOSStandalone);
    return isStandaloneMode || isIOSStandalone;
  };

  useEffect(() => {
    console.log("[PWA Debug] InstallPrompt component mounted");
    
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    console.log("[PWA Debug] Was previously dismissed:", wasDismissed);
    
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already installed
    const standalone = checkStandalone();
    setIsStandalone(standalone);
    
    if (standalone) {
      console.log("[PWA Debug] App is already installed, not showing banner");
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      console.log("[PWA Debug] beforeinstallprompt event fired!");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    console.log("[PWA Debug] Added beforeinstallprompt listener");

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      console.log("[PWA Debug] Cleanup: removed listeners");
    };
  }, []);

  const handleInstall = async () => {
    console.log("[PWA Debug] Install button clicked");
    console.log("[PWA Debug] deferredPrompt available:", !!deferredPrompt);
    
    if (deferredPrompt) {
      console.log("[PWA Debug] Triggering native install prompt");
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[PWA Debug] User choice:", outcome);

        if (outcome === "accepted") {
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error("[PWA Debug] Error during install:", error);
        handleDismiss();
      }
    } else {
      console.log("[PWA Debug] No native prompt available, dismissing");
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    console.log("[PWA Debug] Banner dismissed");
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if dismissed or already installed
  if (dismissed || isStandalone) {
    console.log("[PWA Debug] Not rendering banner - dismissed:", dismissed, "standalone:", isStandalone);
    return null;
  }

  // Don't show if banner hasn't been triggered yet
  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-4 shadow-elevated">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-white/20 rounded-xl p-3">
            <Download className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">¡Instala la app!</h3>
            <p className="text-white/80 text-xs">
              Accede más rápido desde tu pantalla de inicio
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-white text-primary hover:bg-white/90 font-semibold"
            >
              Instalar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
