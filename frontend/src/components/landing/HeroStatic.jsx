import { useNavigate } from "react-router-dom";
import { PackagePlus, Tag, Truck, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ACTIONS = [
  {
    icon: PackagePlus,
    label: "Create a New Shipment",
    to: "/dashboard/ship",
    testId: "hero-action-ship",
  },
  {
    icon: Tag,
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
      style={{ height: "min(70vh, 620px)" }}
    >
      <div className="absolute inset-0">
        <img
          src="/images/hero-tropical-pacific.jpg"
          alt=""
          fetchpriority="high"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8 h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
          {/* Left: headline */}
          <div className="lg:col-span-7">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-dhl-yellow mb-4">
              Welcome to
            </div>
            <h1
              data-testid="hero-headline"
              className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-black text-white leading-[0.95] tracking-tighter mb-5"
            >
              Your Express Logistics Partner
            </h1>
            <p className="text-base lg:text-xl text-white/85 leading-relaxed max-w-xl">
              A worldwide network covering more than 220 countries — at your fingertips.
            </p>
          </div>

          {/* Right: Get Started Now card */}
          <div className="lg:col-span-5">
            <div
              data-testid="hero-getstarted-card"
              className="bg-white rounded-lg shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="px-5 pt-5 pb-3">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-dhl-ink">
                  Get Started Now
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-dhl-border border-t border-dhl-border">
                {ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      type="button"
                      key={a.label}
                      onClick={() => go(a.to)}
                      data-testid={a.testId}
                      className="group flex flex-col items-center justify-start gap-2 text-center px-3 py-5 hover:bg-dhl-yellow/15 transition-colors duration-[200ms] ease-out min-h-[140px]"
                    >
                      <Icon
                        className="w-7 h-7 text-dhl-ink shrink-0"
                        strokeWidth={1.75}
                      />
                      <span className="font-semibold text-[13px] leading-snug text-dhl-ink">
                        {a.label}
                      </span>
                      <span className="mt-auto inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-dhl-red opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="ml-1 w-3 h-3" />
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
