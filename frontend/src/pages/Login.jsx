import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

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
      navigate(from, { replace: true });
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
              MyDHL Express
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
      <div className="hidden lg:flex lg:w-[42%] bg-dhl-yellow relative overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 400"
        >
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#1A1A1A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-dhl-ink/70">
            MyDHL · v0.1 · PNG
          </div>

          <div>
            <div className="font-display text-7xl font-black text-dhl-ink leading-none tracking-tighter">
              Move.
              <br />
              Track.
              <br />
              <span className="text-dhl-red">Deliver.</span>
            </div>
            <div className="mt-8 max-w-sm text-sm text-dhl-ink/80 leading-relaxed">
              A new logistics control room built for the businesses keeping PNG moving — from Lae
              to Port Moresby, Mt. Hagen to Singapore.
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-dhl-ink/60">
            <span className="w-8 h-px bg-dhl-ink/40" />
            DEMO BUILD — TYPOGRAPHIC LOGO PLACEHOLDER
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
