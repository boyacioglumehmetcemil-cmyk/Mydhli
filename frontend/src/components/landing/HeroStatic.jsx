import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Static hero — one image, one headline, one CTA. No auto-rotation, no carousel.
 * Uses the "New to International Shipping?" framing for a calm, welcoming first impression.
 */
const HeroStatic = () => {
  const navigate = useNavigate();

  const handleCta = () => {
    const el = document.querySelector("#mydhl");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else navigate("/register");
  };

  return (
    <section
      data-testid="hero-static"
      className="relative w-full bg-dhl-ink overflow-hidden"
      style={{ height: "min(78vh, 660px)" }}
    >
      <div className="absolute inset-0">
        <img
          src="/images/hero-tropical-pacific.jpg"
          alt=""
          fetchpriority="high"
          className="w-full h-full object-cover"
        />
        {/* Readable text overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-dhl-yellow mb-5">
            DHL Express · Worldwide
          </div>
          <h1
            data-testid="hero-headline"
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-black text-white leading-[0.92] tracking-tighter mb-6"
          >
            New to International Shipping?
          </h1>
          <p className="text-base lg:text-xl text-white/85 leading-relaxed max-w-xl mb-8">
            We're specialists in worldwide express delivery. Get the guidance and tools to ship
            abroad with confidence.
          </p>
          <button
            type="button"
            onClick={handleCta}
            data-testid="hero-cta"
            className="inline-flex items-center gap-2 h-12 px-7 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold text-sm uppercase tracking-wider rounded-sm transition-all hover:-translate-y-0.5 hover:shadow-xl shadow-md"
          >
            Get Shipping Advice <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroStatic;
