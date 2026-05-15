import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Check, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Safely resolve a post-login redirect target.
 *
 * Accepts only same-origin RELATIVE paths starting with a single forward
 * slash. Anything that looks like a protocol-relative URL (`//evil.com`),
 * an absolute URL (`http://evil.com`, `https://...`), or a non-path
 * (`javascript:alert(1)`) is rejected to prevent open-redirect abuse.
 *
 * Whitelist regex: `^/(?!\/)` — must start with `/`, but the 2nd char
 * MUST NOT be another `/`.
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

// Quick syntactic email check — enough to flip the green tick. Real
// validation happens server-side.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  // Inline error chip (replaces noisy toast on failed sign-in).
  const [errorMsg, setErrorMsg] = useState("");

  // Show the amber session-expired alert when ProtectedRoute (or any other
  // caller) bounces the user here with `?expired=1`.
  const sessionExpired = searchParams.get("expired") === "1";

  const emailValid = useMemo(() => EMAIL_RE.test(email), [email]);

  // Two redirect sources, in priority order:
  //   1) ?next= query param (set by ProtectedRoute on un-auth redirects;
  //      this survives full reloads / shared links)
  //   2) location.state.from.pathname (legacy fallback)
  const safeNext = resolveNext(searchParams.get("next"));
  const stateFrom = location.state?.from?.pathname;
  const stateFromSafe = stateFrom && SAFE_NEXT.test(stateFrom) ? stateFrom : null;
  const redirectTo = safeNext || stateFromSafe || "/dashboard";

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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-10" data-testid="login-page">
      <div
        className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl p-8 lg:p-10"
        data-testid="login-card"
      >
        {/* Session-expired alert — only when ?expired=1. */}
        {sessionExpired && (
          <div
            className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-8 flex items-start gap-3"
            data-testid="session-expired-alert"
            role="status"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-base font-semibold text-amber-900">Session expired</span>
          </div>
        )}

        {/* Brand wordmark. <Logo /> defaults to placement="header" so it
            renders the official PNG via BrandWordmark — never the legacy
            CSS placeholder. */}
        <div className="mb-6">
          <Logo size="md" to="/" />
        </div>

        <h1 className="font-display font-bold text-4xl lg:text-5xl text-dhl-ink leading-tight mb-2">
          Sign in to myDHLi
        </h1>

        <p className="text-sm text-stone-600 mb-8">
          Don't have an account?{" "}
          <Link
            to="/register"
            data-testid="login-register-link"
            className="text-dhl-red font-bold underline underline-offset-4 hover:text-dhl-red-dark"
          >
            Create a login
          </Link>
        </p>

        {/* Inline error chip — appears above the email field on bad creds.
            Sits in the same vertical slot a noisy toast used to occupy. */}
        {errorMsg && (
          <div
            className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-md mb-6"
            data-testid="login-error"
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="login-form" noValidate>
          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5"
            >
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="w-full h-12 px-4 pr-11 rounded-md border border-stone-300 bg-stone-50 text-base focus:border-dhl-red focus:ring-2 focus:ring-dhl-red/20 outline-none transition"
                required
              />
              {emailValid && (
                <Check
                  data-testid="login-email-valid"
                  className="w-5 h-5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
              )}
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                className="w-full h-12 px-4 pr-12 rounded-md border border-stone-300 bg-stone-50 text-base focus:border-dhl-red focus:ring-2 focus:ring-dhl-red/20 outline-none transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                data-testid="login-toggle-password"
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition"
              >
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot row */}
          <div className="flex items-center justify-between mb-8">
            <label htmlFor="remember" className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(!!v)}
                data-testid="login-remember-checkbox"
                className="border-stone-400 data-[state=checked]:bg-dhl-red data-[state=checked]:text-white data-[state=checked]:border-dhl-red"
              />
              <span className="text-sm text-stone-700">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              data-testid="login-forgot-link"
              className="text-sm text-dhl-red font-bold underline underline-offset-4 hover:text-dhl-red-dark"
            >
              Forgot / reset password
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit-button"
            className="w-full h-14 bg-dhl-red text-white text-base font-bold rounded-md hover:bg-dhl-red-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-xs text-stone-500 text-center" data-testid="login-demo-footer">
          Demo build · Not affiliated with Deutsche Post DHL Group
        </p>
      </div>
    </div>
  );
};

export default Login;
