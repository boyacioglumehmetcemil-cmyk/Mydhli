import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  Eye,
  EyeOff,
  FileText,
  Lock,
  MapPin,
  Package,
} from "lucide-react";
import BrandWordmark from "@/components/BrandWordmark";
import CountryPicker from "@/components/CountryPicker";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Safely resolve a post-login redirect target.
 *
 * Accepts only same-origin RELATIVE paths starting with a single forward
 * slash. Anything that looks like a protocol-relative URL (`//evil.com`),
 * an absolute URL (`http://evil.com`), or a non-path (`javascript:...`) is
 * rejected to prevent open-redirect abuse.
 */
const SAFE_NEXT = /^\/(?!\/)/;
const resolveNext = (raw) => {
  if (!raw) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (decoded.includes("\\")) return null;
  if (!SAFE_NEXT.test(decoded)) return null;
  return decoded;
};

// Quick syntactic email check kept for the inline error string. Form
// validation itself happens server-side.

/**
 * Map a sanitised post-login `next` path to a friendly contextual banner.
 * Only `/dashboard/*` paths surface to the visitor; anything else returns
 * null so we never leak unexpected redirect targets via the UI.
 */
const buildNextBanner = (safeNext) => {
  if (!safeNext) return null;
  if (safeNext === "/dashboard") return null;
  if (!safeNext.startsWith("/dashboard/")) return null;
  if (safeNext.startsWith("/dashboard/quote")) {
    return { Icon: Calculator, message: "Sign in to continue to your freight quote." };
  }
  if (safeNext.startsWith("/dashboard/ship")) {
    return { Icon: Package, message: "Sign in to continue your booking." };
  }
  if (safeNext.startsWith("/dashboard/track")) {
    return { Icon: MapPin, message: "Sign in to view detailed tracking." };
  }
  if (safeNext.startsWith("/dashboard/invoices")) {
    return { Icon: FileText, message: "Sign in to view your invoices." };
  }
  return { Icon: Lock, message: "Sign in to continue." };
};

const CONTACT_URL = "https://www.dhl.com/global-en/home/footer/contact-us.html";
const LEGAL_LINKS = [
  { label: "Privacy Notice", href: "https://www.dhl.com/global-en/home/footer/privacy-notice.html" },
  { label: "Terms of Use",   href: "https://www.dhl.com/global-en/home/footer/terms-of-use.html" },
  { label: "Legal Notice",   href: "https://www.dhl.com/global-en/home/footer/legal-notice.html" },
  { label: "Contact us",     href: CONTACT_URL },
];

/* ─────────────── Floating-label input ─────────────── */
// Small inline component so email + password share identical chrome without
// us spinning up a new file in /components. Renders a thin outlined input
// with the label sitting at the top-left when focused or filled.
const FloatingInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  testId,
  rightSlot,
}) => {
  const hasValue = (value || "").length > 0;
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        data-testid={testId}
        placeholder=" "
        required
        className={
          // The `peer` class enables placeholder-based label animation below.
          "peer h-14 w-full bg-white border border-stone-400 rounded-sm px-3 pt-5 pb-1 " +
          "text-base text-dhl-ink outline-none focus:border-dhl-ink transition-colors " +
          (rightSlot ? "pr-12 " : "")
        }
      />
      <label
        htmlFor={id}
        className={
          "absolute left-3 pointer-events-none transition-all duration-150 ease-out " +
          "text-stone-500 " +
          (hasValue
            ? "top-1.5 text-xs"
            : "top-1/2 -translate-y-1/2 text-base peer-focus:top-1.5 peer-focus:-translate-y-0 peer-focus:text-xs")
        }
      >
        {label}
      </label>
      {rightSlot && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const sessionExpired = searchParams.get("expired") === "1";

  // Two redirect sources, in priority order:
  //   1) ?next= query param (set by ProtectedRoute on un-auth redirects;
  //      this survives full reloads / shared links)
  //   2) location.state.from.pathname (legacy fallback)
  const safeNext = resolveNext(searchParams.get("next"));
  const stateFrom = location.state?.from?.pathname;
  const stateFromSafe = stateFrom && SAFE_NEXT.test(stateFrom) ? stateFrom : null;
  const redirectTo = safeNext || stateFromSafe || "/dashboard";
  const nextBanner = buildNextBanner(safeNext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const apiMsg = err?.response?.data?.detail;
      setErrorMsg(apiMsg || "Email or password is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100" data-testid="login-page">
      {/* ─────────────── 1) TOP UTILITY BAR ─────────────── */}
      <header className="bg-dhl-yellow h-16 px-6 lg:px-10 flex items-center justify-between shrink-0">
        <BrandWordmark to="/" placement="header" data-testid="login-header-logo" />
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="login-header-contact"
          className="text-sm font-bold text-dhl-red hover:text-dhl-red-dark inline-flex items-center gap-1"
        >
          Contact us <ArrowUpRight className="w-4 h-4" />
        </a>
      </header>

      {/* ─────────────── 2) HERO + CENTERED CARD ─────────────── */}
      {/* min-h calc keeps the photo filling the gap between utility bar and
          footer at any viewport. The sustainability photo reused here matches
          the reference (wind turbines / mountains). */}
      <section
        data-testid="login-hero"
        className="flex-1 bg-cover bg-center flex items-center justify-center px-4 py-10 min-h-[calc(100vh-64px-160px)]"
        style={{ backgroundImage: "url('/assets/dhl/sustainability-photo.png')" }}
      >
        <div
          className="w-full max-w-[480px] bg-white rounded-md shadow-2xl p-10 lg:p-12"
          data-testid="login-card"
        >
          {/* Conditional banners — stay above H1 inside the card. */}
          {sessionExpired && (
            <div
              className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-5 flex items-start gap-2"
              data-testid="session-expired-alert"
              role="status"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-amber-900">Session expired</span>
            </div>
          )}
          {nextBanner && (
            <div
              className="bg-dhl-yellow/20 border border-dhl-yellow/40 text-dhl-ink rounded-sm text-sm px-3 py-2.5 mb-5 flex items-center gap-2"
              data-testid="login-next-banner"
              role="status"
            >
              <nextBanner.Icon className="w-4 h-4 shrink-0" />
              <span>{nextBanner.message}</span>
            </div>
          )}

          <h1 className="font-display font-bold text-2xl lg:text-[28px] text-dhl-ink mb-8">
            Welcome to myDHLi
          </h1>

          {/* Inline auth-failure chip */}
          {errorMsg && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-sm mb-6"
              data-testid="login-error"
              role="alert"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="login-form" noValidate>
            <div className="mb-5">
              <FloatingInput
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                testId="login-email-input"
              />
            </div>

            <div className="mb-6">
              <FloatingInput
                id="password"
                label="Password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                testId="login-password-input"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    data-testid="login-toggle-password"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    className="w-10 h-10 inline-flex items-center justify-center text-stone-500 hover:text-dhl-ink rounded-sm transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </div>

            <Link
              to="/forgot-password"
              data-testid="login-forgot-link"
              className="text-sm text-dhl-ink underline underline-offset-4 hover:text-dhl-red mx-auto block text-center mb-10"
            >
              Forgot your password?
            </Link>

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="w-full h-14 bg-dhl-red text-white text-base font-bold rounded-sm hover:bg-dhl-red-dark transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </section>

      {/* ─────────────── 3) BOTTOM FOOTER ─────────────── */}
      <footer
        className="bg-stone-100 py-6 px-6 lg:px-10 shrink-0"
        data-testid="login-footer"
      >
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex flex-col gap-2">
            <BrandWordmark placement="footer" data-testid="login-footer-logo" />
            <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {LEGAL_LINKS.map((l, i) => (
                <span key={l.label} className="inline-flex items-center gap-2">
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`login-footer-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-stone-700 hover:text-dhl-red underline-offset-4 hover:underline"
                  >
                    {l.label}
                  </a>
                  {i < LEGAL_LINKS.length - 1 && (
                    <span className="text-stone-400" aria-hidden="true">·</span>
                  )}
                </span>
              ))}
            </nav>
            <p className="text-xs text-stone-500 mt-2">
              © 2026 DHL Global Forwarding — Demo build · Not affiliated with Deutsche Post DHL Group · myDHLi placeholder
            </p>
          </div>
          <div className="flex-shrink-0">
            <CountryPicker />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
