import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import useTitle from "@/hooks/useTitle";

/**
 * Reusable "Coming soon" placeholder for navigation items whose backend
 * wiring will land in a later phase (Orders, Collaboration, etc.). Reads the
 * pathname to pick a friendly title — no per-stub file needed.
 */
const PRESETS = {
  "/dashboard/orders": {
    title: "Orders (SKU-level)",
    lead: "Roll up purchase orders into shipments at SKU granularity.",
    blurb:
      "Map your suppliers' order references to shipments so procurement and ops see the same status across air, ocean and road. Available in the next sprint.",
  },
  "/dashboard/collaboration": {
    title: "Collaboration & Shared Visibility",
    lead: "Invite colleagues, customers and brokers to a shipment.",
    blurb:
      "Each freight booking will have a shared workspace — comments, files, milestones — so your team and the receiver work from one view.",
  },
};

const DEFAULT_PRESET = {
  title: "Module coming online",
  lead: "We're wiring this up in the next phase.",
  blurb:
    "Sign in to your myDHLi account to use the modules that are already live: Tracking, Bookings, Quotes, Invoices and Documents.",
};

const DashboardComingSoon = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const preset = PRESETS[pathname] || DEFAULT_PRESET;
  useTitle(preset.title);

  return (
    <div className="max-w-3xl mx-auto" data-testid="dashboard-coming-soon">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        data-testid="coming-soon-back"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dhl-muted hover:text-dhl-red mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
      </button>

      <div className="bg-white border border-dhl-border p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-dhl-yellow/30 rotate-12" aria-hidden="true" />
        <div className="relative">
          <div className="w-14 h-14 bg-dhl-yellow flex items-center justify-center mb-6">
            <Construction className="w-6 h-6 text-dhl-ink" strokeWidth={2} />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-3">
            Coming next phase
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tight mb-3">
            {preset.title}
          </h1>
          <p className="text-base text-dhl-text mb-4">{preset.lead}</p>
          <p className="text-sm text-dhl-muted leading-relaxed max-w-xl">{preset.blurb}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardComingSoon;
