import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  // Strip any embedded backslash (browsers can normalize `\\` to `//`).
  if (decoded.includes("\\")) return null;
  if (!SAFE_NEXT.test(decoded)) return null;
  return decoded;
};

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

  // Two redirect sources, in priority order:
  //   1) ?next= query param (set by ProtectedRoute on un-auth redirects;
  //      this is the one that survives full reloads / shared links)
  //   2) location.state.from.pathname (legacy fallback)
  const safeNext = resolveNext(searchParams.get("next"));
  const stateFrom = location.state?.from?.pathname;
  const stateFromSafe = stateFrom && SAFE_NEXT.test(stateFrom) ? stateFrom : null;
  const redirectTo = safeNext || stateFromSafe || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.firstName}`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Sign-in failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — form */}
      <div className="flex-1 flex flex-col px-6 sm:px-10 py-10">
        <div className="mb-12">
          <Link to="/" data-testid="login-back-home" className="inline-flex">
            <Logo size="md" to={null} />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-red mb-3">
              MyDHL Global Forwarding
            </div>
            <h1 className="font-display text-4xl font-black text-dhl-text leading-tight mb-2">
              Welcome back.
            </h1>
            <p className="text-sm text-dhl-muted mb-8">
              Sign in to ship, track and manage your PNG account.
            </p>

            <form onSubmit={handleSubmit} data-testid="login-form" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-dhl-text">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com.pg"
                  data-testid="login-email-input"
                  className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-dhl-text">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    data-testid="login-password-input"
                    className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    data-testid="login-toggle-password"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dhl-muted hover:text-dhl-text"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(!!v)}
                    data-testid="login-remember-checkbox"
                    className="border-dhl-border data-[state=checked]:bg-dhl-yellow data-[state=checked]:text-dhl-ink data-[state=checked]:border-dhl-yellow rounded-none"
                  />
                  <span className="text-sm text-dhl-text font-medium">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  data-testid="login-forgot-link"
                  className="text-sm font-semibold text-dhl-red hover:underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                data-testid="login-submit-button"
                className="w-full h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold rounded-none uppercase tracking-wider text-sm border-2 border-dhl-ink hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-dhl-border text-center">
              <p className="text-sm text-dhl-muted">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  data-testid="login-register-link"
                  className="font-bold text-dhl-text hover:text-dhl-red"
                >
                  Open Account →
                </Link>
              </p>
            </div>

            <div className="mt-6 p-3 bg-dhl-panel border-l-2 border-dhl-yellow">
              <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted mb-1">
                Demo Credentials
              </div>
              <div className="text-xs font-mono text-dhl-text">
                demo@dhlpng.com / Demo@2026
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — branded panel */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden">
        <img src="/images/hero-world-routes.jpg" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-dhl-ink/80" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-dhl-yellow/80">
            MyDHL · Global Logistics
          </div>

          <div>
            <div className="font-display text-6xl xl:text-7xl font-black leading-none tracking-tighter">
              Move.
              <br />
              Track.
              <br />
              <span className="text-dhl-yellow">Deliver.</span>
            </div>
            <div className="mt-8 max-w-sm text-sm text-white/75 leading-relaxed">
              Freight forwarding worldwide. Real-time visibility, customs-cleared shipments,
              and dependable next-day delivery options.
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-white/40">
            <span className="w-8 h-px bg-white/30" />
            DEMO BUILD — TYPOGRAPHIC LOGO PLACEHOLDER
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
