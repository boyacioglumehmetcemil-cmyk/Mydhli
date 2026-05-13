import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X, AlertTriangle, Globe } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const CARDS = [
  {
    image: "/images/hero-courier.jpg",
    eyebrow: "Business Accounts",
    headline: "Save up to 30% on Frequent Shipping",
    body: "Open a business account and unlock preferred rates, flexible billing, and dedicated support.",
    cta: "Open an Account",
    action: { type: "route", to: "/register" },
    testId: "info-card-business",
  },
  {
    image: "/images/dangerous-goods-box.jpg",
    eyebrow: "Compliance",
    headline: "Shipping Batteries Safely",
    body: "Lithium-ion batteries are classified as Dangerous Goods. Learn the regulations before you ship.",
    cta: "Understanding Dangerous Goods",
    action: {
      type: "modal",
      title: "Understanding Dangerous Goods",
      icon: AlertTriangle,
      content: [
        "Lithium batteries, perfumes, aerosols, and certain chemicals are classified as Dangerous Goods (DG) under IATA regulations.",
        "Before shipping, declare DG items and use approved packaging with required hazard labels. Incorrect declaration can result in fines, refused shipments, and safety risks.",
        "DHL Global Forwarding offers DG-trained specialists and approved packaging kits. Contact your local team for a compliance review before your first DG shipment.",
      ],
    },
    testId: "info-card-batteries",
  },
  {
    image: "/images/customs-world-illustration.jpg",
    eyebrow: "Customs",
    headline: "Customs Regulatory Updates",
    body: "Stay current on import and export regulations changes that affect international shipments.",
    cta: "View Latest Updates",
    action: {
      type: "modal",
      title: "Customs Regulatory Updates",
      icon: Globe,
      content: [
        "Customs requirements change frequently. Recent updates include new electronic export declaration formats, revised HS code classifications for electronics, and updated documentation standards for high-value shipments.",
        "All international shipments require a commercial invoice with HS codes, country of origin, and accurate declared value. Missing or incorrect data is the #1 cause of clearance delays.",
        "Use our Customs Documents tool inside MyDHL to generate compliant paperwork automatically — it's available the moment your account is active.",
      ],
    },
    testId: "info-card-customs",
  },
];

const InfoCardsRow = () => {
  const navigate = useNavigate();
  const { ref, visible } = useReveal(0);
  const [modal, setModal] = useState(null);

  const handle = (card) => {
    if (card.action.type === "route") navigate(card.action.to);
    else setModal(card.action);
  };

  return (
    <section id="info-cards" data-testid="info-cards-row" className="bg-[#F8F8F8] py-20 lg:py-28">
      <div ref={ref} className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div
          className={`text-center mb-12 lg:mb-16 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-dhl-red mb-3">
            Shipping Resources
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-dhl-ink tracking-tighter">
            Tips for Smarter Shipping
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CARDS.map((c, i) => (
            <article
              key={c.testId}
              data-testid={c.testId}
              className={`group bg-white border border-dhl-border overflow-hidden flex flex-col transition-all duration-700 hover:shadow-2xl hover:-translate-y-1 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${100 + i * 120}ms` }}
            >
              <div className="relative h-60 overflow-hidden">
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-7 flex flex-col flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-dhl-muted mb-3">
                  {c.eyebrow}
                </div>
                <h3 className="font-display text-xl lg:text-2xl font-black text-dhl-ink leading-tight mb-3 tracking-tight">
                  {c.headline}
                </h3>
                <p className="text-sm text-dhl-muted leading-[1.55] mb-6 flex-1">{c.body}</p>
                <button
                  type="button"
                  onClick={() => handle(c)}
                  data-testid={`${c.testId}-cta`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1976D2] hover:text-[#0D47A1] transition-colors group/cta self-start"
                >
                  {c.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          data-testid="info-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-dhl-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dhl-yellow/30 rounded-sm flex items-center justify-center">
                  <modal.icon className="w-5 h-5 text-dhl-ink" />
                </div>
                <h3 className="font-display text-xl font-black text-dhl-ink">{modal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                data-testid="info-modal-close"
                aria-label="Close"
                className="p-1.5 hover:bg-dhl-panel rounded-sm transition-colors"
              >
                <X className="w-5 h-5 text-dhl-muted" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              {modal.content.map((p, i) => (
                <p key={i} className="text-sm text-dhl-text leading-[1.65]">
                  {p}
                </p>
              ))}
              <div className="pt-3 text-[11px] text-dhl-muted italic">
                Demo build — this content is illustrative and not legally authoritative.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default InfoCardsRow;
