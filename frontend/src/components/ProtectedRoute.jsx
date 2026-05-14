import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        data-testid="auth-loading"
        className="min-h-screen flex items-center justify-center bg-dhl-panel"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-dhl-yellow border-t-transparent rounded-full animate-spin" />
          <p className="text-dhl-muted text-sm font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Capture intended destination (pathname + search + hash) as a single
    // ?next= query param so the login page can round-trip it. We URL-encode
    // it so the inner '?' and '=' don't conflict with the outer query string.
    const intended = `${location.pathname}${location.search}${location.hash}`;
    const target =
      intended && intended !== "/"
        ? `/login?next=${encodeURIComponent(intended)}`
        : "/login";
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;
