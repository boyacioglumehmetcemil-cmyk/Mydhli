import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-dhl-border px-6 lg:px-10 h-16 flex items-center justify-between bg-white">
        <Logo size="md" />
        <Link
          to="/login"
          data-testid="forgot-back-to-login"
          className="inline-flex items-center gap-2 text-sm font-bold text-dhl-text hover:text-dhl-red"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!sent ? (
            <>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-red mb-3">
                Account recovery
              </div>
              <h1 className="font-display text-4xl font-black text-dhl-text leading-tight mb-3">
                Forgot your password?
              </h1>
              <p className="text-sm text-dhl-muted mb-8">
                Drop the email you registered with and we'll send you instructions to reset your
                MyDHL Global Forwarding password.
              </p>

              <form onSubmit={handleSubmit} data-testid="forgot-form" className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text">
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="forgot-email-input"
                    className="h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none"
                    placeholder="you@company.com.pg"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="forgot-submit-button"
                  className="w-full h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold rounded-none uppercase tracking-wider text-sm border-2 border-dhl-ink hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div data-testid="forgot-success" className="text-center py-6">
              <div className="w-16 h-16 bg-dhl-yellow/30 flex items-center justify-center mx-auto mb-6">
                <MailCheck className="w-8 h-8 text-dhl-red" strokeWidth={2} />
              </div>
              <h2 className="font-display text-3xl font-black text-dhl-text mb-3">
                Check your inbox.
              </h2>
              <p className="text-sm text-dhl-muted mb-2">
                If an account exists for{" "}
                <span className="font-bold text-dhl-text">{email}</span>, we've sent a reset link.
              </p>
              <p className="text-xs text-dhl-muted mb-8 italic">
                (Demo build — no real email is sent. Check backend logs.)
              </p>
              <Link
                to="/login"
                data-testid="forgot-return-link"
                className="inline-flex items-center justify-center h-12 bg-dhl-ink text-white hover:bg-dhl-ink/90 font-bold uppercase tracking-wider text-sm px-6"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
