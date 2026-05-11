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

const LANGS = ["English"];
const COUNTRIES = ["Papua New Guinea", "Australia", "Fiji", "Singapore", "United States"];

const LS_LANG_KEY = "dhl_ui_lang";
const LS_COUNTRY_KEY = "dhl_ui_country";

const Divider = () => (
  <span aria-hidden="true" className="inline-block w-px h-4 bg-dhl-ink/30 mx-3" />
);

const DHLHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem(LS_LANG_KEY) || LANGS[0]);
  const [country, setCountry] = useState(() => localStorage.getItem(LS_COUNTRY_KEY) || COUNTRIES[0]);
  const searchRef = useRef(null);
  const countryRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click-outside for popovers
  useEffect(() => {
    const onClick = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pickLang = (l) => {
    setLang(l);
    localStorage.setItem(LS_LANG_KEY, l);
  };
  const pickCountry = (c) => {
    setCountry(c);
    localStorage.setItem(LS_COUNTRY_KEY, c);
    setCountryOpen(false);
  };

  return (
    <header
      data-testid="dhl-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      {/* Utility bar — now the TALLER of the two (84px). Carries the logo. */}
      <div
        data-testid="utility-bar"
        className={`bg-dhl-yellow transition-all duration-300 overflow-hidden ${
          scrolled ? "h-0 opacity-0" : "h-[84px] opacity-100"
        }`}
      >
        <div className="max-w-[1200px] mx-auto h-[84px] px-6 lg:px-8 flex items-center justify-between text-[13px] text-dhl-ink">
          {/* Logo on the LEFT side of the utility bar */}
          <Logo variant="icon-only" theme="light" />

          <div className="flex items-center">
          <a
            href="#contact"
            data-testid="util-help"
            className="hidden md:inline-flex items-center gap-1.5 hover:underline underline-offset-4 decoration-2 transition-all"
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Help and Support
          </a>
          <span className="hidden md:inline-block w-1" />
          <a
            href="#info-cards"
            data-testid="util-location"
            className="hidden md:inline-flex items-center gap-1.5 ml-4 hover:underline underline-offset-4 decoration-2 transition-all"
          >
            <MapPin className="w-3.5 h-3.5" /> Find a Location
          </a>
          <span className="hidden md:inline"><Divider /></span>
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              data-testid="util-search-toggle"
              aria-label="Search"
              className="p-1 hover:bg-dhl-ink/10 rounded-sm transition-colors inline-flex"
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
          <Divider />
          {/* Two languages side-by-side with thin vertical divider */}
          <div data-testid="util-lang-row" className="inline-flex items-center">
            {LANGS.map((l, i) => {
              const active = l === lang;
              return (
                <span key={l} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => pickLang(l)}
                    data-testid={`util-lang-${l.toLowerCase().replace(/\s+/g, "-")}`}
                    aria-pressed={active}
                    className={`px-1.5 py-0.5 rounded-sm transition-all ${
                      active
                        ? "text-dhl-ink font-bold"
                        : "text-dhl-ink/55 font-normal hover:text-dhl-ink/85"
                    }`}
                  >
                    {l}
                  </button>
                  {i < LANGS.length - 1 && (
                    <span aria-hidden="true" className="inline-block w-px h-3.5 bg-dhl-ink/25 mx-1.5" />
                  )}
                </span>
              );
            })}
          </div>
          <span className="inline-block w-2" />
          {/* Country selector with chevron + PNG flag */}
          <div ref={countryRef} className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen((v) => !v)}
              data-testid="util-country-toggle"
              aria-label={`Country: ${country}`}
              className="inline-flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-dhl-ink/10 rounded-sm transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${countryOpen ? "rotate-180" : ""}`}
              />
              <PngFlagSvg className="w-6 h-4" title={country} />
            </button>
            {countryOpen && (
              <div
                data-testid="util-country-menu"
                className="absolute right-0 top-9 w-52 bg-white border border-dhl-border shadow-lg py-1 z-50"
              >
                {COUNTRIES.map((c) => {
                  const active = c === country;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCountry(c)}
                      data-testid={`util-country-${c.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-dhl-yellow/30 text-dhl-ink inline-flex items-center justify-between ${
                        active ? "bg-dhl-yellow/20 font-bold" : ""
                      }`}
                    >
                      <span>{c}</span>
                      {active && <span className="text-dhl-red">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* White hairline */}
      <div className={`h-0.5 bg-white transition-all duration-300 ${scrolled ? "opacity-0" : "opacity-100"}`} />

      {/* Main bar — now the SLIM one (40px). Nav (LEFT) + Login/Register (RIGHT). Logo appears here only when scrolled (carried forward from collapsed utility bar). */}
      <div className={`bg-dhl-yellow transition-all duration-300 ${scrolled ? "h-12" : "h-10"}`}>
        <div className="max-w-[1200px] mx-auto h-full px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo (only when scrolled — carried forward from collapsed utility bar) */}
          {scrolled && (
            <Logo variant="compact" theme="light" className="mr-4" />
          )}

          <nav data-testid="main-nav" className={`hidden lg:flex items-center gap-1 ${scrolled ? "" : "mr-auto"}`}>
            {NAV.map((item) => {
              const cls =
                "relative px-3 py-1 text-[13px] font-semibold text-dhl-ink hover:text-dhl-red transition-colors group";
              const underline = (
                <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-dhl-red scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
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

          <div className="hidden lg:flex items-center gap-4 ml-2 pl-3 border-l border-dhl-ink/20">
            {isAuthenticated ? (
              <button
                type="button"
                data-testid="header-dashboard-btn"
                onClick={() => navigate("/dashboard")}
                className="text-[13px] font-bold text-dhl-ink hover:underline underline-offset-4 decoration-2 decoration-dhl-red transition-all px-2 py-1"
              >
                My Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  data-testid="header-login-btn"
                  onClick={() => navigate("/login")}
                  className="text-[13px] font-medium text-dhl-ink hover:underline underline-offset-4 decoration-2 decoration-dhl-red transition-all px-2 py-1"
                >
                  Login
                </button>
                <button
                  type="button"
                  data-testid="header-register-btn"
                  onClick={() => navigate("/register")}
                  className="text-[13px] font-bold text-dhl-ink hover:underline underline-offset-4 decoration-2 decoration-dhl-red transition-all px-2 py-1"
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
                className="px-3 py-3 text-center font-bold text-dhl-ink hover:underline underline-offset-4 decoration-2 decoration-dhl-red"
              >
                My Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 text-center font-medium text-dhl-ink hover:underline underline-offset-4 decoration-2 decoration-dhl-red"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 text-center font-bold text-dhl-ink hover:underline underline-offset-4 decoration-2 decoration-dhl-red"
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
