import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import SectionEyebrow from "./SectionEyebrow";

/**
 * Reusable card-row section.
 * Props:
 *  - id: anchor id
 *  - testId: root testid
 *  - eyebrow: small label
 *  - title: H2 text
 *  - cards: array of { testId, image, eyebrow?, headline, body, cta, action: {type:'route'|'modal', to?, title?, icon?, content?[] } }
 *  - background: "white" | "panel" — light gray
 */
const InfoCardsSection = ({ id, testId, eyebrow, title, cards, background = "panel" }) => {
  const navigate = useNavigate();
  const { ref, visible } = useReveal(0);
  const [modal, setModal] = useState(null);

  const bgClass = background === "white" ? "bg-white" : "bg-[#FAFAFA]";

  const handle = (card) => {
    if (card.action.type === "route") navigate(card.action.to);
    else setModal(card.action);
  };

  return (
    <section id={id} data-testid={testId} className={`${bgClass} pt-12 lg:pt-[60px] pb-12 lg:pb-[60px]`}>
      <div ref={ref} className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div
          className={`mb-12 lg:mb-16 max-w-[720px] transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {eyebrow && <SectionEyebrow className="mb-4">{eyebrow}</SectionEyebrow>}
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-dhl-ink tracking-tighter leading-[1.05]">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((c, i) => (
            <article
              key={c.testId}
              data-testid={c.testId}
              className={`group bg-white border border-dhl-border overflow-hidden flex flex-col transition-all duration-[250ms] ease-out hover:shadow-2xl hover:-translate-y-1 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: visible ? `${100 + i * 120}ms` : "0ms" }}
            >
              <div className="relative h-60 overflow-hidden bg-[linear-gradient(110deg,#f0f0f0_25%,#fafafa_50%,#f0f0f0_75%)] bg-[length:200%_100%] animate-[shimmer_2s_infinite]">
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  className="relative w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onLoad={(e) => e.currentTarget.parentElement.classList.remove("animate-[shimmer_2s_infinite]")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-7 flex flex-col flex-1">
                {c.eyebrow && (
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-dhl-muted mb-3">
                    {c.eyebrow}
                  </div>
                )}
                <h3 className="font-display text-xl lg:text-2xl font-black text-dhl-ink leading-tight mb-3 tracking-tight">
                  {c.headline}
                </h3>
                <p className="text-sm text-dhl-muted leading-[1.6] mb-6 flex-1">{c.body}</p>
                <button
                  type="button"
                  onClick={() => handle(c)}
                  data-testid={`${c.testId}-cta`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1976D2] hover:text-[#0D47A1] transition-colors group/cta self-start"
                >
                  {c.cta}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-[250ms] ease-out group-hover/cta:translate-x-1"
                  >
                    →
                  </span>
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
                {modal.icon && (
                  <div className="w-10 h-10 bg-dhl-yellow/30 rounded-sm flex items-center justify-center">
                    <modal.icon className="w-5 h-5 text-dhl-ink" />
                  </div>
                )}
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

export default InfoCardsSection;
