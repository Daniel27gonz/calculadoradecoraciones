import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Sparkles, Share, MoreVertical, Smartphone, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type DevicePlatform = "ios" | "android" | "desktop" | "unknown";

const PWAInstallPopup = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<DevicePlatform>("unknown");
  const [showInstructions, setShowInstructions] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Detect device platform
  const detectPlatform = useCallback((): DevicePlatform => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    console.log("[PWA Popup] 📱 Platform detection - iOS:", isIOS, "Android:", isAndroid);
    
    if (isIOS) return "ios";
    if (isAndroid) return "android";
    return "desktop";
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
    
    // Detect platform
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    console.log("[PWA Popup] 📲 Detected platform:", detectedPlatform);
    
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

    // Show popup after 2 seconds - ALWAYS
    const timer = setTimeout(() => {
      console.log("[PWA Popup] ⏰ 2 seconds elapsed!");
      console.log("[PWA Popup] 📊 State: platform=", detectedPlatform, "deferredPrompt=", !!promptRef.current);
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
  }, [checkStandalone, detectPlatform]);

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
        // On error, show manual instructions
        setShowInstructions(true);
      }
    } else {
      console.log("[PWA Popup] ⚠️ No native prompt available - showing manual instructions");
      setShowInstructions(true);
    }
    
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    console.log("[PWA Popup] 👋 Popup dismissed by user");
    setShowPopup(false);
    sessionStorage.setItem("pwa-popup-dismissed", "true");
  };

  const handleShowFullInstructions = () => {
    console.log("[PWA Popup] 📖 Navigating to full install instructions");
    setShowPopup(false);
    navigate("/install");
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
  console.log("[PWA Popup] 🎨 Rendering popup - canInstallNatively:", canInstallNatively, "platform:", platform);

  // Platform-specific instructions
  const renderPlatformInstructions = () => {
    if (!showInstructions && canInstallNatively) return null;

    switch (platform) {
      case "ios":
        return (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Share className="h-4 w-4 text-primary" />
              Instalación en Safari (iPhone/iPad):
            </p>
            <ol className="text-sm text-muted-foreground space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                <span>Toca el botón <strong className="text-foreground">Compartir</strong> <span className="inline-block px-1.5 py-0.5 bg-muted rounded text-xs">□↑</span> en la barra inferior</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                <span>Desliza y selecciona <strong className="text-foreground">"Añadir a pantalla de inicio"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                <span>Toca <strong className="text-foreground">"Añadir"</strong> ¡y listo!</span>
              </li>
            </ol>
          </div>
        );

      case "android":
        return (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MoreVertical className="h-4 w-4 text-green-600" />
              Instalación en Chrome (Android):
            </p>
            <ol className="text-sm text-muted-foreground space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 text-green-600 text-xs font-bold flex items-center justify-center">1</span>
                <span>Toca el <strong className="text-foreground">menú</strong> <span className="inline-block px-1.5 py-0.5 bg-muted rounded text-xs">⋮</span> en la esquina superior derecha</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 text-green-600 text-xs font-bold flex items-center justify-center">2</span>
                <span>Selecciona <strong className="text-foreground">"Añadir a pantalla de inicio"</strong> o <strong className="text-foreground">"Instalar app"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 text-green-600 text-xs font-bold flex items-center justify-center">3</span>
                <span>Confirma tocando <strong className="text-foreground">"Añadir"</strong></span>
              </li>
            </ol>
          </div>
        );

      default:
        return (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              Instalación en escritorio:
            </p>
            <ol className="text-sm text-muted-foreground space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
                <span>Busca el ícono de <strong className="text-foreground">instalación</strong> <span className="inline-block px-1.5 py-0.5 bg-muted rounded text-xs">⊕</span> en la barra de direcciones</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold flex items-center justify-center">2</span>
                <span>Haz clic en <strong className="text-foreground">"Instalar"</strong></span>
              </li>
            </ol>
          </div>
        );
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case "ios":
        return "🍎";
      case "android":
        return "🤖";
      default:
        return "💻";
    }
  };

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
                      console.log("[PWA Popup] ⚠️ Icon failed to load, showing fallback");
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl">🎈</span>';
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
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                  <span>{getPlatformIcon()}</span>
                  {canInstallNatively
                    ? "Accede más rápido desde tu pantalla"
                    : `Agrégala a tu ${platform === "desktop" ? "escritorio" : "pantalla de inicio"}`
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

            {/* Platform-specific Manual Instructions */}
            {renderPlatformInstructions()}

            {/* Install buttons */}
            <div className="mt-5 flex flex-col gap-3">
              {canInstallNatively ? (
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold shadow-lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {isInstalling ? "Instalando..." : "Instalar ahora"}
                </Button>
              ) : (
                <Button
                  onClick={handleShowFullInstructions}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold shadow-lg"
                >
                  <Smartphone className="h-5 w-5 mr-2" />
                  Ver instrucciones completas
                </Button>
              )}
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="w-full h-10 rounded-xl"
              >
                Quizás después
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPopup;
