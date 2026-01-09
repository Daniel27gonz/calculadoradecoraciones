import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker with update handling
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("[PWA] 🔄 New content available, refreshing...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] ✅ App ready to work offline!");
  },
  onRegistered(registration) {
    console.log("[PWA] 📦 Service Worker registered successfully:", registration);
  },
  onRegisterError(error) {
    console.error("[PWA] ⚠️ Service Worker registration failed:", error);
  },
});

console.log("[PWA] 🚀 App starting...");

createRoot(document.getElementById("root")!).render(<App />);
