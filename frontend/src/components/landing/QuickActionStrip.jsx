import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Box, Truck, PackageOpen, Bell, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CELLS = [
  { icon: Tag, label: "Get a Quote", sub: "Live rates", to: "/dashboard/quote", auth: true, testId: "qa-quote" },
  { icon: Box, label: "My Shipments", sub: "Manage parcels", to: "/dashboard/shipments", auth: true, testId: "qa-shipments" },
  { icon: Truck, label: "My Pickups", sub: "Schedule courier", to: "/dashboard/pickups", auth: true, testId: "qa-pickups" },
  { icon: PackageOpen, label: "Create a Shipment", sub: "Ship in 5 steps", to: "/dashboard/ship", auth: true, testId: "qa-create" },
];

const QuickActionStrip = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [awb, setAwb] = useState("");

  const goTo = (cell) => {
    if (cell.auth && !isAuthenticated) {
      navigate(`/login?redirect=${cell.to}`);
    } else {
      navigate(cell.to);
    }
  };

  const onTrack = (e) => {
    e.preventDefault();
    const code = awb.trim().toUpperCase();
    if (code) navigate(`/track/${code}`);
    else navigate("/track");
  };

  return (
    <section
      data-testid="quick-action-strip"
      className="relative -mt-20 z-30 px-4 lg:px-8"
    >
      <div className="max-w-[1280px] mx-auto bg-white shadow-2xl border border-dhl-border relative">
        {/* Floating notification bell flourish */}
        <div
          aria-hidden="true"
          className="hidden lg:flex absolute -top-5 -right-5 w-16 h-16 bg-dhl-red text-white rounded-full items-center justify-center shadow-lg"
          style={{ transform: "rotate(-8deg)" }}
        >
          <Bell className="w-6 h-6" strokeWidth={2.5} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-dhl-yellow text-dhl-ink text-xs font-black rounded-full flex items-center justify-center border-2 border-white">
            2
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-dhl-border">
          {/* 4 action cells */}
          {CELLS.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                type="button"
                key={c.label}
                onClick={() => goTo(c)}
                data-testid={c.testId}
                className="group flex flex-col items-center justify-center text-center px-5 py-7 lg:py-9 hover:bg-dhl-panel transition-colors relative"
              >
                <div className="w-14 h-14 mb-3 bg-dhl-yellow/15 group-hover:bg-dhl-yellow flex items-center justify-center transition-colors">
                  <Icon className="w-6 h-6 text-dhl-ink" strokeWidth={2} />
                </div>
                <div className="font-display font-bold text-base text-dhl-ink mb-0.5">{c.label}</div>
                <div className="text-[11px] uppercase tracking-wider text-dhl-muted font-medium">{c.sub}</div>
                <span className="mt-3 inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-dhl-red opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="ml-1 w-3 h-3" />
                </span>
              </button>
            );
          })}

          {/* Track widget */}
          <form
            onSubmit={onTrack}
            data-testid="qa-track-form"
            className="bg-dhl-yellow/95 flex flex-col items-stretch justify-center px-5 py-7 lg:py-9 gap-2.5 lg:col-span-1"
          >
            <label className="text-[11px] font-bold uppercase tracking-wider text-dhl-ink">
              Track Your Shipments
            </label>
            <input
              type="text"
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
              data-testid="qa-track-input"
              placeholder="Enter AWB number"
              className="h-10 px-3 bg-white border-2 border-dhl-ink/20 focus:border-dhl-ink focus:outline-none text-sm placeholder:text-dhl-muted"
            />
            <button
              type="submit"
              data-testid="qa-track-submit"
              className="h-10 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
            >
              Track <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default QuickActionStrip;
