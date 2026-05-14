import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CountryProvider } from "@/contexts/CountryContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DemoBadge from "@/components/DemoBadge";
import Landing from "@/pages/Landing";
import Solutions from "@/pages/Solutions";
import Help from "@/pages/Help";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Track from "@/pages/Track";
import Shipments from "@/pages/Shipments";
import ShipmentDetail from "@/pages/ShipmentDetail";
import ShipNow from "@/pages/ShipNow";
import Quote from "@/pages/Quote";
import Addresses from "@/pages/Addresses";
import Pickup from "@/pages/Pickup";
import Pickups from "@/pages/Pickups";
import Invoices from "@/pages/Invoices";
import Reports from "@/pages/Reports";
import Customs from "@/pages/Customs";
import Settings from "@/pages/Settings";
import DashboardComingSoon from "@/pages/DashboardComingSoon";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <CountryProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/help" element={<Help />} />
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
            <Route path="track" element={<Navigate to="/track" replace />} />
            <Route path="ship" element={<ShipNow />} />
            <Route path="quote" element={<Quote />} />
            <Route path="pickup" element={<Pickup />} />
            <Route path="pickups" element={<Pickups />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="shipments/:awb" element={<ShipmentDetail />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="reports" element={<Reports />} />
            <Route path="customs" element={<Customs />} />
            <Route path="orders" element={<DashboardComingSoon />} />
            <Route path="collaboration" element={<DashboardComingSoon />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <DemoBadge />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
      </CountryProvider>
    </AuthProvider>
  );
}

export default App;
