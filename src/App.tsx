import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import CallCenter from "./pages/CallCenter";
import CallCenterStandalone from "./pages/CallCenterStandalone";
import DriversManagement from "./pages/DriversManagement";
import PassengersManagement from "./pages/PassengersManagement";
import TripMonitoring from "./pages/TripMonitoring";
import WalletTransactions from "./pages/WalletTransactions";
import NotificationsManagement from "./pages/NotificationsManagement";
import SupportTickets from "./pages/SupportTickets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component that checks Supabase authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, adminProfile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user || !adminProfile) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/live-map" element={
        <ProtectedRoute>
          <LiveMap />
        </ProtectedRoute>
      } />
      <Route path="/call-center" element={
        <ProtectedRoute>
          <CallCenter />
        </ProtectedRoute>
      } />
      {/* Standalone Call Center Route */}
      <Route path="/support-agent" element={<CallCenterStandalone />} />
      
      {/* Implemented Core Modules */}
      <Route path="/drivers" element={
        <ProtectedRoute>
          <DriversManagement />
        </ProtectedRoute>
      } />
      <Route path="/passengers" element={
        <ProtectedRoute>
          <PassengersManagement />
        </ProtectedRoute>
      } />
      <Route path="/trips" element={
        <ProtectedRoute>
          <TripMonitoring />
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          <WalletTransactions />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <NotificationsManagement />
        </ProtectedRoute>
      } />
      <Route path="/support" element={
        <ProtectedRoute>
          <SupportTickets />
        </ProtectedRoute>
      } />
      
      {/* Placeholder routes for future pages */}
      <Route path="/settings" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Settings - Coming Soon</h1></div></ProtectedRoute>} />
      <Route path="/admin-roles" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Admin Roles - Coming Soon</h1></div></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
