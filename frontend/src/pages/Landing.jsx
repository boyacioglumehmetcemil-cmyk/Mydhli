import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plane, Ship, Truck, Search, ArrowRight, Eye, ClipboardList, FileText, Leaf,
  ShieldCheck, BadgeCheck, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandWordmark from "@/components/BrandWordmark";
import BrandClaim from "@/components/BrandClaim";
import useTitle from "@/hooks/useTitle";

/* -------------------------------------------------------------------------- */
/* Top utility + nav bar                                                       */
/* -------------------------------------------------------------------------- */
const TopBar = () => (
  <header
    data-testid="landing-topbar"
    className="sticky top-0 z-40 bg-white border-b border-dhl-border"
  >
    <div className="bg-dhl-ink text-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-9 flex items-center justify-between text-[11px]">
        <span className="font-mono uppercase tracking-[0.18em] text-dhl-yellow">
          Pitch demo · myDHLi
        </span>
        <span className="text-white/70 hidden sm:inline">
          Need a quote? Call <b className="text-white">+675 7000 0000</b>
        </span>
      </div>
    </div>
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">
      <div className="flex items-center gap-10">
        <BrandWordmark to="/" variant="default" />
        <nav className="hidden lg:flex items-center gap-7 text-[13px] font-semibold text-dhl-text">
          <a href="#freight" className="hover:text-dhl-red">Freight Modes</a>
          <a href="#why" className="hover:text-dhl-red">Why myDHLi</a>
          <a href="#network" className="hover:text-dhl-red">PNG Network</a>
          <a href="#trust" className="hover:text-dhl-red">Compliance</a>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/track"
          data-testid="topbar-track"
          className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-dhl-text hover:text-dhl-red px-3 h-9"
        >
          <Search className="w-4 h-4" /> Track
        </Link>
        <Link
          to="/login"
          data-testid="topbar-signin"
          className="inline-flex items-center h-10 px-4 text-[12px] font-bold uppercase tracking-wider text-dhl-text border border-dhl-ink hover:bg-dhl-panel"
        >
          Sign in to myDHLi
        </Link>
        <Link
          to="/register"
          data-testid="topbar-register"
          className="hidden sm:inline-flex items-center h-10 px-4 text-[12px] font-bold uppercase tracking-wider bg-dhl-yellow text-dhl-ink border-2 border-dhl-ink hover:bg-dhl-yellow-dark"
        >
          Open an account
        </Link>
      </div>
    </div>
  </header>
);

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */
const Hero = () => {
  const navigate = useNavigate();
  const [awb, setAwb] = useState("");
  const onTrack = (e) => {
    e?.preventDefault?.();
    const v = awb.trim().toUpperCase();
    if (!v) return toast.error("Enter a tracking reference (HAWB / MAWB / BL)");
    navigate(`/track?awb=${encodeURIComponent(v)}`);
  };
  return (
    <section
      data-testid="landing-hero"
      className="relative bg-dhl-ink text-white overflow-hidden"
    >
      {/* subtle grain backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(#FFCC00 1px, transparent 1px), radial-gradient(#D40511 1px, transparent 1px)",
          backgroundSize: "32px 32px, 64px 64px",
          backgroundPosition: "0 0, 16px 16px",
        }}
      />
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-28 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-dhl-yellow mb-5">
            <span className="w-8 h-px bg-dhl-yellow" />
            Freight forwarding · PNG
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] font-bold leading-[0.95] tracking-tight mb-6">
            Move freight smarter, <br className="hidden sm:inline" />
            <span className="text-dhl-yellow">everywhere.</span>
          </h1>
          <p className="text-base lg:text-lg text-white/75 leading-relaxed max-w-[560px] mb-8">
            Air, ocean and road freight forwarding for shippers who carry liability.
            End-to-end visibility, customs-cleared shipments, and a single portal —
            myDHLi — to quote, book and watch every leg of the journey.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              data-testid="hero-signin"
              className="inline-flex items-center gap-2 h-12 px-6 bg-dhl-yellow text-dhl-ink border-2 border-dhl-yellow font-bold uppercase tracking-wider text-[12px] hover:bg-white"
            >
              Sign in to myDHLi <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              data-testid="hero-register"
              className="inline-flex items-center gap-2 h-12 px-6 border-2 border-white/40 text-white font-bold uppercase tracking-wider text-[12px] hover:border-white"
            >
              Open an account
            </Link>
          </div>
        </div>
        {/* Track widget — distinct yellow card, asymmetric position */}
        <form
          onSubmit={onTrack}
          data-testid="hero-track-widget"
          className="bg-dhl-yellow text-dhl-ink p-6 lg:p-7 border-2 border-dhl-yellow shadow-[10px_10px_0px_0px_#D40511]"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-dhl-red mb-3">
            Track a freight shipment
          </div>
          <div className="font-display text-2xl font-black leading-tight mb-5">
            HAWB · MAWB · Booking ref · Container No.
          </div>
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-2">
            Reference number
          </label>
          <Input
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            data-testid="hero-track-input"
            placeholder="e.g. DHL1234567890"
            className="h-12 bg-white border-2 border-dhl-ink rounded-none font-mono text-base"
          />
          <Button
            type="submit"
            data-testid="hero-track-submit"
            className="mt-4 w-full h-12 bg-dhl-ink text-white hover:bg-dhl-red rounded-none font-bold uppercase tracking-wider text-[12px]"
          >
            Track shipment <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="text-[11px] mt-3 text-dhl-ink/70">
            Public tracking is available without sign-in for compliance.
          </div>
        </form>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Freight modes strip                                                         */
/* -------------------------------------------------------------------------- */
const MODES = [
  {
    key: "air",
    icon: Plane,
    name: "Air freight",
    line: "Time-critical, HAWB tracked, dangerous goods capable",
    bullets: ["Priority + Economy", "Charter on request", "Cool chain available"],
    accent: "bg-dhl-yellow",
  },
  {
    key: "ocean",
    icon: Ship,
    name: "Ocean freight",
    line: "FCL & LCL with weekly sailings between major hubs",
    bullets: ["20'/40'/HC containers", "Reefer & special equipment", "Door + port options"],
    accent: "bg-dhl-red text-white",
  },
  {
    key: "road",
    icon: Truck,
    name: "Road freight",
    line: "Cross-border long-haul + project cargo",
    bullets: ["Europe, GCC, ASEAN, ANZ", "Mining + oil & gas projects", "Multi-modal feeders"],
    accent: "bg-dhl-ink text-dhl-yellow",
  },
];

const FreightModes = ({ onSelect }) => (
  <section id="freight" data-testid="landing-modes" className="bg-white py-16 lg:py-24">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
      <div className="mb-12 max-w-2xl">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-dhl-red mb-3">
          Freight modes
        </div>
        <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tight text-dhl-text mb-3">
          One portal. Every leg. Pick the mode.
        </h2>
        <p className="text-dhl-muted">
          Book and watch your freight through myDHLi — whether it flies, sails
          or rolls.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {MODES.map((m, i) => (
          <button
            type="button"
            key={m.key}
            data-testid={`mode-card-${m.key}`}
            onClick={() => onSelect(m)}
            className="group text-left bg-white border-2 border-dhl-border p-8 hover:-translate-y-1 hover:border-dhl-ink hover:shadow-[10px_10px_0px_0px_#FFCC00] transition-all"
          >
            <div className={`w-14 h-14 flex items-center justify-center ${m.accent} mb-7`}>
              <m.icon className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-dhl-muted mb-2">
              Mode {String(i + 1).padStart(2, "0")}
            </div>
            <h3 className="font-display text-2xl font-black text-dhl-text mb-2">
              {m.name}
            </h3>
            <p className="text-sm text-dhl-muted mb-5">{m.line}</p>
            <ul className="space-y-2 mb-6">
              {m.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-[13px] text-dhl-text">
                  <span className="w-1.5 h-1.5 bg-dhl-red" />
                  {b}
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-dhl-red">
              Explore <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </button>
        ))}
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Why myDHLi                                                                  */
/* -------------------------------------------------------------------------- */
const WHY = [
  { icon: Eye, t: "End-to-end visibility", d: "Every milestone — origin pickup to final POD — in one timeline." },
  { icon: ClipboardList, t: "Online quote & booking", d: "Rate, compare and book air or ocean freight without an email chain." },
  { icon: FileText, t: "Documents on demand", d: "HAWBs, BLs, COOs, packing lists, invoices — generated and stored per shipment." },
  { icon: Leaf, t: "Sustainability insight", d: "Per-shipment CO₂e estimates so procurement teams can report Scope 3." },
];

const Why = () => (
  <section id="why" data-testid="landing-why" className="bg-dhl-panel py-16 lg:py-24">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-[1.1fr_2fr] gap-10 lg:gap-16">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-dhl-red mb-3">
            Why myDHLi
          </div>
          <h2 className="font-display text-3xl lg:text-5xl font-black tracking-tight text-dhl-text leading-[0.98]">
            A portal built for shippers who carry liability.
          </h2>
          <p className="text-dhl-muted mt-4 leading-relaxed">
            myDHLi is the single online workspace for freight forwarding
            customers — quote, book, track and pay without picking up the
            phone. Global shippers use it daily for cross-border supply chains.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {WHY.map((w) => (
            <div
              key={w.t}
              data-testid={`why-card-${w.t.toLowerCase().split(" ")[0]}`}
              className="bg-white border border-dhl-border p-6 hover:border-dhl-yellow transition-colors"
            >
              <div className="w-10 h-10 bg-dhl-yellow flex items-center justify-center mb-5">
                <w.icon className="w-5 h-5 text-dhl-ink" strokeWidth={2} />
              </div>
              <div className="font-display font-black text-dhl-text text-lg mb-1.5">{w.t}</div>
              <p className="text-[13px] text-dhl-muted leading-relaxed">{w.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Stats / PNG network strip                                                   */
/* -------------------------------------------------------------------------- */
const STATS = [
  { v: "120k+", l: "Tonnes freight moved monthly" },
  { v: "8,200", l: "Active container bookings" },
  { v: "220+",  l: "Origin / destination countries" },
  { v: "60+",   l: "Trade lanes, weekly sailings" },
];

const Stats = () => (
  <section id="network" data-testid="landing-stats" className="bg-dhl-yellow text-dhl-ink">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-14 lg:py-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 lg:gap-x-12">
        {STATS.map((s, i) => (
          <div
            key={s.l}
            data-testid={`stat-${i}`}
            className="border-l-4 border-dhl-ink pl-4"
          >
            <div className="font-display text-4xl lg:text-5xl font-black leading-none tabular-nums">
              {s.v}
            </div>
            <div className="mt-3 text-[12px] font-bold uppercase tracking-wider text-dhl-ink/80">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Trust strip (compliance badges)                                             */
/* -------------------------------------------------------------------------- */
// TODO(brand): replace placeholders with the official certificate set DHL
// Global Forwarding supplies (logos + valid-through dates).
const BADGES = [
  { label: "IATA", sub: "Cargo agent" },
  { label: "FIATA", sub: "Member forwarder" },
  { label: "AEO", sub: "Authorised operator" },
  { label: "ISO 9001", sub: "Quality" },
  { label: "C-TPAT", sub: "Supply-chain security" },
];

const Trust = () => (
  <section id="trust" data-testid="landing-trust" className="bg-white py-14 border-y border-dhl-border">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
      <div className="flex items-center gap-3 mb-7">
        <ShieldCheck className="w-4 h-4 text-dhl-red" />
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-dhl-muted">
          Compliance & accreditation
        </div>
      </div>
      <div className="flex flex-wrap gap-3 lg:gap-4">
        {BADGES.map((b) => (
          <div
            key={b.label}
            data-testid={`trust-badge-${b.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="inline-flex items-center gap-3 px-4 py-2.5 border border-dhl-border bg-dhl-panel"
          >
            <BadgeCheck className="w-4 h-4 text-dhl-red" />
            <div className="leading-tight">
              <div className="font-display font-black text-dhl-text text-sm">{b.label}</div>
              <div className="text-[10px] text-dhl-muted uppercase tracking-wider">{b.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */
const Footer = () => (
  <footer data-testid="landing-footer" className="bg-dhl-ink text-white/80">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-14 grid grid-cols-2 lg:grid-cols-5 gap-10">
      <div className="col-span-2">
        <BrandWordmark to={null} theme="dark" variant="stack" />
        <p className="text-[13px] text-white/60 mt-5 leading-relaxed max-w-sm">
          DHL Global Forwarding — air, ocean and road freight, customs and
          logistics for global trade. Demo build.
        </p>
        <div className="mt-5">
          <BrandClaim variant="normal" className="opacity-90" />
        </div>
      </div>
      {[
        { h: "Freight", l: ["Air freight", "Ocean freight", "Road freight", "Project cargo"] },
        { h: "Services", l: ["Customs brokerage", "Insurance", "Warehousing", "Sustainability"] },
        { h: "Company", l: ["About PNG", "Careers", "Press", "Compliance"] },
      ].map((c) => (
        <div key={c.h}>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-yellow mb-4">
            {c.h}
          </div>
          <ul className="space-y-2.5 text-[13px]">
            {c.l.map((x) => (
              <li key={x}>
                <a href="#" className="text-white/70 hover:text-white">
                  {x}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-white/10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[11px] text-white/45">
        <div>
          {/* TODO(brand): swap with real legal entity once DHL provides registration data. */}
          © 2026 DHL Global Forwarding — All rights reserved.
        </div>
        <div className="font-mono uppercase tracking-wider">
          Demo build · Not affiliated with Deutsche Post DHL Group · myDHLi placeholder
        </div>
      </div>
    </div>
  </footer>
);

/* -------------------------------------------------------------------------- */
/* Coming-soon modal (for mode cards & TODO links)                             */
/* -------------------------------------------------------------------------- */
const ComingSoonModal = ({ mode, onClose }) =>
  mode && (
    <div
      data-testid="landing-coming-soon-modal"
      onClick={onClose}
      className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-md w-full p-7 border-2 border-dhl-ink">
        <div className="flex items-start justify-between mb-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-dhl-red">
            Coming next phase
          </div>
          <button onClick={onClose} className="p-1 hover:bg-dhl-panel">
            <X className="w-4 h-4 text-dhl-muted" />
          </button>
        </div>
        <h3 className="font-display text-2xl font-black text-dhl-text mb-3">
          {mode.name} booking
        </h3>
        <p className="text-sm text-dhl-muted mb-5">
          Quote and book {mode.name.toLowerCase()} directly from myDHLi. We're
          wiring this up in the next sprint — meanwhile, sign in to track any
          existing reference.
        </p>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="flex-1 h-11 inline-flex items-center justify-center bg-dhl-yellow text-dhl-ink border-2 border-dhl-ink font-bold uppercase tracking-wider text-[12px] hover:bg-dhl-yellow-dark"
          >
            Sign in
          </Link>
          <button
            onClick={onClose}
            className="flex-1 h-11 inline-flex items-center justify-center border-2 border-dhl-ink text-dhl-ink font-bold uppercase tracking-wider text-[12px] hover:bg-dhl-panel"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */
const Landing = () => {
  useTitle("Freight forwarding for PNG");
  const [comingMode, setComingMode] = useState(null);
  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      <TopBar />
      <main>
        <Hero />
        <FreightModes onSelect={setComingMode} />
        <Why />
        <Stats />
        <Trust />
      </main>
      <Footer />
      <ComingSoonModal mode={comingMode} onClose={() => setComingMode(null)} />
    </div>
  );
};

export default Landing;
