import { useCountUp } from "@/hooks/useReveal";

const Stat = ({ end, suffix, prefix = "", label, decimals = 0, format = "number" }) => {
  const { ref, value } = useCountUp(end, 1500);
  let display;
  if (format === "static") display = String(end);
  else display = value.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  return (
    <div ref={ref} data-testid={`stat-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="px-5 py-4">
      <div className="font-display text-4xl lg:text-5xl font-black text-dhl-yellow leading-none">
        {prefix}{display}{suffix}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/60 mt-2 font-bold">
        {label}
      </div>
    </div>
  );
};

const AnimatedStats = () => {
  return (
    <section data-testid="animated-stats" className="bg-dhl-ink relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="stat-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stat-grid)" />
        </svg>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          <Stat end={220} suffix="+" label="Countries & Territories" />
          <Stat end={1.6} suffix="M+" decimals={1} label="Shipments Delivered Daily" />
          <Stat end={350} suffix="K+" label="Team Members Globally" />
          <Stat end={99.4} suffix="%" decimals={1} label="On-Time Delivery" />
        </div>
      </div>
    </section>
  );
};

export default AnimatedStats;
