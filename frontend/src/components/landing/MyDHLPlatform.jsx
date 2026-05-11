import { useNavigate } from "react-router-dom";
import { Eye, Settings, ArrowRight } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const MyDHLPlatform = () => {
  const navigate = useNavigate();
  const { ref, visible } = useReveal(0);

  return (
    <section
      id="mydhl"
      ref={ref}
      data-testid="mydhl-platform"
      className="relative bg-white py-16 lg:py-[120px] overflow-hidden"
    >
      {/* Decorative yellow swoosh */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1400 600"
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        preserveAspectRatio="none"
      >
        <path
          d="M -50 380 Q 350 200, 700 320 T 1450 280"
          fill="none"
          stroke="#FFCC00"
          strokeWidth="120"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M -50 380 Q 350 200, 700 320 T 1450 280"
          fill="none"
          stroke="#FFCC00"
          strokeWidth="2"
          strokeDasharray="6 8"
        />
      </svg>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <div
            className={`lg:col-span-7 transition-all duration-1000 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="relative">
              <img
                src="/images/mydhl-devices.jpg"
                alt="MyDHL platform on desktop, tablet, and mobile devices"
                loading="lazy"
                className="w-full h-auto max-h-[520px] object-cover object-center"
              />
              {/* Subtle frame accent */}
              <div className="absolute -bottom-3 -right-3 w-32 h-32 bg-dhl-yellow -z-10 hidden lg:block" />
            </div>
          </div>

          {/* Copy */}
          <div
            className={`lg:col-span-5 transition-all duration-1000 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-dhl-red mb-4">
              MyDHL Platform
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-dhl-ink leading-[0.95] tracking-tighter mb-6">
              Flexible.
              <br />
              Powerful.
              <br />
              <span className="text-dhl-yellow" style={{ WebkitTextStroke: "1.5px #1A1A1A" }}>
                Effortless.
              </span>
            </h2>
            <p className="text-base lg:text-lg text-dhl-muted leading-[1.55] mb-8">
              Your full logistics control center — create shipments, get rates, schedule pickups,
              manage customs documents, and track everything in one place. Built for the way modern
              businesses ship.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                type="button"
                onClick={() => navigate("/register")}
                data-testid="mydhl-about-btn"
                className="group p-4 border border-dhl-border bg-white hover:border-dhl-yellow hover:-translate-y-0.5 transition-all text-left"
              >
                <Eye className="w-5 h-5 text-dhl-red mb-2" />
                <div className="font-display font-bold text-sm text-dhl-ink mb-1">About MyDHL</div>
                <div className="text-[11px] text-[#1976D2] font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Take the tour <ArrowRight className="w-3 h-3" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                data-testid="mydhl-whatsnew-btn"
                className="group p-4 border border-dhl-border bg-white hover:border-dhl-yellow hover:-translate-y-0.5 transition-all text-left"
              >
                <Settings className="w-5 h-5 text-dhl-red mb-2" />
                <div className="font-display font-bold text-sm text-dhl-ink mb-1">What's New</div>
                <div className="text-[11px] text-[#1976D2] font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Latest updates <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            </div>

            <button
              type="button"
              data-testid="mydhl-cta"
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 h-12 px-7 bg-dhl-red hover:bg-dhl-red-dark text-white font-bold text-sm uppercase tracking-wider rounded-sm transition-all hover:-translate-y-0.5 shadow-md"
            >
              Open MyDHL Account <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyDHLPlatform;
