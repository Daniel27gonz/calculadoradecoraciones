import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share, MoreVertical, Monitor, Smartphone, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | "unknown";

const FirstLoginInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { user } = useAuth();

  // Detect platform
  const detectPlatform = (): Platform => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(userAgent);
    
    console.log("[PWA First Login] User Agent:", userAgent);
    console.log("[PWA First Login] Is iOS:", isIOS);
    console.log("[PWA First Login] Is Android:", isAndroid);
    
    if (isIOS) return "ios";
    if (isAndroid) return "android";
    return "desktop";
  };

  // Check if app is already installed/standalone
  const checkStandalone = (): boolean => {
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    console.log("[PWA First Login] Is Standalone Mode:", isStandaloneMode);
    console.log("[PWA First Login] Is iOS Standalone:", isIOSStandalone);
    return isStandaloneMode || isIOSStandalone;
  };

  useEffect(() => {
    if (!user) return;

    console.log("[PWA First Login] User logged in, checking if first login");
    
    // Check if this is first login for this user
    const hasSeenPrompt = localStorage.getItem(`pwa-install-seen-${user.id}`);
    console.log("[PWA First Login] Has seen prompt before:", hasSeenPrompt);
    
    if (hasSeenPrompt) {
      return;
    }

    // Check if already installed
    const standalone = checkStandalone();
    setIsStandalone(standalone);
    
    if (standalone) {
      console.log("[PWA First Login] App already installed, marking as seen");
      localStorage.setItem(`pwa-install-seen-${user.id}`, "true");
      return;
    }

    // Detect platform
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    console.log("[PWA First Login] Detected platform:", detectedPlatform);

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      console.log("[PWA First Login] beforeinstallprompt event fired!");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    console.log("[PWA First Login] Added beforeinstallprompt listener");

    // Show modal after a short delay
    const timer = setTimeout(() => {
      console.log("[PWA First Login] Showing modal after delay");
      setShowModal(true);
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(timer);
    };
  }, [user]);

  const handleInstall = async () => {
    console.log("[PWA First Login] Install button clicked");
    console.log("[PWA First Login] deferredPrompt available:", !!deferredPrompt);
    
    if (deferredPrompt) {
      console.log("[PWA First Login] Triggering native install prompt");
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[PWA First Login] User choice:", outcome);

        if (outcome === "accepted") {
          handleClose();
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error("[PWA First Login] Error during install:", error);
        setShowManualInstructions(true);
      }
    } else {
      console.log("[PWA First Login] No native prompt available, showing manual instructions");
      setShowManualInstructions(true);
    }
  };

  const handleClose = () => {
    console.log("[PWA First Login] Modal closed");
    setShowModal(false);
    if (user) {
      localStorage.setItem(`pwa-install-seen-${user.id}`, "true");
    }
  };

  const renderManualInstructions = () => {
    switch (platform) {
      case "ios":
        return (
          <div className="space-y-4 text-sm">
            <p className="font-semibold text-primary">Instalar en iPhone/iPad:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <Share className="h-4 w-4 text-primary" />
                </div>
                <span>1. Toca el botón <strong>Compartir</strong> en Safari (parte inferior)</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <span>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <span>3. Toca <strong>"Añadir"</strong> para confirmar</span>
              </div>
            </div>
          </div>
        );
      case "android":
        return (
          <div className="space-y-4 text-sm">
            <p className="font-semibold text-primary">Instalar en Android:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <MoreVertical className="h-4 w-4 text-primary" />
                </div>
                <span>1. Toca el menú <strong>⋮</strong> en Chrome (esquina superior)</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <span>2. Selecciona <strong>"Instalar app"</strong> o <strong>"Añadir a pantalla"</strong></span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <span>3. Confirma tocando <strong>"Instalar"</strong></span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4 text-sm">
            <p className="font-semibold text-primary">Instalar en tu computadora:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <Monitor className="h-4 w-4 text-primary" />
                </div>
                <span>1. Busca el ícono <strong>⊕</strong> en la barra de direcciones del navegador</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <span>2. Haz clic en <strong>"Instalar"</strong></span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-beige/50">
                <div className="bg-primary/10 rounded-full p-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <span>3. La app aparecerá como aplicación independiente</span>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!showModal || isStandalone) {
    return null;
  }

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-display">
            💜 Guarda esta calculadora como app
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Accede más rápido desde tu pantalla de inicio y disfruta de una experiencia como app nativa.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {showManualInstructions ? (
            renderManualInstructions()
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-rose-light/30">
                  <div className="text-2xl mb-1">📱</div>
                  <p className="text-xs text-muted-foreground">Acceso rápido</p>
                </div>
                <div className="p-3 rounded-xl bg-lavender-light/30">
                  <div className="text-2xl mb-1">☁️</div>
                  <p className="text-xs text-muted-foreground">Sincronizado</p>
                </div>
                <div className="p-3 rounded-xl bg-beige/50">
                  <div className="text-2xl mb-1">✨</div>
                  <p className="text-xs text-muted-foreground">Sin anuncios</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!showManualInstructions && (
            <Button
              onClick={handleInstall}
              className="w-full"
              variant="gradient"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              {deferredPrompt ? "Instalar ahora" : "Cómo instalar"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full"
          >
            {showManualInstructions ? "Entendido" : "Quizás después"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstLoginInstallPrompt;
