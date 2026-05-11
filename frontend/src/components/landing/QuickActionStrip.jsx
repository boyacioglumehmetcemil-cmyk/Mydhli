import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Box, Truck, PackageOpen, ArrowRight } from "lucide-react";
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
    <section data-testid="quick-action-strip" className="relative -mt-20 z-30 px-4 lg:px-8">
      <div className="max-w-[1280px] mx-auto bg-white shadow-2xl border border-dhl-border rounded-lg overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* 4 action cells with vertical 60% dividers */}
          {CELLS.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                type="button"
                key={c.label}
                onClick={() => goTo(c)}
                data-testid={c.testId}
                className="group relative flex flex-col items-center justify-center text-center px-5 py-7 lg:py-9 hover:bg-dhl-yellow/10 transition-colors duration-[200ms] ease-out"
              >
                {/* Vertical divider — 60% height, gray-200 */}
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px bg-gray-200"
                    style={{ height: "60%" }}
                  />
                )}
                {/* Mobile horizontal divider */}
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="lg:hidden absolute top-0 left-6 right-6 h-px bg-gray-200"
                  />
                )}
                <Icon
                  className="w-7 h-7 text-dhl-ink mb-3 transition-colors"
                  strokeWidth={1.75}
                />
                <div className="font-semibold text-[13px] text-dhl-ink mb-0.5 group-hover:text-[#1976D2] transition-colors">
                  {c.label}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-dhl-muted font-medium">{c.sub}</div>
                <span className="mt-2.5 inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-dhl-red opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="ml-1 w-3 h-3" />
                </span>
              </button>
            );
          })}

          {/* Track widget — yellow bg, green button */}
          <form
            onSubmit={onTrack}
            data-testid="qa-track-form"
            className="bg-dhl-yellow flex flex-col items-stretch justify-center px-5 py-7 lg:py-9 gap-2.5 lg:col-span-1 relative"
          >
            {/* Mobile divider */}
            <span
              aria-hidden="true"
              className="lg:hidden absolute top-0 left-6 right-6 h-px bg-dhl-ink/10"
            />
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
