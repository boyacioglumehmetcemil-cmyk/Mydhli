import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SLIDES = [
  {
    id: "intl",
    image: "/images/hero-tropical-pacific.jpg",
    headline: "New to International Shipping?",
    sub: "We're specialists in worldwide express delivery. Get the guidance and tools to ship abroad with confidence.",
    cta: "Get Shipping Advice",
    action: "scroll",
    target: "#mydhl",
  },
  {
    id: "fast",
    image: "/images/hero-cargo-plane.jpg",
    headline: "Faster Than You Think",
    sub: "Time-definite express delivery to every corner of the globe — backed by our own air network.",
    cta: "See Express Services",
    action: "auth-route",
    target: "/dashboard/quote",
  },
  {
    id: "business",
    image: "/images/hero-warehouse.jpg",
    headline: "Built for Business",
    sub: "From the first parcel to your thousandth shipment — scalable logistics for every stage of growth.",
    cta: "Open a Business Account",
    action: "route",
    target: "/register",
  },
  {
    id: "doorstep",
    image: "/images/hero-courier.jpg",
    headline: "Reliable at Every Doorstep",
    sub: "Dedicated couriers, real-time visibility, and proof-of-delivery on every shipment.",
    cta: "Track a Shipment",
    action: "route",
    target: "/track",
  },
];

const AUTOPLAY_MS = 6000;

const HeroCarousel = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (paused) return undefined;
    timer.current = setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer.current);
  }, [index, paused]);

  const goTo = (i) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const handleCta = (slide) => {
    if (slide.action === "scroll") {
      const el = document.querySelector(slide.target);
      el && el.scrollIntoView({ behavior: "smooth" });
    } else if (slide.action === "auth-route") {
      navigate(isAuthenticated ? slide.target : `/login?redirect=${slide.target}`);
    } else if (slide.action === "route") {
      navigate(slide.target);
    }
  };

  return (
    <section
      data-testid="hero-carousel"
      className="relative w-full bg-dhl-ink"
      style={{ height: "min(78vh, 660px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          data-testid={`hero-slide-${i}`}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
            i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Background image with Ken Burns subtle zoom */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={s.image}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${
                i === index ? "scale-110" : "scale-100"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8 h-full flex items-center">
            <div className="max-w-2xl">
              <div
                className={`text-[11px] font-bold uppercase tracking-[0.3em] text-dhl-yellow mb-5 transition-all duration-700 ${
                  i === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
              >
                DHL Express · Worldwide
              </div>
              <h1
                className={`font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-black text-white leading-[0.92] tracking-tighter mb-6 transition-all duration-700 delay-100 ${
                  i === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                }`}
              >
                {s.headline}
              </h1>
              <p
                className={`text-base lg:text-xl text-white/85 leading-relaxed max-w-xl mb-8 transition-all duration-700 delay-200 ${
                  i === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                {s.sub}
              </p>
              <button
                type="button"
                onClick={() => handleCta(s)}
                data-testid={`hero-slide-cta-${i}`}
                className={`inline-flex items-center gap-2 h-12 px-7 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold text-sm uppercase tracking-wider rounded-sm transition-all hover:-translate-y-0.5 hover:shadow-xl shadow-md ${
                  i === index ? "opacity-100 translate-y-0 delay-300" : "opacity-0 translate-y-4"
                } duration-700`}
              >
                {s.cta} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        type="button"
        onClick={prev}
        data-testid="hero-prev"
        aria-label="Previous slide"
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={next}
        data-testid="hero-next"
        aria-label="Next slide"
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot indicators */}
      <div
        data-testid="hero-dots"
        className="absolute bottom-28 lg:bottom-32 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(i)}
            data-testid={`hero-dot-${i}`}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all duration-300 h-1.5 rounded-full ${
              i === index ? "w-10 bg-dhl-yellow" : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/10">
        <div
          key={index}
          className="h-full bg-dhl-yellow"
          style={{
            animation: paused ? "none" : `progress-bar ${AUTOPLAY_MS}ms linear forwards`,
          }}
        />
      </div>
      <style>{`
        @keyframes progress-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel;
