import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Web3Provider } from "@/components/Web3Provider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Sellers from "./pages/Sellers";
import Payments from "./pages/Payments";
import Web3 from "./pages/Web3";
import Yield from "./pages/Yield";
import Bots from "./pages/Bots";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const App = () => (
  <Web3Provider>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/sellers" element={<ProtectedRoute><Sellers /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/web3" element={<ProtectedRoute><Web3 /></ProtectedRoute>} />
            <Route path="/yield" element={<ProtectedRoute><Yield /></ProtectedRoute>} />
            <Route path="/bots" element={<ProtectedRoute><Bots /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </Web3Provider>
);

export default App;
