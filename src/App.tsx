import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuoteProvider } from "@/contexts/QuoteContext";
import { Navigation } from "@/components/layout/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PWAInstallPopup from "@/components/PWAInstallPopup";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import Calculator from "./pages/Calculator";
import Packages from "./pages/Packages";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <QuoteProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PWAInstallPopup />
            <Navigation />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
              <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/install" element={<Install />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QuoteProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
