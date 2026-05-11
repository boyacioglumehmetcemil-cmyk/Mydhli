import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import SectionEyebrow from "./SectionEyebrow";
import ComingSoonModal from "./ComingSoonModal";

const CARDS = [
  {
    image: "/images/fotolar/fotolar-01.jpg",
    headline: "Move with Confidence",
    sub: "Across every continent, every day.",
  },
  {
    image: "/images/fotolar/fotolar-09.jpg",
    headline: "Last-Mile Excellence",
    sub: "From hub to doorstep without delay.",
  },
  {
    image: "/images/fotolar/fotolar-04.jpg",
    headline: "Trusted Operations",
    sub: "Standards-driven processes, end to end.",
  },
  {
    image: "/images/fotolar/fotolar-02.jpg",
    headline: "Reliable Pickups",
    sub: "Pickup arranged in minutes, anywhere.",
  },
  {
    image: "/images/fotolar/fotolar-03.jpg",
    headline: "Customer-First Service",
    sub: "Real people, ready to help.",
  },
  {
    image: "/images/fotolar/fotolar-05.jpg",
    headline: "Safe Packaging",
    sub: "Materials and methods that protect what matters.",
  },
  {
    image: "/images/fotolar/fotolar-08.jpg",
    headline: "Compliance Made Easy",
    sub: "Dangerous goods and customs, handled.",
  },
  {
    image: "/images/fotolar/fotolar-07.png",
    headline: "Aviation Network",
    sub: "Time-definite air freight, world-spanning routes.",
  },
  {
    image: "/images/fotolar/fotolar-06.jpg",
    headline: "Local Expertise",
    sub: "Specialists wherever your shipment lands.",
  },
];

const GAP_PX = 24;
const AUTO_MS = 8000;

const InsideNetworkGrid = () => {
  const { ref: revealRef, visible } = useReveal(0);
  const [modal, setModal] = useState(null);

  // Responsive cards-per-page based on window width (resize-listener — fires
  // reliably in all browsers and test runners, unlike matchMedia change events).
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const cardsPerPage = vw >= 1024 ? 3 : vw >= 768 ? 2 : 1;

  // Measured container width (excluding padding) — determines card pixel width
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pagesCount = Math.ceil(CARDS.length / cardsPerPage);
  const [pageIndex, setPageIndex] = useState(0);
  // Clamp page index if cardsPerPage changes (e.g. user resizes browser)
  useEffect(() => {
    setPageIndex((p) => Math.min(p, pagesCount - 1));
  }, [pagesCount]);

  const cardWidth =
    containerWidth > 0
      ? (containerWidth - (cardsPerPage - 1) * GAP_PX) / cardsPerPage
      : 0;
  const stepPx = (cardWidth + GAP_PX) * cardsPerPage;

  const goTo = useCallback(
    (i) => setPageIndex(((i % pagesCount) + pagesCount) % pagesCount),
    [pagesCount]
  );
  const next = useCallback(() => goTo(pageIndex + 1), [pageIndex, goTo]);
  const prev = useCallback(() => goTo(pageIndex - 1), [pageIndex, goTo]);

  // Autoplay, pause-on-hover
  const [hovered, setHovered] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    if (hovered || pagesCount < 2) return undefined;
    timer.current = setTimeout(next, AUTO_MS);
    return () => clearTimeout(timer.current);
  }, [pageIndex, hovered, pagesCount, next]);

  // Keyboard arrow keys when slider is in viewport
  const sectionRef = useRef(null);
  useEffect(() => {
    if (pagesCount < 2) return undefined;
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
  }, [pagesCount, next, prev]);

  return (
    <section
      ref={sectionRef}
      id="inside-network"
      data-testid="inside-network-slider"
      className="bg-white py-10 lg:py-16"
    >
      <div ref={revealRef} className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div
          className={`mb-12 lg:mb-14 max-w-[720px] transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <SectionEyebrow className="mb-4">Explore</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.25rem] font-black text-dhl-ink tracking-tighter leading-[1.1]">
            Inside the Network
          </h2>
        </div>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative"
        >
          {/* Track viewport */}
          <div ref={containerRef} className="overflow-hidden">
            <div
              data-testid="slider-track"
              className="flex"
              style={{
                gap: `${GAP_PX}px`,
                transform: `translateX(-${pageIndex * stepPx}px)`,
                transition: "transform 400ms ease-out",
              }}
            >
              {CARDS.map((c, i) => (
                <article
                  key={c.headline}
                  data-testid={`grid-card-${i}`}
                  className="bg-white rounded overflow-hidden border border-dhl-border flex flex-col transition-shadow duration-[250ms] ease-out hover:shadow-lg shrink-0"
                  style={{ width: cardWidth > 0 ? `${cardWidth}px` : `calc(100% / ${cardsPerPage} - ${GAP_PX}px)` }}
                >
                  <div className="relative h-[200px] overflow-hidden bg-dhl-panel">
                    <img
                      src={c.image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-display text-[1.1rem] font-bold text-dhl-ink leading-snug mb-2 tracking-tight">
                      {c.headline}
                    </h3>
                    <p
                      className="text-[0.9rem] text-dhl-muted leading-[1.55] mb-4 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {c.sub}
                    </p>
                    <button
                      type="button"
                      onClick={() => setModal({ title: c.headline })}
                      data-testid={`grid-card-${i}-cta`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors group/cta self-start mt-auto"
                    >
                      Learn More
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-[250ms] ease-out group-hover/cta:translate-x-1" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Prev / Next chevrons — half-overlapping on outer edges */}
          {pagesCount > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                data-testid="slider-prev"
                aria-label="Previous"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-9 h-9 bg-white text-dhl-ink rounded-full shadow-md flex items-center justify-center transition-all hover:scale-105 hover:bg-dhl-yellow border border-dhl-border"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={next}
                data-testid="slider-next"
                aria-label="Next"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-9 h-9 bg-white text-dhl-ink rounded-full shadow-md flex items-center justify-center transition-all hover:scale-105 hover:bg-dhl-yellow border border-dhl-border"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {/* Page dots — one per page (not per card) */}
        {pagesCount > 1 && (
          <div
            data-testid="slider-dots"
            className="mt-8 flex items-center justify-center gap-2.5"
          >
            {Array.from({ length: pagesCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                data-testid={`slider-dot-${i}`}
                aria-label={`Go to page ${i + 1}`}
                className="group p-1"
              >
                <span
                  className={`block w-2 h-2 rounded-full transition-all duration-300 ${
                    i === pageIndex
                      ? "bg-dhl-ink"
                      : "bg-transparent border border-dhl-ink/40 group-hover:border-dhl-ink"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <ComingSoonModal open={!!modal} onClose={() => setModal(null)} title={modal?.title || ""} />
    </section>
  );
};

export default InsideNetworkGrid;
