import { useNavigate } from "react-router-dom";
import { Package, Receipt, Truck } from "lucide-react";
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
      className="relative w-full bg-dhl-ink overflow-hidden lg:min-h-[560px]"
    >
      <div className="absolute inset-0">
        <img
          src="/images/hero-tropical-pacific.jpg"
          alt=""
          fetchpriority="high"
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.65), rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 75%, transparent)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-14 lg:py-20 lg:min-h-[560px] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-10 lg:gap-12 items-center w-full">
          {/* Left: typography stack */}
          <div className="max-w-[640px]">
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

            {/* Headline — medium weight, refined size */}
            <h1
              data-testid="hero-headline"
              className="font-display text-white"
              style={{
                fontSize: "clamp(2rem, 3.2vw, 2.75rem)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
                textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                marginBottom: "24px",
              }}
            >
              Your Freight Forwarding Partner
            </h1>

            {/* Sub */}
            <p
              className="text-white/90"
              style={{
                fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
                fontWeight: 400,
                lineHeight: 1.5,
                maxWidth: "520px",
              }}
            >
              A worldwide network covering more than 220 countries — at your fingertips.
            </p>
          </div>

          {/* Right: Glass-panel Get Started Now card */}
          <div className="lg:justify-self-end w-full">
            <div
              data-testid="hero-getstarted-card"
              className="w-full"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                borderRadius: 4,
                padding: "16px 20px",
              }}
            >
              {/* Header */}
              <div className="mb-3">
                <div
                  className="text-[9px] font-medium uppercase text-white/70 mb-1.5"
                  style={{ letterSpacing: "0.15em" }}
                >
                  Quick Actions
                </div>
                <h2
                  className="font-display text-white"
                  style={{ fontSize: "1rem", fontWeight: 500, lineHeight: 1.15 }}
                >
                  Get Started Now
                </h2>
              </div>

              {/* 3 button cells */}
              <div className="grid grid-cols-3">
                {ACTIONS.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button
                      type="button"
                      key={a.label}
                      onClick={() => go(a.to)}
                      data-testid={a.testId}
                      className="group relative flex flex-col items-center justify-start text-center px-2.5 py-2 transition-colors duration-[200ms] ease-out"
                      style={{ minHeight: 88 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Vertical divider — subtle white at 20% */}
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 -translate-y-1/2"
                          style={{
                            height: "60%",
                            width: 1,
                            backgroundColor: "rgba(255,255,255,0.2)",
                          }}
                        />
                      )}
                      <Icon className="w-6 h-6 text-white mb-2" strokeWidth={1.5} />
                      <span className="text-[12px] font-medium text-white leading-[1.3] mb-2">
                        {a.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mt-auto inline-block text-[14px] text-white transition-transform duration-[200ms] ease-out group-hover:translate-x-1"
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
