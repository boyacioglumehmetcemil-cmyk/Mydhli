import { Activity, Truck, Building2, Leaf, Check, MapPin, Clock } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const VisibilityIllustration = () => (
  <div className="bg-white border border-dhl-border p-6 lg:p-7">
    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted mb-4">
      Live Tracking · POM → SYD
    </div>
    {[
      { code: "OK", text: "Delivered — signed by O.", time: "14:32", current: true },
      { code: "WC", text: "Out for delivery in Sydney", time: "08:15" },
      { code: "AR", text: "Arrived at facility · Sydney", time: "Yesterday" },
      { code: "AF", text: "Departed Port Moresby", time: "2 days ago" },
    ].map((ev, i) => (
      <div key={i} className="flex items-start gap-3 py-2.5 border-b last:border-b-0 border-dhl-border">
        <div className={`w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 ${ev.current ? "bg-green-500" : "bg-dhl-ink"}`}>
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-dhl-text">{ev.text}</div>
          <div className="text-xs text-dhl-muted flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3" /> {ev.time}
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold text-dhl-muted bg-dhl-panel px-1.5 py-0.5">{ev.code}</span>
      </div>
    ))}
  </div>
);

const LeafIllustration = () => (
  <div className="bg-dhl-ink p-10 flex flex-col items-center text-center">
    <div className="w-24 h-24 rounded-full bg-dhl-yellow/20 flex items-center justify-center mb-4">
      <Leaf className="w-12 h-12 text-dhl-yellow" strokeWidth={1.5} />
    </div>
    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-dhl-yellow mb-2">GoGreen Plus</div>
    <div className="font-display text-3xl font-black text-white">Net-zero by 2050</div>
    <div className="text-sm text-white/60 mt-2">Sustainable aviation fuel · EV last-mile</div>
  </div>
);

const Block = ({ idx, eyebrow, title, body, side, visual }) => {
  const { ref, visible } = useReveal(0);
  const isLeftText = idx % 2 === 0;
  return (
    <div
      ref={ref}
      data-testid={`why-block-${idx}`}
      className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className={`${isLeftText ? "" : "lg:order-2"}`}>
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-dhl-red mb-3">{eyebrow}</div>
        <h3 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tight mb-5">
          {title}
        </h3>
        <p className="text-base text-dhl-muted leading-relaxed">{body}</p>
      </div>
      <div className={`${isLeftText ? "" : "lg:order-1"}`}>{visual}</div>
    </div>
  );
};

const WhyBlocks = () => {
  const blocks = [
    {
      eyebrow: "Visibility",
      title: "Real-time visibility on every leg.",
      body: "Every pickup, scan, customs clearance and delivery is timestamped and streamed to your dashboard. No more refreshing carrier websites.",
      visual: <VisibilityIllustration />,
    },
    {
      eyebrow: "Speed",
      title: "Door-to-door speed, end-to-end.",
      body: "From the moment your courier arrives to the signature on delivery, we measure every minute. Average POM → SYD: 16 hours door-to-door.",
      visual: (
        <div className="aspect-[4/3] overflow-hidden border border-dhl-border">
          <img src="/images/hero-courier.jpg" alt="" loading="lazy" className="w-full h-full object-cover" />
        </div>
      ),
    },
    {
      eyebrow: "Infrastructure",
      title: "Enterprise-grade infrastructure.",
      body: "650+ hubs, 270+ aircraft, automated sortation in every gateway. The same network that moves a vaccine batch moves your contract.",
      visual: (
        <div className="aspect-[4/3] overflow-hidden border border-dhl-border">
          <img src="/images/hero-warehouse.jpg" alt="" loading="lazy" className="w-full h-full object-cover" />
        </div>
      ),
    },
    {
      eyebrow: "Sustainability",
      title: "Sustainability built into every shipment.",
      body: "We're offsetting fuel, electrifying last-mile, and giving you reporting to back your own ESG claims. The right thing — and the right business move.",
      visual: <LeafIllustration />,
    },
  ];

  return (
    <section id="why" data-testid="why-blocks" className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-20 lg:space-y-28">
        {blocks.map((b, i) => (
          <Block key={i} idx={i} {...b} />
        ))}
      </div>
    </section>
  );
};

export default WhyBlocks;
