import { ArrowRight } from "lucide-react";

/**
 * Shared 2-column slide content: image left, white text panel right with eyebrow,
 * headline, sub, and yellow CTA button. Used inside both Gallery and SecondarySlider.
 *
 * Props:
 *  - slide: { image, alt, eyebrow?, headline, sub, ctaLabel, onCta }
 *  - compact: tighten typography for the smaller SecondarySlider
 */
const SlideContent = ({ slide, compact = false }) => {
  if (!slide) return null;
  const eyebrowCls = compact
    ? "text-[10px] tracking-[0.28em] mb-2"
    : "text-[11px] tracking-[0.3em] mb-3";
  const headlineCls = compact
    ? "text-2xl md:text-3xl lg:text-[2rem]"
    : "text-3xl md:text-4xl lg:text-[2.5rem]";
  const subCls = compact ? "text-sm" : "text-sm md:text-base";
  const ctaCls = compact ? "h-10 px-5 text-[11px]" : "h-11 px-6 text-xs";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-full">
      {/* Image side */}
      <div className="relative h-56 md:h-full bg-[#F4F4F4] overflow-hidden">
        <img
          src={slide.image}
          alt={slide.alt || ""}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Text side */}
      <div className="bg-white flex flex-col justify-center px-6 py-7 md:px-10 md:py-10">
        {slide.eyebrow && (
          <div
            className={`font-bold uppercase text-dhl-red ${eyebrowCls}`}
          >
            {slide.eyebrow}
          </div>
        )}
        <h3
          className={`font-display font-black text-dhl-ink leading-[1.05] tracking-tighter mb-3 ${headlineCls}`}
        >
          {slide.headline}
        </h3>
        <p className={`text-dhl-muted leading-[1.6] mb-6 ${subCls}`}>{slide.sub}</p>
        <button
          type="button"
          onClick={slide.onCta}
          className={`inline-flex items-center gap-2 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold uppercase tracking-wider rounded-sm transition-all hover:-translate-y-0.5 shadow-sm self-start ${ctaCls}`}
        >
          {slide.ctaLabel} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SlideContent;
