import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuoteProvider } from "@/contexts/QuoteContext";
import { Navigation } from "@/components/layout/Navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import PWAInstallPopup from "@/components/PWAInstallPopup";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Calculator from "./pages/Calculator";
import Packages from "./pages/Packages";
import Finances from "./pages/Finances";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import Design from "./pages/Design";
import AdminDatabase from "./pages/AdminDatabase";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";
import InventoryConsumables from "./pages/InventoryConsumables";
import InventoryReusables from "./pages/InventoryReusables";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isAuth = location.pathname === '/auth';

  return (
    <div className="flex min-h-screen w-full">
      <Navigation />
      <main className={isAuth ? "flex-1" : isMobile ? "flex-1 pt-14" : "flex-1 ml-60"}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/finances" element={<Finances />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/install" element={<Install />} />
          <Route path="/design" element={<Design />} />
          <Route path="/admin/database" element={<AdminDatabase />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory/consumables" element={<InventoryConsumables />} />
          <Route path="/inventory/reusables" element={<InventoryReusables />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <QuoteProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PWAInstallPopup />
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </QuoteProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
