import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionEyebrow from "./SectionEyebrow";

// Reads /images/fotolar2/manifest.json at mount. If the manifest is missing,
// empty, or fetch fails, the section hides itself entirely.
//
// To add new photos:
//   1. Drop files into /app/frontend/public/images/fotolar2/
//   2. Add their filenames + alt text to manifest.json
//
// Smaller / lighter visual treatment than the main <Gallery /> so the two
// sliders don't compete for attention.

const MANIFEST_URL = "/images/fotolar2/manifest.json";
const BASE = "/images/fotolar2/";
const AUTO_MS = 7000;

const SecondarySlider = () => {
  const [photos, setPhotos] = useState(null); // null = loading, [] = empty/hide
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef(null);
  const timer = useRef(null);

  // Load manifest once
  useEffect(() => {
    let cancelled = false;
    fetch(MANIFEST_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { images: [] }))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.images) ? data.images : [];
        setPhotos(list);
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

  // Auto-advance
  useEffect(() => {
    if (hovered || count < 2) return undefined;
    timer.current = setTimeout(next, AUTO_MS);
    return () => clearTimeout(timer.current);
  }, [index, hovered, count, next]);

  // Keyboard arrows when in viewport
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

  // Hide section entirely when manifest is empty or unavailable
  if (photos === null) return null; // still loading — render nothing to avoid flash
  if (count === 0) return null;

  return (
    <section
      ref={sectionRef}
      data-testid="secondary-slider"
      id="secondary-slider"
      className="bg-white py-16 lg:py-24"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="mb-8 lg:mb-10 max-w-[720px] mx-auto text-center">
          <div className="flex justify-center mb-3">
            <SectionEyebrow>More From The Field</SectionEyebrow>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-dhl-ink tracking-tighter leading-[1.1]">
            On the ground, every day
          </h2>
          <p className="mt-3 text-sm text-dhl-muted leading-[1.55] max-w-[520px] mx-auto">
            Snapshots from operations, partners, and customers across the network.
          </p>
        </div>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative max-w-[860px] mx-auto"
        >
          <div
            data-testid="secondary-frame"
            className="relative w-full bg-[#F4F4F4] rounded-lg overflow-hidden shadow-lg"
            style={{ height: "min(50vh, 340px)" }}
          >
            {photos.map((p, i) => (
              <div
                key={p.src}
                data-testid={`secondary-slide-${i}`}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={`${BASE}${p.src}`}
                  alt={p.alt || ""}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  data-testid="secondary-prev"
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white hover:bg-dhl-yellow text-dhl-ink rounded-full shadow-md flex items-center justify-center transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  data-testid="secondary-next"
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white hover:bg-dhl-yellow text-dhl-ink rounded-full shadow-md flex items-center justify-center transition-all hover:scale-105"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </button>

                <div
                  data-testid="secondary-counter"
                  className="absolute bottom-3 right-3 z-20 text-[11px] font-bold uppercase tracking-wider text-white/95 bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded-sm tabular-nums"
                >
                  {index + 1} / {count}
                </div>
              </>
            )}
          </div>

          {count > 1 && (
            <div
              data-testid="secondary-dots"
              className="mt-4 flex items-center justify-center gap-2"
            >
              {photos.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => goTo(i)}
                  data-testid={`secondary-dot-${i}`}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`transition-all duration-300 h-1.5 rounded-full ${
                    i === index ? "w-7 bg-dhl-yellow" : "w-1.5 bg-dhl-ink/25 hover:bg-dhl-ink/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SecondarySlider;
