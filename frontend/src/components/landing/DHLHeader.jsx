import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown, X, Menu, LifeBuoy } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import PngFlagSvg from "./PngFlagSvg";

const NAV = [
  { label: "Home", href: "/", kind: "route" },
  { label: "Ship", href: "/dashboard/ship", kind: "auth-route", anchor: "#mydhl" },
  { label: "Track", href: "/track", kind: "route" },
];

const DHLHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const searchRef = useRef(null);
  const langRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click-outside for popovers
  useEffect(() => {
    const onClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header
      data-testid="dhl-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      {/* Utility bar */}
      <div
        data-testid="utility-bar"
        className={`bg-dhl-yellow transition-all duration-300 overflow-hidden ${
          scrolled ? "h-0 opacity-0" : "h-10 opacity-100"
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-10 px-4 lg:px-8 flex items-center justify-end gap-6 text-[13px] text-dhl-ink">
          <a
            href="#contact"
            data-testid="util-help"
            className="hidden md:inline-flex items-center gap-1.5 hover:underline underline-offset-4 decoration-2 transition-all"
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Help and Support
          </a>
          <a
            href="#info-cards"
            data-testid="util-location"
            className="hidden md:inline-flex items-center gap-1.5 hover:underline underline-offset-4 decoration-2 transition-all"
          >
            <MapPin className="w-3.5 h-3.5" /> Find a Location
          </a>
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              data-testid="util-search-toggle"
              aria-label="Search"
              className="p-1 hover:bg-dhl-ink/10 rounded-sm transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-9 w-72 bg-white border border-dhl-border shadow-lg p-2 z-50">
                <input
                  autoFocus
                  type="text"
                  data-testid="util-search-input"
                  placeholder="Search dhl.com — try 'rates' or 'customs'"
                  className="w-full px-3 py-2 text-sm border border-dhl-border focus:outline-none focus:border-dhl-yellow focus:ring-1 focus:ring-dhl-yellow rounded-sm"
                />
              </div>
            )}
          </div>
          <span className="hidden md:inline w-px h-4 bg-dhl-ink/30" />
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              data-testid="util-lang-toggle"
              className="inline-flex items-center gap-2 hover:bg-dhl-ink/10 px-2 py-1 rounded-sm transition-colors"
            >
              <PngFlagSvg className="w-5 h-3.5" />
              <span className="font-medium">English</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {langOpen && (
              <div
                data-testid="util-lang-menu"
                className="absolute right-0 top-9 w-44 bg-white border border-dhl-border shadow-lg py-1 z-50"
              >
                {["English", "Tok Pisin", "Bahasa"].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLangOpen(false)}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-dhl-yellow/30 text-dhl-ink"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* White hairline */}
      <div className={`h-0.5 bg-white transition-all duration-300 ${scrolled ? "opacity-0" : "opacity-100"}`} />

      {/* Main bar */}
      <div className={`bg-dhl-yellow transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}>
        <div className="max-w-[1400px] mx-auto h-full px-4 lg:px-8 flex items-center justify-between gap-4">
          <Logo variant={scrolled ? "compact" : "default"} theme="light" onYellowBg />

          <nav data-testid="main-nav" className="hidden lg:flex items-center gap-1 ml-auto">
            {NAV.map((item) => {
              const cls =
                "relative px-4 py-2 text-[15px] font-semibold text-dhl-ink hover:text-dhl-red transition-colors group";
              const underline = (
                <span className="absolute left-4 right-4 -bottom-0.5 h-0.5 bg-dhl-red scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
              );
              if (item.kind === "route") {
                return (
                  <Link key={item.label} to={item.href} data-testid={`nav-${item.label.toLowerCase()}`} className={cls}>
                    {item.label}
                    {underline}
                  </Link>
                );
              }
              // auth-route — goes to dashboard if logged in, otherwise anchor scrolls
              return (
                <a
                  key={item.label}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  href={isAuthenticated ? item.href : item.anchor}
                  onClick={(e) => {
                    if (isAuthenticated) {
                      e.preventDefault();
                      navigate(item.href);
                    }
                  }}
                  className={cls}
                >
                  {item.label}
                  {underline}
                </a>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2 ml-2 pl-4 border-l border-dhl-ink/20">
            {isAuthenticated ? (
              <button
                type="button"
                data-testid="header-dashboard-btn"
                onClick={() => navigate("/dashboard")}
                className="h-10 px-5 bg-dhl-ink text-dhl-yellow font-bold text-sm rounded-sm hover:bg-black transition-all hover:-translate-y-0.5"
              >
                My Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  data-testid="header-login-btn"
                  onClick={() => navigate("/login")}
                  className="h-10 px-5 border-2 border-dhl-ink text-dhl-ink font-bold text-sm rounded-sm hover:bg-dhl-ink hover:text-white transition-colors"
                >
                  Login
                </button>
                <button
                  type="button"
                  data-testid="header-register-btn"
                  onClick={() => navigate("/register")}
                  className="h-10 px-5 bg-dhl-red text-white font-bold text-sm rounded-sm hover:bg-dhl-red-dark transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            type="button"
            data-testid="header-mobile-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="lg:hidden p-2 text-dhl-ink"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          data-testid="mobile-drawer"
          className="lg:hidden bg-white border-t border-dhl-border shadow-lg"
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.kind === "auth-route" && !isAuthenticated ? "/login" : item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 font-semibold text-dhl-text hover:bg-dhl-yellow/30 rounded-sm"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-dhl-border my-2" />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 bg-dhl-ink text-dhl-yellow font-bold text-center rounded-sm"
              >
                My Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 border-2 border-dhl-ink font-bold text-center rounded-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 bg-dhl-red text-white font-bold text-center rounded-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default DHLHeader;
