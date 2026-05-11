import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const LandingNavbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: "Track", href: "/track", route: true },
    { label: "Ship", href: "#ship" },
    { label: "Rates", href: "#rates" },
    { label: "Help", href: "#help" },
  ];

  return (
    <header
      data-testid="landing-navbar"
      className="sticky top-0 z-50 bg-white border-b border-dhl-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((l) =>
              l.route ? (
                <Link
                  key={l.label}
                  to={l.href}
                  data-testid={`navlink-${l.label.toLowerCase()}`}
                  className="text-sm font-semibold text-dhl-text hover:text-dhl-red transition-colors uppercase tracking-wider"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  data-testid={`navlink-${l.label.toLowerCase()}`}
                  className="text-sm font-semibold text-dhl-text hover:text-dhl-red transition-colors uppercase tracking-wider"
                >
                  {l.label}
                </a>
              ),
            )}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              data-testid="navbar-dashboard-btn"
              className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-sm font-bold px-5 h-10"
              onClick={() => navigate("/dashboard")}
            >
              My Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                data-testid="navbar-signin-btn"
                className="text-dhl-text font-semibold hover:bg-transparent hover:text-dhl-red rounded-sm h-10"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                data-testid="navbar-openaccount-btn"
                className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-sm font-bold px-5 h-10 border-2 border-dhl-ink hover:-translate-y-0.5 transition-transform"
                onClick={() => navigate("/register")}
              >
                Open Account
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          data-testid="navbar-mobile-toggle"
          className="lg:hidden p-2 -mr-2 text-dhl-text"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-dhl-border bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((l) =>
              l.route ? (
                <Link
                  key={l.label}
                  to={l.href}
                  data-testid={`mobile-navlink-${l.label.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm font-semibold text-dhl-text uppercase tracking-wider"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  data-testid={`mobile-navlink-${l.label.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm font-semibold text-dhl-text uppercase tracking-wider"
                >
                  {l.label}
                </a>
              ),
            )}
            <div className="pt-3 border-t border-dhl-border space-y-2">
              {isAuthenticated ? (
                <Button
                  data-testid="mobile-dashboard-btn"
                  className="w-full bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-sm font-bold"
                  onClick={() => navigate("/dashboard")}
                >
                  My Dashboard
                </Button>
              ) : (
                <>
                  <Link
                    to="/login"
                    data-testid="mobile-signin-btn"
                    className="block w-full text-center py-2 text-sm font-semibold text-dhl-text"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    data-testid="mobile-openaccount-btn"
                    className="block w-full text-center py-2.5 bg-dhl-yellow text-dhl-ink font-bold text-sm rounded-sm border-2 border-dhl-ink"
                  >
                    Open Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
