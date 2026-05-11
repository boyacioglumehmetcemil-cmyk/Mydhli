import { ArrowRight } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const routes = [
  { from: "POM", to: "SYD", time: "1 day" },
  { from: "POM", to: "SIN", time: "2 days" },
  { from: "POM", to: "HKG", time: "2 days" },
  { from: "POM", to: "LHR", time: "3 days" },
  { from: "POM", to: "LAX", time: "3 days" },
  { from: "POM", to: "DXB", time: "3 days" },
];

const GlobalNetwork = () => {
  const { ref, visible } = useReveal(0);
  return (
    <section data-testid="global-network" className="relative py-24 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-world-routes.jpg"
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-dhl-ink/85" />
      </div>
      <div ref={ref} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
        <div
          className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-dhl-yellow mb-4">
            Our Global Network
          </div>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tighter mb-6">
            From Port Moresby to anywhere on Earth.
          </h2>
          <p className="text-base lg:text-lg text-white/75 max-w-2xl mx-auto mb-14">
            Our integrated air, road, and ocean network reaches every continent. Whether you're
            sending a contract to Singapore or pallets to Frankfurt, we move it on time.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {routes.map((r, i) => (
            <div
              key={`${r.from}-${r.to}`}
              data-testid={`route-pill-${r.from}-${r.to}`}
              className={`inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/20 px-4 py-2.5 transition-all duration-500 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${200 + i * 80}ms` }}
            >
              <span className="font-display font-black text-dhl-yellow">{r.from}</span>
              <ArrowRight className="w-3.5 h-3.5 text-dhl-red" />
              <span className="font-display font-black text-white">{r.to}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 ml-2 border-l border-white/20 pl-2">
                {r.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GlobalNetwork;
