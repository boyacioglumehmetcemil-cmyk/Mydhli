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
    { icon: Tag, label: "Get Quote", action: () => goTo("/dashboard/quote"), testId: "qa-quote" },
    { icon: Package, label: "Delivery Services", action: () => goTo("/dashboard/ship"), testId: "qa-services" },
    { icon: MapPin, label: "Find a Location", action: () => setLocationModal(true), testId: "qa-location" },
  ];

  return (
    <section data-testid="quick-action-strip" className="relative -mt-20 z-30 px-4 lg:px-8">
      <div className="max-w-[1080px] mx-auto bg-white shadow-2xl border border-dhl-border rounded-lg overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {CELLS.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                type="button"
                key={c.label}
                onClick={c.action}
                data-testid={c.testId}
                className="group relative flex flex-col items-center justify-center text-center px-5 py-7 lg:py-9 hover:bg-dhl-yellow/10 transition-colors duration-[200ms] ease-out"
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px bg-gray-200"
                    style={{ height: "60%" }}
                  />
                )}
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="lg:hidden absolute top-0 left-6 right-6 h-px bg-gray-200"
                  />
                )}
                <Icon className="w-7 h-7 text-dhl-ink mb-3" strokeWidth={1.75} />
                <div className="font-semibold text-[14px] text-dhl-ink group-hover:text-[#1976D2] transition-colors">
                  {c.label}
                </div>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-dhl-red opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="ml-1 w-3 h-3" />
                </span>
              </button>
            );
          })}

          {/* Track widget */}
          <form
            onSubmit={onTrack}
            data-testid="qa-track-form"
            className="bg-dhl-yellow flex flex-col items-stretch justify-center px-5 py-7 lg:py-9 gap-2.5 relative"
          >
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
