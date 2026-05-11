import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import SectionEyebrow from "./SectionEyebrow";
import ComingSoonModal from "./ComingSoonModal";

// 9-card grid built from the FOTOLAR photos — visual themes paired with each photo.
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

const InsideNetworkGrid = () => {
  const { ref, visible } = useReveal(0);
  const [modal, setModal] = useState(null);

  return (
    <section id="inside-network" data-testid="inside-network-grid" className="bg-white py-16 lg:py-[120px]">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6 lg:px-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARDS.map((c, i) => (
            <article
              key={c.headline}
              data-testid={`grid-card-${i}`}
              className={`group bg-white rounded overflow-hidden border border-dhl-border flex flex-col transition-all duration-[250ms] ease-out hover:shadow-lg hover:-translate-y-0.5 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: visible ? `${100 + i * 60}ms` : "0ms" }}
            >
              <div className="relative h-[200px] overflow-hidden bg-dhl-panel">
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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

      <ComingSoonModal open={!!modal} onClose={() => setModal(null)} title={modal?.title || ""} />
    </section>
  );
};

export default InsideNetworkGrid;
