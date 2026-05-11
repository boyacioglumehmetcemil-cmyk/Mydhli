import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionEyebrow from "./SectionEyebrow";

// All user-supplied FOTOLAR photos live here, in display order.
const PHOTOS = [
  { src: "/images/fotolar/fotolar-02.jpg", alt: "DHL courier waving from delivery truck" },
  { src: "/images/fotolar/fotolar-04.jpg", alt: "Warehouse workers measuring a large parcel" },
  { src: "/images/fotolar/fotolar-09.jpg", alt: "DHL courier delivering to a customer" },
  { src: "/images/fotolar/fotolar-03.jpg", alt: "Small-business owner packing in shop" },
  { src: "/images/fotolar/fotolar-05.jpg", alt: "Hands wrapping a fragile bottle for shipping" },
  { src: "/images/fotolar/fotolar-08.jpg", alt: "DHL parcel with UN3481 lithium-battery hazard label" },
  { src: "/images/fotolar/fotolar-06.jpg", alt: "Cardboard parcel with fragile handling label" },
  { src: "/images/fotolar/fotolar-01.jpg", alt: "Stylised world map showing global parcel route" },
  { src: "/images/fotolar/fotolar-07.png", alt: "DHL plane on a world map with clearance icons" },
  { src: "/images/fotolar/fotolar-10.png", alt: "MyDHL+ platform on desktop, tablet, and mobile" },
];

const AUTO_MS = 7000;

const Gallery = () => {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef(null);
  const timer = useRef(null);

  const goTo = useCallback(
    (i) => setIndex(((i % PHOTOS.length) + PHOTOS.length) % PHOTOS.length),
    []
  );
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  // Auto-advance, pause on hover
  useEffect(() => {
    if (hovered) return undefined;
    timer.current = setTimeout(next, AUTO_MS);
    return () => clearTimeout(timer.current);
  }, [index, hovered, next]);

  // Keyboard arrow keys when slider is in viewport
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

  return (
    <section
      ref={sectionRef}
      data-testid="gallery"
      id="gallery"
      className="bg-white py-20 lg:py-24"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="mb-10 lg:mb-12 max-w-[720px]">
          <SectionEyebrow className="mb-4">Our Network in Action</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-dhl-ink tracking-tighter leading-[1.05]">
            Behind the scenes
          </h2>
          <p className="mt-4 text-sm lg:text-base text-dhl-muted leading-[1.6] max-w-[560px]">
            Real moments from the people, vehicles, and platforms that move every shipment.
          </p>
        </div>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative max-w-[1200px] mx-auto"
        >
          {/* Frame */}
          <div
            data-testid="gallery-frame"
            className="relative w-full bg-[#1A1A1A] overflow-hidden shadow-2xl"
            style={{ height: "min(60vh, 480px)" }}
          >
            {PHOTOS.map((p, i) => (
              <div
                key={p.src}
                data-testid={`gallery-slide-${i}`}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {/* Prev / Next */}
            <button
              type="button"
              onClick={prev}
              data-testid="gallery-prev"
              aria-label="Previous photo"
              className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-dhl-yellow text-dhl-ink rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              data-testid="gallery-next"
              aria-label="Next photo"
              className="absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-dhl-yellow text-dhl-ink rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* Bottom counter */}
            <div
              data-testid="gallery-counter"
              className="absolute bottom-4 right-5 z-20 text-[12px] font-bold uppercase tracking-wider text-white/90 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-sm tabular-nums"
            >
              {index + 1} / {PHOTOS.length}
            </div>
          </div>

          {/* Dot indicators below */}
          <div
            data-testid="gallery-dots"
            className="mt-5 flex items-center justify-center gap-2"
          >
            {PHOTOS.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => goTo(i)}
                data-testid={`gallery-dot-${i}`}
                aria-label={`Go to photo ${i + 1}`}
                className={`transition-all duration-300 h-1.5 rounded-full ${
                  i === index ? "w-8 bg-dhl-yellow" : "w-1.5 bg-dhl-ink/25 hover:bg-dhl-ink/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
