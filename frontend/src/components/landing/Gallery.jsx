import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SectionEyebrow from "./SectionEyebrow";
import SlideContent from "./SlideContent";
import ComingSoonModal from "./ComingSoonModal";

// Themed copy per FOTOLAR photo — image-paired narrative.
const SLIDES = [
  {
    image: "/images/fotolar/fotolar-05.jpg",
    alt: "Hands wrapping a fragile bottle for shipping",
    eyebrow: "Care",
    headline: "Packed With Care",
    sub: "Fragile goods, high-value items, gifts — handled like they're the only parcel on the truck.",
    ctaLabel: "Learn About Packaging",
    cta: { type: "modal", title: "Packaging Guidelines" },
  },
  {
    image: "/images/fotolar/fotolar-08.jpg",
    alt: "DHL parcel with UN3481 lithium-battery hazard label",
    eyebrow: "Compliance",
    headline: "Dangerous Goods, Done Right",
    sub: "Lithium batteries and regulated cargo, handled to IATA standards by trained specialists.",
    ctaLabel: "Compliance Overview",
    cta: { type: "modal", title: "Dangerous Goods Compliance" },
  },
  {
    image: "/images/fotolar/fotolar-06.jpg",
    alt: "Cardboard parcel with fragile handling label",
    eyebrow: "Standards",
    headline: "Built to Travel",
    sub: "Approved packaging, hazard labels, and chain-of-custody — every parcel starts the journey right.",
    ctaLabel: "See the Standards",
    cta: { type: "modal", title: "Packaging Standards" },
  },
  {
    image: "/images/fotolar/fotolar-07.png",
    alt: "DHL aircraft over a world map with clearance icons",
    eyebrow: "Aviation",
    headline: "Aircraft and Hangars",
    sub: "Time-definite delivery starts in the sky. A look at the aviation backbone of express logistics.",
    ctaLabel: "See the Fleet",
    cta: { type: "modal", title: "The Aviation Network" },
  },
];

const AUTO_MS = 7000;

const Gallery = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [modal, setModal] = useState(null);
  const sectionRef = useRef(null);
  const timer = useRef(null);

  const count = SLIDES.length;

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    if (hovered) return undefined;
    timer.current = setTimeout(next, AUTO_MS);
    return () => clearTimeout(timer.current);
  }, [index, hovered, next]);

  useEffect(() => {
    let inView = false;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (inView = e.isIntersecting)),
      { threshold: 0.4 }
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    const onKey = (e) => {
      if (!inView) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      io.disconnect();
    };
  }, [next, prev]);

  const handleCta = (slide) => {
    if (slide.cta?.type === "route") navigate(slide.cta.to);
    else if (slide.cta?.type === "auth-route") {
      navigate(isAuthenticated ? slide.cta.to : `/login?redirect=${slide.cta.to}`);
    } else setModal({ title: slide.cta?.title || slide.headline });
  };

  const slidesWithHandlers = SLIDES.map((s) => ({ ...s, onCta: () => handleCta(s) }));

  return (
    <section
      ref={sectionRef}
      data-testid="gallery"
      id="gallery"
      className="bg-[#FAFAFA] pt-16 lg:pt-[120px] pb-12 lg:pb-[60px]"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative max-w-[1200px] mx-auto"
        >
          <div
            data-testid="gallery-frame"
            className="relative w-full bg-white rounded-lg overflow-hidden shadow-2xl border border-dhl-border"
            style={{ height: "min(60vh, 480px)" }}
          >
            {slidesWithHandlers.map((s, i) => (
              <div
                key={i}
                data-testid={`gallery-slide-${i}`}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <SlideContent slide={s} />
              </div>
            ))}

            <button
              type="button"
              onClick={prev}
              data-testid="gallery-prev"
              aria-label="Previous slide"
              className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-dhl-yellow text-dhl-ink rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 border border-dhl-border"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              data-testid="gallery-next"
              aria-label="Next slide"
              className="absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-dhl-yellow text-dhl-ink rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 border border-dhl-border"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <div
              data-testid="gallery-counter"
              className="absolute bottom-4 right-5 z-20 text-[12px] font-bold uppercase tracking-wider text-white/95 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-sm tabular-nums"
            >
              {index + 1} / {count}
            </div>
          </div>

          <div
            data-testid="gallery-dots"
            className="mt-5 flex items-center justify-center gap-2"
          >
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                data-testid={`gallery-dot-${i}`}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 h-1.5 rounded-full ${
                  i === index ? "w-8 bg-dhl-yellow" : "w-1.5 bg-dhl-ink/25 hover:bg-dhl-ink/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <ComingSoonModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title || ""}
      />
    </section>
  );
};

export default Gallery;
