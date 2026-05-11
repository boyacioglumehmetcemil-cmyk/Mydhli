import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DemoBadge from "@/components/DemoBadge";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Track from "@/pages/Track";
import Shipments from "@/pages/Shipments";
import ShipmentDetail from "@/pages/ShipmentDetail";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import DashboardComingSoon from "@/pages/DashboardComingSoon";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:awb" element={<Track />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="track" element={<DashboardComingSoon title="Track Shipment" />} />
            <Route path="ship" element={<DashboardComingSoon title="Ship Now" />} />
            <Route path="quote" element={<DashboardComingSoon title="Get a Quote" />} />
            <Route path="pickup" element={<DashboardComingSoon title="Schedule Pickup" />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="shipments/:awb" element={<ShipmentDetail />} />
            <Route path="addresses" element={<DashboardComingSoon title="Address Book" />} />
            <Route path="invoices" element={<DashboardComingSoon title="Invoices" />} />
            <Route path="reports" element={<DashboardComingSoon title="Reports" />} />
            <Route path="customs" element={<DashboardComingSoon title="Customs Documents" />} />
            <Route path="settings" element={<DashboardComingSoon title="Settings" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DemoBadge />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
