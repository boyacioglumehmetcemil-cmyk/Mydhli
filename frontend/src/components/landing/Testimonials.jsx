import { Quote } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const items = [
  {
    quote: "Our trade across Oceania doubled after switching to DHL Express. The visibility alone is worth it.",
    name: "Aaron Levi",
    role: "Operations Director",
    industry: "Mining Sector",
    initials: "AL",
  },
  {
    quote: "We ship medical samples to Singapore weekly. Zero delays in 18 months.",
    name: "Dr. Mira Santos",
    role: "Lab Manager",
    industry: "Healthcare",
    initials: "MS",
  },
  {
    quote: "The customer portal is the cleanest in the industry. My team onboarded in a day.",
    name: "Joseph Tani",
    role: "Head of Logistics",
    industry: "Retail",
    initials: "JT",
  },
];

const Card = ({ t, idx }) => {
  const { ref, visible } = useReveal(idx * 100);
  return (
    <article
      ref={ref}
      data-testid={`testimonial-${idx}`}
      className={`bg-white/5 backdrop-blur-sm border border-white/10 p-8 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <Quote className="w-10 h-10 text-dhl-yellow mb-5" strokeWidth={1.5} />
      <p className="text-lg text-white italic leading-relaxed mb-8 font-display">
        "{t.quote}"
      </p>
      <div className="flex items-center gap-3 pt-5 border-t border-white/10">
        <div className="w-11 h-11 bg-dhl-yellow text-dhl-ink rounded-full flex items-center justify-center font-bold">
          {t.initials}
        </div>
        <div>
          <div className="text-sm font-bold text-white">{t.name}</div>
          <div className="text-xs text-white/60">{t.role} · {t.industry}</div>
        </div>
      </div>
    </article>
  );
};

const Testimonials = () => {
  return (
    <section data-testid="testimonials" className="bg-dhl-ink py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-14">
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-dhl-yellow mb-3">
            What customers say
          </div>
          <h2 className="font-display text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            Built for businesses that ship every day.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <Card key={i} t={t} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
