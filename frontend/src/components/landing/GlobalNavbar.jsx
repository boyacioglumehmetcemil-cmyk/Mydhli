import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Plane, Search, Calculator, Briefcase, LifeBuoy } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Ship", icon: Plane, kind: "anchor", href: "#services" },
  { label: "Track", icon: Search, kind: "route", href: "/track" },
  { label: "Get Rate", icon: Calculator, kind: "anchor", href: "#cta" },
  { label: "Solutions", icon: Briefcase, kind: "anchor", href: "#why" },
  { label: "Support", icon: LifeBuoy, kind: "anchor", href: "#contact" },
];

const GlobalNavbar = ({ variant = "transparent" }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = variant === "transparent" && !scrolled;

  return (
    <header
      data-testid="global-navbar"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md border-b border-dhl-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) => {
              const className = `relative px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors group ${
                isDark ? "text-white hover:text-dhl-yellow" : "text-dhl-text hover:text-dhl-red"
              }`;
              const inner = (
                <>
                  {l.label}
                  <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-dhl-yellow scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
                </>
              );
              return l.kind === "route" ? (
                <Link key={l.label} to={l.href} data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`} className={className}>
                  {inner}
                </Link>
              ) : (
                <a key={l.label} href={l.href} data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`} className={className}>
                  {inner}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {isAuthenticated ? (
            <Button
              data-testid="nav-dashboard-btn"
              onClick={() => navigate("/dashboard")}
              className="h-10 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-sm font-bold px-5 border-2 border-dhl-ink"
            >
              My Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                data-testid="nav-signin-btn"
                onClick={() => navigate("/login")}
                className={`h-10 font-semibold rounded-sm ${
                  isDark ? "text-white hover:bg-white/10 hover:text-white" : "text-dhl-text hover:bg-transparent hover:text-dhl-red"
                }`}
              >
                Sign In
              </Button>
              <Button
                data-testid="nav-openaccount-btn"
                onClick={() => navigate("/register")}
                className="h-10 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-sm font-bold px-5 border-2 border-dhl-ink hover:-translate-y-0.5 transition-transform"
              >
                Open Account
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          data-testid="nav-mobile-toggle"
          className={`lg:hidden p-2 ${isDark ? "text-white" : "text-dhl-text"}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-dhl-border">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((l) => {
              const className = "block py-2 text-sm font-semibold text-dhl-text uppercase tracking-wider";
              return l.kind === "route" ? (
                <Link
                  key={l.label}
                  to={l.href}
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  {l.label}
                </a>
              );
            })}
            <div className="pt-3 border-t border-dhl-border space-y-2">
              {isAuthenticated ? (
                <Button onClick={() => navigate("/dashboard")} className="w-full bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-sm font-bold">
                  My Dashboard
                </Button>
              ) : (
                <>
                  <Link to="/login" className="block w-full text-center py-2 text-sm font-semibold text-dhl-text">
                    Sign In
                  </Link>
                  <Link to="/register" className="block w-full text-center py-2.5 bg-dhl-yellow text-dhl-ink font-bold text-sm rounded-sm border-2 border-dhl-ink">
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

export default GlobalNavbar;
