import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Package, MapPin, ArrowRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const QuickActionStrip = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [awb, setAwb] = useState("");
  const [locationModal, setLocationModal] = useState(false);

  const goTo = (to) => {
    if (isAuthenticated) navigate(to);
    else navigate(`/login?redirect=${to}`);
  };

  const onTrack = (e) => {
    e.preventDefault();
    const code = awb.trim().toUpperCase();
    if (code) navigate(`/track/${code}`);
    else navigate("/track");
  };

  const CELLS = [
    {
      icon: Tag,
      label: "Get Quote",
      accent: "Open ▾",
      action: () => goTo("/dashboard/quote"),
      testId: "qa-quote",
    },
    {
      icon: Package,
      label: "Delivery Services",
      action: () => goTo("/dashboard/ship"),
      testId: "qa-services",
    },
    {
      icon: MapPin,
      label: "Find a Location",
      action: () => setLocationModal(true),
      testId: "qa-location",
    },
  ];

  return (
    <section
      data-testid="quick-action-strip"
      className="relative -mt-20 z-30 px-6 lg:px-8"
    >
      <div
        className="max-w-[1200px] mx-auto bg-white rounded overflow-hidden relative"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_360px] lg:min-h-[140px]">
          {/* 3 action cells */}
          {CELLS.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                type="button"
                key={c.label}
                onClick={c.action}
                data-testid={c.testId}
                className="group relative flex flex-col items-center justify-center text-center px-6 py-7 hover:bg-[#FFFCE8] transition-colors duration-[200ms] ease-out"
              >
                {/* Vertical divider (desktop) — 70% height, gray-200 */}
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px bg-gray-200"
                    style={{ height: "70%" }}
                  />
                )}
                {/* Horizontal divider (mobile, between rows) */}
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="lg:hidden absolute top-0 left-6 right-6 h-px bg-gray-200"
                  />
                )}
                <Icon
                  className="w-8 h-8 text-[#2A2A2A]"
                  strokeWidth={1.5}
                />
                <div className="mt-4 text-[14px] font-medium text-[#2563EB] group-hover:text-[#1D4ED8] transition-colors leading-tight">
                  {c.label}
                </div>
                {c.accent && (
                  <div
                    className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#D40511]"
                  >
                    {c.accent}
                  </div>
                )}
              </button>
            );
          })}

          {/* Track widget — full-bleed yellow segment */}
          <div className="bg-dhl-yellow relative">
            {/* Mobile divider line */}
            <span
              aria-hidden="true"
              className="lg:hidden absolute top-0 left-6 right-6 h-px bg-dhl-ink/10"
            />
            <form
              onSubmit={onTrack}
              data-testid="qa-track-form"
              className="flex flex-col h-full justify-center px-6 py-6 gap-3"
            >
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-dhl-ink">
                Track Your Shipments
              </label>
              <input
                type="text"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                data-testid="qa-track-input"
                placeholder="Enter AWB number"
                className="h-11 px-3 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-dhl-ink/40 text-sm placeholder:text-dhl-muted rounded-sm"
              />
              <button
                type="submit"
                data-testid="qa-track-submit"
                className="h-11 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold uppercase tracking-[0.05em] text-[13px] transition-colors flex items-center justify-center rounded-sm"
              >
                Track <span className="ml-2">→</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Location modal */}
      {locationModal && (
        <div
          data-testid="location-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setLocationModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dhl-yellow/30 rounded-sm flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-dhl-ink" />
                </div>
                <h3 className="font-display text-xl font-black text-dhl-ink">Find a Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setLocationModal(false)}
                aria-label="Close"
                className="p-1.5 hover:bg-dhl-panel rounded-sm transition-colors"
              >
                <X className="w-5 h-5 text-dhl-muted" />
              </button>
            </div>
            <p className="text-sm text-dhl-text leading-[1.65] mb-4">
              Service points and drop-off locations are listed inside the customer dashboard. Sign
              in or open an account to find the nearest one.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocationModal(false);
                  navigate("/login");
                }}
                className="flex-1 h-11 bg-dhl-ink text-dhl-yellow font-bold uppercase tracking-wider text-xs"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationModal(false);
                  navigate("/register");
                }}
                className="flex-1 h-11 bg-dhl-red text-white font-bold uppercase tracking-wider text-xs"
              >
                Open Account
              </button>
            </div>
            <div className="text-[10px] text-dhl-muted italic mt-3 text-center">
              Demo build — location search not implemented.
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default QuickActionStrip;
