import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import BrandWordmark from "@/components/BrandWordmark";
import CountryPicker from "@/components/CountryPicker";
import api from "@/lib/api";

const CONTACT_URL = "https://www.dhl.com/global-en/home/footer/contact-us.html";
const LEGAL_LINKS = [
  { label: "Privacy Notice", href: "https://www.dhl.com/global-en/home/footer/privacy-notice.html" },
  { label: "Terms of Use",   href: "https://www.dhl.com/global-en/home/footer/terms-of-use.html" },
  { label: "Legal Notice",   href: "https://www.dhl.com/global-en/home/footer/legal-notice.html" },
  { label: "Contact us",     href: CONTACT_URL },
];

/* ─────────────── Floating-label input (matches Login chrome) ─────────────── */
const FloatingInput = ({ id, label, type = "text", value, onChange, autoComplete, testId }) => {
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
        className="peer h-14 w-full bg-white border border-stone-400 rounded-sm px-3 pt-5 pb-1 text-base text-dhl-ink outline-none focus:border-dhl-ink transition-colors"
      />
      <label
        htmlFor={id}
        className={
          "absolute left-3 pointer-events-none transition-all duration-150 ease-out text-stone-500 " +
          (hasValue
            ? "top-1.5 text-xs"
            : "top-1/2 -translate-y-1/2 text-base peer-focus:top-1.5 peer-focus:-translate-y-0 peer-focus:text-xs")
        }
      >
        {label}
      </label>
    </div>
  );
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setSent(true);
      toast.success("Reset link sent (if account exists)");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100" data-testid="forgot-page">
      {/* ─────────────── 1) TOP BAR — same as Login ─────────────── */}
      <header className="bg-white h-16 px-6 lg:px-10 flex items-center justify-between shrink-0 relative">
        <Link to="/" className="inline-flex shrink-0">
          <img
            src="/assets/dhl/brand/dhl-gf-lockup-v2.png"
            alt="DHL Global Forwarding"
            className="h-10 lg:h-12 w-auto"
            loading="eager"
            data-testid="forgot-utility-logo"
          />
        </Link>
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="forgot-header-contact"
          className="text-sm font-semibold text-dhl-ink hover:text-dhl-red inline-flex items-center gap-1"
        >
          Contact us <ArrowUpRight className="w-4 h-4" />
        </a>
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-dhl-yellow" aria-hidden="true" />
      </header>

      {/* ─────────────── 2) HERO + CENTERED CARD ─────────────── */}
      <section
        data-testid="forgot-hero"
        className="flex-1 bg-cover bg-center flex items-center justify-center px-4 py-10 min-h-[calc(100vh-64px-120px)]"
        style={{
          backgroundImage: "url('/assets/dhl/login-hero.png')",
          backgroundPosition: "center 60%",
        }}
      >
        <div
          className="w-full max-w-[420px] bg-white rounded-sm shadow-2xl p-8 lg:p-10"
          data-testid="forgot-card"
        >
          {!sent ? (
            <>
              <h1 className="font-display font-bold text-2xl text-dhl-ink mb-2">
                Reset your Password
              </h1>
              <p className="text-sm text-stone-600 mb-7">
                Please enter the email address that you used to sign up so we can send you a password reset link
              </p>

              <form onSubmit={handleSubmit} data-testid="forgot-form">
                <div className="mb-6">
                  <FloatingInput
                    id="forgot-email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    testId="forgot-email-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="forgot-submit-button"
                  className="w-full h-12 bg-dhl-red text-white text-base font-bold rounded-sm hover:bg-dhl-red-dark transition disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send link to reset password"}
                </button>

                <Link
                  to="/login"
                  data-testid="forgot-back-link"
                  className="block text-center text-sm text-dhl-ink hover:text-dhl-red mt-5"
                >
                  Back to Login
                </Link>
              </form>
            </>
          ) : (
            <div data-testid="forgot-success" className="text-center">
              <div className="w-14 h-14 bg-dhl-yellow/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <MailCheck className="w-7 h-7 text-dhl-red" strokeWidth={2} />
              </div>
              <h2 className="font-display font-bold text-2xl text-dhl-ink mb-2">
                Check your inbox.
              </h2>
              <p className="text-sm text-stone-600 mb-7">
                If an account exists for{" "}
                <span className="font-bold text-dhl-ink">{email}</span>, we've sent a reset link.
              </p>
              <Link
                to="/login"
                data-testid="forgot-return-link"
                className="inline-flex items-center justify-center w-full h-12 bg-dhl-red text-white text-base font-bold rounded-sm hover:bg-dhl-red-dark transition"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────── 3) BOTTOM FOOTER — same as Login ─────────────── */}
      <footer
        className="bg-stone-100 py-5 px-6 lg:px-10 shrink-0"
        data-testid="forgot-footer"
      >
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <BrandWordmark placement="footer" data-testid="forgot-footer-logo" />
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-2">
              {LEGAL_LINKS.map((l, i) => (
                <span key={l.label} className="inline-flex items-center gap-3">
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`forgot-footer-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
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

export default ForgotPassword;
