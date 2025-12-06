import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share, MoreVertical, Monitor, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | "unknown";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Detect platform
  const detectPlatform = (): Platform => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(userAgent);
    
    console.log("[PWA Debug] User Agent:", userAgent);
    console.log("[PWA Debug] Is iOS:", isIOS);
    console.log("[PWA Debug] Is Android:", isAndroid);
    
    if (isIOS) return "ios";
    if (isAndroid) return "android";
    return "desktop";
  };

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

    // Detect platform
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    console.log("[PWA Debug] Detected platform:", detectedPlatform);

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
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    console.log("[PWA Debug] Added beforeinstallprompt listener");

    // Show banner after 2 seconds regardless of beforeinstallprompt support
    const timer = setTimeout(() => {
      console.log("[PWA Debug] 2 second timer elapsed, showing banner");
      console.log("[PWA Debug] deferredPrompt available:", !!deferredPrompt);
      setShowBanner(true);
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(timer);
      console.log("[PWA Debug] Cleanup: removed listeners and timer");
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
        setShowManualInstructions(true);
      }
    } else {
      console.log("[PWA Debug] No native prompt available, showing manual instructions");
      setShowManualInstructions(true);
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

  const renderManualInstructions = () => {
    console.log("[PWA Debug] Rendering manual instructions for platform:", platform);
    
    switch (platform) {
      case "ios":
        return (
          <div className="space-y-3 text-white text-sm">
            <p className="font-semibold">Instalar en iPhone/iPad:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Share className="h-4 w-4" />
                </div>
                <span>1. Toca el botón <strong>Compartir</strong> en Safari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Download className="h-4 w-4" />
                </div>
                <span>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Smartphone className="h-4 w-4" />
                </div>
                <span>3. Toca <strong>"Añadir"</strong> para confirmar</span>
              </div>
            </div>
          </div>
        );
      case "android":
        return (
          <div className="space-y-3 text-white text-sm">
            <p className="font-semibold">Instalar en Android:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <MoreVertical className="h-4 w-4" />
                </div>
                <span>1. Toca el menú <strong>⋮</strong> en Chrome</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Download className="h-4 w-4" />
                </div>
                <span>2. Selecciona <strong>"Instalar app"</strong> o <strong>"Añadir a pantalla"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Smartphone className="h-4 w-4" />
                </div>
                <span>3. Confirma tocando <strong>"Instalar"</strong></span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-3 text-white text-sm">
            <p className="font-semibold">Instalar en tu computadora:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Monitor className="h-4 w-4" />
                </div>
                <span>1. Busca el ícono <strong>⊕</strong> en la barra de direcciones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Download className="h-4 w-4" />
                </div>
                <span>2. Haz clic en <strong>"Instalar"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Smartphone className="h-4 w-4" />
                </div>
                <span>3. La app aparecerá como aplicación independiente</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-4 shadow-elevated">
        {showManualInstructions ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              {renderManualInstructions()}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <Link to="/install" className="text-white/80 text-xs hover:text-white underline">
                Ver guía completa
              </Link>
              <Button
                onClick={handleDismiss}
                size="sm"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
              >
                Entendido
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-white/20 rounded-xl p-3">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm">¡Instala la app!</h3>
              <p className="text-white/80 text-xs">
                {deferredPrompt 
                  ? "Accede más rápido desde tu pantalla de inicio"
                  : "Sigue las instrucciones para instalar"
                }
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
                {deferredPrompt ? "Instalar" : "Cómo instalar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
