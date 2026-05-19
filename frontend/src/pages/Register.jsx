import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import BrandWordmark from "@/components/BrandWordmark";
import CountryPicker from "@/components/CountryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";

const CONTACT_URL = "https://www.dhl.com/global-en/home/footer/contact-us.html";
const LEGAL_LINKS = [
  { label: "Privacy Notice", href: "https://www.dhl.com/global-en/home/footer/privacy-notice.html" },
  { label: "Terms of Use",   href: "https://www.dhl.com/global-en/home/footer/terms-of-use.html" },
  { label: "Legal Notice",   href: "https://www.dhl.com/global-en/home/footer/legal-notice.html" },
  { label: "Contact us",     href: CONTACT_URL },
];

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
    <div className="min-h-screen flex flex-col bg-stone-100" data-testid="register-page">
      {/* ─────────────── 1) TOP BAR — same as Login ─────────────── */}
      <header className="bg-white h-16 px-6 lg:px-10 flex items-center justify-between shrink-0 relative">
        <Link to="/" className="inline-flex shrink-0">
          <img
            src="/assets/dhl/brand/dhl-gf-lockup-v2.png"
            alt="DHL Global Forwarding"
            className="h-10 lg:h-12 w-auto"
            loading="eager"
            data-testid="register-utility-logo"
          />
        </Link>
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="register-header-contact"
          className="text-sm font-semibold text-dhl-ink hover:text-dhl-red inline-flex items-center gap-1"
        >
          Contact us <ArrowUpRight className="w-4 h-4" />
        </a>
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-dhl-yellow" aria-hidden="true" />
      </header>

      {/* ─────────────── 2) HERO + CENTERED CARD ─────────────── */}
      <section
        data-testid="register-hero"
        className="flex-1 bg-cover bg-center flex items-center justify-center px-4 py-10"
        style={{
          backgroundImage: "url('/assets/dhl/login-hero.png')",
          backgroundPosition: "center 60%",
        }}
      >
        <div className="w-full max-w-[640px] bg-white rounded-sm shadow-2xl p-8 lg:p-10" data-testid="register-card">
          <h1 className="font-display font-bold text-2xl text-dhl-ink mb-2">
            Create your myDHLi account
          </h1>
          <p className="text-sm text-stone-600 mb-7">
            Already have an account?{" "}
            <Link to="/login" data-testid="register-signin-link" className="text-dhl-red font-semibold hover:underline">
              Sign in here
            </Link>
          </p>

          <form onSubmit={handleSubmit} data-testid="register-form" className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
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

          <div className="sm:col-span-2 flex items-start gap-3 pt-2">
            <Checkbox
              id="agree"
              checked={agree}
              onCheckedChange={(v) => setAgree(!!v)}
              data-testid="register-tnc-checkbox"
              className="border-dhl-border data-[state=checked]:bg-dhl-red data-[state=checked]:text-white data-[state=checked]:border-dhl-red rounded-sm mt-0.5"
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
              .
            </Label>
          </div>

          <div className="sm:col-span-2 pt-3">
            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full h-12 bg-dhl-red text-white hover:bg-dhl-red-dark font-bold rounded-sm text-base disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Create my account <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </div>
          </form>
        </div>
      </section>

      {/* ─────────────── 3) BOTTOM FOOTER — same as Login ─────────────── */}
      <footer className="bg-stone-100 py-5 px-6 lg:px-10 shrink-0" data-testid="register-footer">
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <BrandWordmark placement="footer" data-testid="register-footer-logo" />
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-2">
              {LEGAL_LINKS.map((l, i) => (
                <span key={l.label} className="inline-flex items-center gap-3">
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-700 hover:text-dhl-red"
                  >
                    {l.label}
                  </a>
                  {i < LEGAL_LINKS.length - 1 && (
                    <span className="text-stone-300" aria-hidden="true">·</span>
                  )}
                </span>
              ))}
            </nav>
            <p className="text-[11px] text-stone-500 mt-2">
              © {new Date().getFullYear()} DHL Global Forwarding Management GmbH. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2 flex-shrink-0">
            <CountryPicker />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register;
