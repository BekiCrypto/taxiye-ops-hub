
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Simple auth check - in real app, this would check Supabase session
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('admin_token');
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
          {/* Placeholder routes for future pages */}
          <Route path="/call-center" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Call Center - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Drivers Management - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="/passengers" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Passengers Management - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Trip Monitoring - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Wallet & Transactions - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Notifications - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Support Tickets - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Settings - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="/admin-roles" element={<ProtectedRoute><div className="p-8 text-center"><h1 className="text-2xl">Admin Roles - Coming Soon</h1></div></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
