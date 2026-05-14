import { Link } from "react-router-dom";
import { ArrowLeft, Plane, Ship, Truck, ClipboardList, Leaf, Building2 } from "lucide-react";
import BrandWordmark from "@/components/BrandWordmark";
import BrandImagePlaceholder from "@/components/BrandImagePlaceholder";
import useTitle from "@/hooks/useTitle";

/**
 * Solutions stub — landed from the public navbar "Solutions" dropdown. A
 * proper marketing tree (industries × service modes × compliance) lands in a
 * later phase; for now this is a clean placeholder so the link doesn't 404.
 */
const TILES = [
  { Icon: Plane,         title: "Air freight",       sub: "Priority + economy with HAWB/MAWB tracking." },
  { Icon: Ship,          title: "Ocean freight",     sub: "FCL & LCL across major trade lanes." },
  { Icon: Truck,         title: "Road freight",      sub: "Long-haul and cross-border milk-runs." },
  { Icon: ClipboardList, title: "Customs clearance", sub: "HBL, AWB, certificates and broker handovers." },
  { Icon: Leaf,          title: "Sustainability",    sub: "Per-shipment CO₂e on every booking." },
  { Icon: Building2,     title: "Industries",        sub: "Mining, retail, pharma, automotive." },
];

const Solutions = () => {
  useTitle("Solutions");
  return (
    <div className="min-h-screen bg-white" data-testid="solutions-page">
      <div className="bg-dhl-yellow border-b border-dhl-yellow-dark">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-14 flex items-center">
          <BrandWordmark to="/" variant="default" />
        </div>
      </div>
      <main className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <Link to="/" data-testid="solutions-back" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dhl-muted hover:text-dhl-red mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-3">Solutions</div>
        <h1 className="font-display font-bold text-dhl-text leading-tight tracking-tight mb-4 text-[32px] lg:text-[48px]">
          A solution for every freight need.
        </h1>
        <p className="text-dhl-muted max-w-2xl mb-12 text-[15px] lg:text-base leading-relaxed">
          Our forwarding teams design networks that match how your supply chain actually runs — by mode, by lane, by industry, and by the compliance bar you have to clear.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {TILES.map((t) => (
            <div key={t.title} data-testid={`solution-${t.title.toLowerCase().split(" ")[0]}`}
              className="bg-white border border-dhl-border rounded-xl p-6 hover:shadow-md hover:border-dhl-yellow transition-all">
              <div className="w-11 h-11 bg-dhl-red/10 rounded-md flex items-center justify-center mb-4">
                <t.Icon className="w-5 h-5 text-dhl-red" strokeWidth={2} />
              </div>
              <h3 className="font-display font-bold text-dhl-text text-lg mb-2">{t.title}</h3>
              <p className="text-[13px] text-dhl-muted leading-relaxed">{t.sub}</p>
            </div>
          ))}
        </div>
        <BrandImagePlaceholder variant="navy" iconAlign="center" iconSize={320}
          className="mt-14 lg:mt-20 aspect-[16/5] rounded-xl border border-dhl-border" testId="solutions-band" />
      </main>
    </div>
  );
};

export default Solutions;
