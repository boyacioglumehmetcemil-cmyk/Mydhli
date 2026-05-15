import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import CountryPicker from "@/components/CountryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";

const calcStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  const stages = [
    { label: "Too short", color: "bg-dhl-red" },
    { label: "Weak", color: "bg-dhl-red" },
    { label: "Fair", color: "bg-orange-400" },
    { label: "Good", color: "bg-dhl-yellow" },
    { label: "Strong", color: "bg-green-500" },
    { label: "Excellent", color: "bg-green-600" },
  ];
  return { score, ...stages[Math.min(score, stages.length - 1)] };
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  // Country selection lives in the global CountryContext so it stays in
  // sync with the utility-bar picker. The form ships `country.code` (ISO
  // alpha-2) on submit — matching the existing API contract that already
  // accepted `"PG"`.
  const { country } = useCountry();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    phone: "",
  });
  const [agree, setAgree] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => calcStrength(form.password), [form.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    // strip leading +675 since prefix is locked
    let v = e.target.value.replace(/[^\d ]/g, "");
    setForm((f) => ({ ...f, phone: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!agree) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        companyName: form.companyName.trim(),
        country: country.code,
        phone: `+675 ${form.phone.trim()}`,
      };
      const user = await register(payload);
      toast.success(`Account created — welcome, ${user.firstName}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg || "Registration failed"
          : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-dhl-border px-6 lg:px-10 h-16 flex items-center justify-between bg-white">
        <Logo size="md" />
        <div className="text-sm text-dhl-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            data-testid="register-signin-link"
            className="font-bold text-dhl-text hover:text-dhl-red ml-1"
          >
            Sign In →
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-10 lg:py-16 max-w-5xl w-full mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-red mb-3">
            Open Account
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-black text-dhl-text leading-tight tracking-tighter mb-3">
            Start shipping in two minutes.
          </h1>
          <p className="text-base text-dhl-muted max-w-2xl">
            Create your myDHLi account. Free, no card needed — see
            contract rates, schedule pickups and track everything in one place.
          </p>
        </div>

        <form onSubmit={handleSubmit} data-testid="register-form" className="grid lg:grid-cols-2 gap-x-6 gap-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">First Name</Label>
            <Input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              data-testid="register-firstname-input"
              className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none"
              placeholder="Jane"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">Last Name</Label>
            <Input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              data-testid="register-lastname-input"
              className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none"
              placeholder="Boroko"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">Work Email</Label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              data-testid="register-email-input"
              className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none"
              placeholder="jane@company.com.pg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">Password</Label>
            <div className="relative">
              <Input
                name="password"
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                data-testid="register-password-input"
                className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none pr-12"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                data-testid="register-toggle-password"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dhl-muted hover:text-dhl-text"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength meter */}
            {form.password && (
              <div className="space-y-1.5" data-testid="password-strength">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-sm ${
                        i < strength.score ? strength.color : "bg-dhl-border"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] font-medium text-dhl-muted">
                  Strength: <span className="font-bold text-dhl-text">{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">Confirm Password</Label>
            <Input
              name="confirmPassword"
              type={showPwd ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              required
              data-testid="register-confirm-password-input"
              className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none"
              placeholder="Re-enter password"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">Company Name</Label>
            <Input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
              data-testid="register-company-input"
              className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none"
              placeholder="Your business"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">Phone</Label>
            <div className="flex">
              <div className="h-12 px-3 flex items-center bg-dhl-ink text-white font-mono text-sm font-bold border-2 border-dhl-ink select-none">
                +675
              </div>
              <Input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handlePhoneChange}
                required
                data-testid="register-phone-input"
                className="h-12 bg-dhl-panel border-2 border-dhl-border border-l-0 focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none flex-1"
                placeholder="7000 0000"
              />
            </div>
          </div>

          <div className="space-y-2 lg:col-span-2" data-testid="register-country-row">
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">Country</Label>
            <CountryPicker variant="field" className="rounded-none" />
          </div>

          <div className="lg:col-span-2 flex items-start gap-3 pt-2">
            <Checkbox
              id="agree"
              checked={agree}
              onCheckedChange={(v) => setAgree(!!v)}
              data-testid="register-tnc-checkbox"
              className="border-dhl-border data-[state=checked]:bg-dhl-yellow data-[state=checked]:text-dhl-ink data-[state=checked]:border-dhl-yellow rounded-none mt-0.5"
            />
            <Label htmlFor="agree" className="text-sm text-dhl-text font-medium cursor-pointer leading-relaxed">
              I agree to the{" "}
              <a href="#" className="text-dhl-red font-bold hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-dhl-red font-bold hover:underline">
                Privacy Policy
              </a>
              . This is a demo build — credentials stored for demo purposes only.
            </Label>
          </div>

          <div className="lg:col-span-2 pt-3">
            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full sm:w-auto h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold rounded-none uppercase tracking-wider text-sm px-10 border-2 border-dhl-ink hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create My Account <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Register;
