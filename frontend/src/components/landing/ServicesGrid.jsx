import { Plane, Truck, Briefcase, ArrowRight, CheckCircle2 } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const services = [
  {
    icon: Plane,
    title: "Express International",
    image: "/images/hero-cargo-plane.jpg",
    bullets: ["Next-day to major hubs", "Time-definite delivery", "Customs cleared"],
  },
  {
    icon: Truck,
    title: "Domestic & Regional",
    image: "/images/hero-warehouse.jpg",
    bullets: ["Same-day & next-day", "Door-to-door", "SMS notifications"],
  },
  {
    icon: Briefcase,
    title: "Enterprise Solutions",
    image: "/images/hero-courier.jpg",
    bullets: ["Dedicated account manager", "API integrations", "Custom contracts"],
  },
];

const Card = ({ service, delay }) => {
  const Icon = service.icon;
  const { ref, visible } = useReveal(delay);
  return (
    <article
      ref={ref}
      data-testid={`service-card-${service.title.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`}
      className={`group bg-white border border-dhl-border transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } hover:-translate-y-2 hover:shadow-xl`}
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={service.image}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-7">
        <Icon className="w-9 h-9 text-dhl-red mb-5" strokeWidth={1.75} />
        <h3 className="font-display text-xl font-bold text-dhl-text mb-4">{service.title}</h3>
        <ul className="space-y-2 mb-6">
          {service.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-dhl-muted">
              <CheckCircle2 className="w-4 h-4 text-dhl-yellow mt-0.5 shrink-0" strokeWidth={2} />
              {b}
            </li>
          ))}
        </ul>
        <a
          href="#cta"
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-dhl-red hover:underline"
        >
          Learn more <ArrowRight className="w-3 h-3 ml-1" />
        </a>
      </div>
    </article>
  );
};

const ServicesGrid = () => {
  return (
    <section id="services" data-testid="services-grid" className="bg-dhl-panel py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="mb-14 max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-red mb-3">
            Services
          </div>
          <h2 className="font-display text-3xl lg:text-5xl font-black text-dhl-text leading-tight tracking-tight">
            Built for every kind of shipment.
          </h2>
          <p className="text-base text-dhl-muted mt-5">
            From a contract that needs to be in Singapore tomorrow morning, to a quarterly pallet
            order across the Pacific — we tune the network to your timetable.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {services.map((s, idx) => (
            <Card key={s.title} service={s} delay={idx * 120} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;
