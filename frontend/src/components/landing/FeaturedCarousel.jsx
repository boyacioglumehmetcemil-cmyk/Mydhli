import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SectionEyebrow from "./SectionEyebrow";

const SLIDES = [
  {
    id: "fast",
    image: "/images/hero-cargo-plane.jpg",
    eyebrow: "Speed",
    headline: "Faster Than You Think",
    sub: "Time-definite express delivery to every corner of the globe — backed by our own air network.",
    cta: "See Freight Services",
    action: "auth-route",
    target: "/dashboard/quote",
  },
  {
    id: "business",
    image: "/images/hero-warehouse.jpg",
    eyebrow: "Scale",
    headline: "Built for Business",
    sub: "From the first parcel to your thousandth shipment — scalable logistics for every stage of growth.",
    cta: "Open a Business Account",
    action: "route",
    target: "/register",
  },
  {
    id: "doorstep",
    image: "/images/hero-courier.jpg",
    eyebrow: "Visibility",
    headline: "Reliable at Every Doorstep",
    sub: "Dedicated couriers, real-time visibility, and proof-of-delivery on every shipment.",
    cta: "Track a Shipment",
    action: "route",
    target: "/track",
  },
];

const AUTOPLAY_MS = 6000;

const FeaturedCarousel = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (hovered) return undefined;
    timer.current = setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer.current);
  }, [index, hovered]);

  const goTo = (i) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);

  const handleCta = (slide) => {
    if (slide.action === "auth-route") {
      navigate(isAuthenticated ? slide.target : `/login?redirect=${slide.target}`);
    } else if (slide.action === "route") {
      navigate(slide.target);
    }
  };

  return (
    <section
      data-testid="featured-carousel"
      className="bg-[#FAFAFA] py-20 lg:py-28"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="mb-10 lg:mb-12 max-w-[720px]">
          <SectionEyebrow className="mb-4">Featured</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-dhl-ink tracking-tighter leading-[1.05]">
            Discover what's possible
          </h2>
        </div>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative max-w-[1200px] mx-auto bg-white shadow-xl border border-dhl-border overflow-hidden"
          style={{ minHeight: 420 }}
        >
          {/* Slides */}
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              data-testid={`featured-slide-${i}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-out grid grid-cols-1 md:grid-cols-5 ${
                i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Image side (60%) */}
              <div className="relative md:col-span-3 h-64 md:h-auto overflow-hidden">
                <img
                  src={s.image}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent md:bg-none" />
              </div>

              {/* Text side (40%) */}
              <div className="md:col-span-2 flex flex-col justify-center px-7 py-8 md:px-10 md:py-10 bg-white">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-dhl-red mb-3">
                  {s.eyebrow}
                </div>
                <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-dhl-ink leading-[1.05] tracking-tighter mb-4">
                  {s.headline}
                </h3>
                <p className="text-sm md:text-base text-dhl-muted leading-[1.6] mb-7">
                  {s.sub}
                </p>
                <button
                  type="button"
                  onClick={() => handleCta(s)}
                  data-testid={`featured-slide-cta-${i}`}
                  className="inline-flex items-center gap-2 h-11 px-6 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold text-xs uppercase tracking-wider rounded-sm transition-all hover:-translate-y-0.5 shadow-sm self-start"
                >
                  {s.cta} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Prev / Next chevrons */}
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            data-testid="featured-prev"
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/95 hover:bg-white border border-dhl-border shadow-md flex items-center justify-center text-dhl-ink transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            data-testid="featured-next"
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/95 hover:bg-white border border-dhl-border shadow-md flex items-center justify-center text-dhl-ink transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div
            data-testid="featured-dots"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
          >
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                data-testid={`featured-dot-${i}`}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 h-1.5 rounded-full ${
                  i === index ? "w-10 bg-dhl-ink" : "w-1.5 bg-dhl-ink/30 hover:bg-dhl-ink/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;
