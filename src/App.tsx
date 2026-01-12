import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import HowItWorks from "./pages/onboarding/HowItWorks";
import Terms from "./pages/onboarding/Terms";
import Signup from "./pages/onboarding/Signup";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import CreateListing from "./pages/dashboard/CreateListing";
import Orders from "./pages/dashboard/Orders";
import Items from "./pages/dashboard/Items";
import Analysis from "./pages/dashboard/Analysis";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding/how-it-works" element={<HowItWorks />} />
          <Route path="/onboarding/terms" element={<Terms />} />
          <Route path="/onboarding/signup" element={<Signup />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="create" element={<CreateListing />} />
            <Route path="orders" element={<Orders />} />
            <Route path="items" element={<Items />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
