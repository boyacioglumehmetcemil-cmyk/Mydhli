import { useEffect, useState } from "react";
import { X, Truck, PackageSearch, Receipt, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const TOPICS = [
  {
    key: "shipping", icon: Truck, title: "Shipping",
    body: "Book pickups, choose service tiers, and prepare paperwork for outbound shipments.",
  },
  {
    key: "tracking", icon: PackageSearch, title: "Tracking",
    body: "Find an AWB, see milestone events, and understand status codes (PU / OC / WC / OK).",
  },
  {
    key: "billing", icon: Receipt, title: "Billing",
    body: "Invoices, payment methods, GST handling, and how to download tax invoices.",
  },
  {
    key: "customs", icon: ShieldCheck, title: "Customs",
    body: "Commercial invoices, HS codes, letters of authorization, and import duty rules.",
  },
];

const TOPIC_OPTIONS = [
  "General enquiry", "Shipping help", "Tracking issue",
  "Billing question", "Customs / duties", "Other",
];

const HelpSupportModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    name: "", email: "", topic: TOPIC_OPTIONS[0], message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please complete name, email, and message");
      return;
    }
    setSubmitting(true);
    // No actual backend send — just UX confirmation per spec
    setTimeout(() => {
      toast.success("Your message has been received", {
        description: "Our team will respond within 24 hours.",
      });
      setForm({ name: "", email: "", topic: TOPIC_OPTIONS[0], message: "" });
      setSubmitting(false);
      onClose();
    }, 450);
  };

  return (
    <div
      data-testid="help-support-modal"
      className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[760px] mt-4 sm:mt-12 border border-dhl-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dhl-border">
          <h2 className="font-display text-xl font-black text-dhl-ink">
            Help and Support
          </h2>
          <button
            type="button"
            data-testid="help-modal-close"
            onClick={onClose}
            className="p-1.5 hover:bg-dhl-panel transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-dhl-text" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-dhl-muted leading-relaxed mb-5">
            Browse the topics below or reach our team directly using the
            contact form. We aim to respond to all enquiries within one
            business day.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
            {TOPICS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.key}
                  data-testid={`help-topic-${t.key}`}
                  className="border border-dhl-border p-3 hover:bg-dhl-yellow/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-9 h-9 flex items-center justify-center border border-dhl-border bg-dhl-panel">
                      <Icon className="w-4 h-4 text-dhl-text" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-dhl-text leading-tight">{t.title}</div>
                      <div className="text-xs text-dhl-muted mt-1 leading-snug">{t.body}</div>
                      <button
                        type="button"
                        onClick={() => toast.info("Knowledge base coming soon")}
                        className="mt-2 text-[11px] font-semibold text-[#0EA5B7] hover:text-[#0B8C9C] transition-colors"
                      >
                        Read more →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={submit} data-testid="help-contact-form" className="space-y-3 border-t border-dhl-border pt-5">
            <div className="text-xs font-bold uppercase tracking-wider text-dhl-text flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Contact us
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text" placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="border border-dhl-border px-3 py-2 text-sm focus:outline-none focus:border-dhl-ink"
                data-testid="help-input-name"
              />
              <input
                type="email" placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                className="border border-dhl-border px-3 py-2 text-sm focus:outline-none focus:border-dhl-ink"
                data-testid="help-input-email"
              />
            </div>
            <select
              value={form.topic}
              onChange={(e) => setForm((s) => ({ ...s, topic: e.target.value }))}
              className="w-full border border-dhl-border px-3 py-2 text-sm focus:outline-none focus:border-dhl-ink bg-white"
              data-testid="help-input-topic"
            >
              {TOPIC_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea
              rows={4} placeholder="How can we help?"
              value={form.message}
              onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
              className="w-full border border-dhl-border px-3 py-2 text-sm focus:outline-none focus:border-dhl-ink resize-none"
              data-testid="help-input-message"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                data-testid="help-submit"
                className="bg-dhl-red hover:bg-dhl-red/90 text-white rounded-none uppercase tracking-wider text-xs font-bold px-6"
              >
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportModal;
