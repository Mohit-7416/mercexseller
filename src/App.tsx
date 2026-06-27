import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ShopProvider } from "./contexts/ShopContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Shops from "./pages/Shops";
import HowItWorks from "./pages/onboarding/HowItWorks";
import Terms from "./pages/onboarding/Terms";
import ProfileSetup from "./pages/onboarding/ProfileSetup";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import CreateListing from "./pages/dashboard/CreateListing";
import Orders from "./pages/dashboard/Orders";
import OrderChat from "./pages/dashboard/OrderChat";
import Items from "./pages/dashboard/Items";
import Analysis from "./pages/dashboard/Analysis";
import Settings from "./pages/dashboard/Settings";
import LiveBroadcast from "./pages/dashboard/LiveBroadcast";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ShopProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding/how-it-works" element={<HowItWorks />} />
                <Route path="/onboarding/terms" element={<Terms />} />
                <Route path="/onboarding/profile" element={<ProfileSetup />} />
                <Route path="/shops" element={
                  <ProtectedRoute>
                    <Shops />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute requireShop>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Overview />} />
                  <Route path="create" element={<CreateListing />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/chat" element={<OrderChat />} />
                  <Route path="items" element={<Items />} />
                  <Route path="analysis" element={<Analysis />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="/dashboard/live/:id" element={
                  <ProtectedRoute requireShop>
                    <LiveBroadcast />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ShopProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
