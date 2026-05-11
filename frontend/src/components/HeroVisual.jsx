import { Plane, Package, MapPin, Truck } from "lucide-react";

/**
 * Programmatic SVG visual for the landing hero.
 * Represents a logistics route across PNG with animated dashed lines and pinned icons.
 * NO stock photos — per design guidelines.
 */
const HeroVisual = () => {
  return (
    <div
      data-testid="hero-visual"
      className="relative w-full aspect-square max-w-[520px] mx-auto"
    >
      {/* Background grid panel */}
      <div className="absolute inset-0 bg-white border border-dhl-border overflow-hidden">
        {/* Subtle grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#333" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Yellow corner block */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-dhl-yellow" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-dhl-red" />

        {/* Route SVG */}
        <svg
          viewBox="0 0 520 520"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Curved dashed route line — yellow */}
          <path
            d="M 60 380 Q 180 260 280 280 T 460 120"
            fill="none"
            stroke="#FFCC00"
            strokeWidth="3"
            strokeDasharray="8 8"
            strokeLinecap="round"
            className="animate-dash-flow"
          />
          {/* Secondary red route */}
          <path
            d="M 60 380 Q 220 420 360 360 T 460 380"
            fill="none"
            stroke="#D40511"
            strokeWidth="2.5"
            strokeDasharray="6 10"
            strokeLinecap="round"
            opacity="0.7"
            className="animate-dash-flow"
          />

          {/* Origin node */}
          <g>
            <circle cx="60" cy="380" r="10" fill="#D40511" />
            <circle cx="60" cy="380" r="20" fill="#D40511" opacity="0.18" />
          </g>

          {/* Mid node */}
          <g>
            <circle cx="280" cy="280" r="7" fill="#1A1A1A" />
          </g>

          {/* Destination node */}
          <g>
            <circle cx="460" cy="120" r="10" fill="#FFCC00" stroke="#1A1A1A" strokeWidth="2" />
            <circle cx="460" cy="120" r="20" fill="#FFCC00" opacity="0.25" />
          </g>
        </svg>

        {/* Icon pins */}
        <div className="absolute" style={{ left: "5%", bottom: "20%" }}>
          <div className="bg-white border-2 border-dhl-ink p-2 shadow-md">
            <Truck className="w-5 h-5 text-dhl-ink" strokeWidth={2} />
          </div>
          <div className="text-[10px] font-bold tracking-wider uppercase mt-1.5 text-dhl-text">
            Port Moresby
          </div>
        </div>

        <div className="absolute" style={{ left: "48%", top: "48%" }}>
          <div className="bg-dhl-ink p-2">
            <Package className="w-5 h-5 text-dhl-yellow" strokeWidth={2} />
          </div>
        </div>

        <div className="absolute" style={{ right: "8%", top: "12%" }}>
          <div className="bg-dhl-yellow border-2 border-dhl-ink p-2 shadow-md">
            <Plane className="w-5 h-5 text-dhl-ink" strokeWidth={2} />
          </div>
          <div className="text-[10px] font-bold tracking-wider uppercase mt-1.5 text-dhl-text">
            International
          </div>
        </div>

        {/* Stat overlay card */}
        <div className="absolute bottom-5 right-5 bg-white border border-dhl-border p-3 shadow-sm">
          <div className="text-[10px] font-bold tracking-wider uppercase text-dhl-muted">
            Active Route
          </div>
          <div className="font-display text-2xl font-black text-dhl-text leading-none mt-1">
            POM <span className="text-dhl-red">→</span> SIN
          </div>
          <div className="text-[10px] text-dhl-muted mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            6,200 km · 18h ETA
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroVisual;
