import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SlideContent from "./SlideContent";
import ComingSoonModal from "./ComingSoonModal";

// Standalone carousel — no section header above it. Reads /images/fotolar2/manifest.json.
// Each manifest entry carries the slide's eyebrow/headline/sub/ctaLabel/cta data.

const MANIFEST_URL = "/images/fotolar2/manifest.json";
const BASE = "/images/fotolar2/";
const AUTO_MS = 7000;

const SecondarySlider = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [photos, setPhotos] = useState(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [modal, setModal] = useState(null);
  const sectionRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(MANIFEST_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { images: [] }))
      .then((data) => {
        if (cancelled) return;
        setPhotos(Array.isArray(data?.images) ? data.images : []);
      })
      .catch(() => !cancelled && setPhotos([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const count = photos?.length || 0;

  const goTo = useCallback(
    (i) => count > 0 && setIndex(((i % count) + count) % count),
    [count]
  );
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    if (hovered || count < 2) return undefined;
    timer.current = setTimeout(next, AUTO_MS);
    return () => clearTimeout(timer.current);
  }, [index, hovered, count, next]);

  useEffect(() => {
    if (count < 2) return undefined;
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
  }, [count, next, prev]);

  if (photos === null || count === 0) return null;

  const handleCta = (slide) => {
    if (slide.cta?.type === "route") navigate(slide.cta.to);
    else if (slide.cta?.type === "auth-route") {
      navigate(isAuthenticated ? slide.cta.to : `/login?redirect=${slide.cta.to}`);
    } else setModal({ title: slide.cta?.title || slide.headline });
  };

  const slides = photos.map((p) => ({
    image: `${BASE}${p.src}`,
    alt: p.alt || "",
    eyebrow: p.eyebrow,
    headline: p.headline,
    sub: p.sub,
    ctaLabel: p.ctaLabel,
    onCta: () => handleCta({ cta: p.cta, headline: p.headline }),
  }));

  return (
    <section
      ref={sectionRef}
      data-testid="secondary-slider"
      id="carousel"
      className="bg-white pt-20 pb-8 lg:pt-[80px] lg:pb-[20px]"
    >
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative"
        >
          {/* Slider frame */}
          <div
            data-testid="secondary-frame"
            className="relative w-full bg-[#FAFAFA] rounded overflow-hidden shadow-sm border border-dhl-border"
            style={{ height: "min(58vh, 440px)" }}
          >
            {slides.map((s, i) => (
              <div
                key={i}
                data-testid={`secondary-slide-${i}`}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <SlideContent slide={s} />
              </div>
            ))}
          </div>

          {/* Chevrons on the OUTER edges, half-overlapping the frame */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                data-testid="secondary-prev"
                aria-label="Previous slide"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-9 h-9 bg-white text-dhl-ink rounded-full shadow-md flex items-center justify-center transition-all hover:scale-105 hover:bg-dhl-yellow border border-dhl-border"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={next}
                data-testid="secondary-next"
                aria-label="Next slide"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-9 h-9 bg-white text-dhl-ink rounded-full shadow-md flex items-center justify-center transition-all hover:scale-105 hover:bg-dhl-yellow border border-dhl-border"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {/* Dots BELOW the frame — minimal black circle indicators */}
        {count > 1 && (
          <div
            data-testid="secondary-dots"
            className="mt-6 flex items-center justify-center gap-2.5"
          >
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                data-testid={`secondary-dot-${i}`}
                aria-label={`Go to slide ${i + 1}`}
                className="group p-1"
              >
                <span
                  className={`block w-2 h-2 rounded-full transition-all duration-300 ${
                    i === index
                      ? "bg-dhl-ink"
                      : "bg-transparent border border-dhl-ink/40 group-hover:border-dhl-ink"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <ComingSoonModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title || ""}
      />
    </section>
  );
};

export default SecondarySlider;
