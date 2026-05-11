import { useNavigate } from "react-router-dom";
import { Package, Receipt, Truck, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ACTIONS = [
  {
    icon: Package,
    label: "Create a New Shipment",
    to: "/dashboard/ship",
    testId: "hero-action-ship",
  },
  {
    icon: Receipt,
    label: "Get a Rate and Time Quote",
    to: "/dashboard/quote",
    testId: "hero-action-quote",
  },
  {
    icon: Truck,
    label: "Schedule a Pickup",
    to: "/dashboard/pickup",
    testId: "hero-action-pickup",
  },
];

const HeroStatic = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const go = (target) => {
    if (isAuthenticated) navigate(target);
    else navigate(`/login?redirect=${target}`);
  };

  return (
    <section
      data-testid="hero-static"
      className="relative w-full bg-dhl-ink overflow-hidden"
      style={{ minHeight: "78vh" }}
    >
      <div className="absolute inset-0">
        <img
          src="/images/hero-tropical-pacific.jpg"
          alt=""
          fetchpriority="high"
          className="w-full h-full object-cover object-center"
        />
        {/* Refined gradient — strong on left for text legibility, fades to clear on right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.65), rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 75%, transparent)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-20 lg:py-24 min-h-[78vh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
          {/* Left: typography stack */}
          <div className="lg:col-span-7 max-w-[640px]">
            {/* Eyebrow with red ▮ accent square */}
            <div className="inline-flex items-center gap-2.5 mb-5">
              <span
                aria-hidden="true"
                className="block w-3 h-[3px]"
                style={{ backgroundColor: "#D40511" }}
              />
              <span
                className="text-[13px] font-semibold uppercase text-white"
                style={{ letterSpacing: "0.14em" }}
              >
                Welcome to
              </span>
            </div>

            {/* Headline */}
            <h1
              data-testid="hero-headline"
              className="font-display text-white"
              style={{
                fontSize: "clamp(3.5rem, 7vw, 6rem)",
                fontWeight: 900,
                letterSpacing: "-0.025em",
                lineHeight: 1,
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                marginBottom: "32px",
              }}
            >
              DHL Express
            </h1>

            {/* Sub */}
            <p
              className="text-white/95"
              style={{
                fontSize: "clamp(1.125rem, 1.6vw, 1.5rem)",
                lineHeight: 1.4,
                maxWidth: "560px",
              }}
            >
              Servicing over 220 countries and territories.
            </p>
          </div>

          {/* Right: Get Started Now card */}
          <div className="lg:col-span-5 flex lg:justify-end">
            <div
              data-testid="hero-getstarted-card"
              className="bg-white overflow-hidden w-full"
              style={{
                maxWidth: 480,
                borderRadius: 4,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              {/* Yellow ribbon at top of card */}
              <div
                aria-hidden="true"
                style={{ height: 3, backgroundColor: "#FFCC00" }}
              />

              {/* Header */}
              <div className="px-6 lg:px-8 pt-7 pb-5">
                <div
                  className="text-[10px] font-medium uppercase text-gray-500 mb-2"
                  style={{ letterSpacing: "0.15em" }}
                >
                  Quick Actions
                </div>
                <h2 className="font-display text-[#1A1A1A] font-bold text-xl lg:text-2xl leading-tight">
                  Get Started Now
                </h2>
              </div>

              {/* 3 buttons */}
              <div className="grid grid-cols-3 border-t border-gray-100">
                {ACTIONS.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button
                      type="button"
                      key={a.label}
                      onClick={() => go(a.to)}
                      data-testid={a.testId}
                      className="group relative flex flex-col items-center justify-start text-center px-5 py-5 hover:bg-[#FFFCE8] transition-colors duration-[200ms] ease-out min-h-[160px]"
                    >
                      {/* Vertical divider — 60% height, gray-200 */}
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-px bg-gray-200"
                          style={{ height: "60%" }}
                        />
                      )}
                      <Icon
                        className="w-8 h-8 text-[#2A2A2A] mb-3"
                        strokeWidth={1.5}
                      />
                      <span className="text-[14px] font-semibold text-[#1A1A1A] leading-[1.3] mb-3">
                        {a.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mt-auto inline-block text-[16px] font-bold text-dhl-red transition-transform duration-[200ms] ease-out group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroStatic;
