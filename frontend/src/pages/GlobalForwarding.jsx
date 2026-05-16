/**
 * GlobalForwarding — public marketing page for the Global Forwarding
 * division surface. Renders at `/global-forwarding`.
 *
 * Composition (top → bottom):
 *   1. Custom utility bar (uses the new GF lockup PNG instead of the
 *      standard BrandWordmark — the lockup already bakes "Global Forwarding"
 *      into the artwork)
 *   2. Shared NavBar / MobileDrawer / SearchModal (imported from Landing)
 *   3. Hero with full-bleed cargo-ship photo + brand watermark stamp
 *      bottom-right
 *   4. Three freight-mode cards
 *   5. Industry expertise grid (6 sectors)
 *   6. "Why work with us" pillars (4 columns)
 *   7. myDHLi platform callout (dark band)
 *   8. Sustainability strip
 *   9. Insights / trade news (3 cards)
 *  10. Final yellow CTA band
 *  11. Shared Footer (4-tier light theme)
 *
 * All marketing copy is original — wording matches the spec brief verbatim
 * and is NOT paraphrased from DHL's public marketing site.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Car,
  Check,
  Cpu,
  HeartPulse,
  Lock,
  MapPin,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Ship,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { Footer, MobileDrawer, NavBar, SearchModal } from "@/pages/Landing";
import BrandWordmark from "@/components/BrandWordmark";
import CountryPicker from "@/components/CountryPicker";
import useTitle from "@/hooks/useTitle";

const LOCKUP_SRC = "/assets/dhl/brand/dhl-global-forwarding-lockup.png";

const URLS = {
  air:    "https://www.dhl.com/global-en/home/our-divisions/global-forwarding/air-freight.html",
  ocean:  "https://www.dhl.com/global-en/home/our-divisions/global-forwarding/ocean-freight.html",
  road:   "https://www.dhl.com/global-en/home/our-divisions/global-forwarding/road-freight.html",
  sustainability: "https://www.dhl.com/global-en/home/sustainability.html",
  insights: "https://www.dhl.com/global-en/home/insights-and-innovation/insights.html",
};

/* ─────────────── Section 1 — custom GF utility bar ─────────────── */
// Local mini-component instead of editing the shared <UtilityBar />.
// Mirrors its layout but swaps the wordmark for the GF lockup PNG, which
// already carries "Global Forwarding" baked into the artwork.
const GFUtilityBar = ({ onSearch }) => (
  <div className="bg-dhl-yellow border-b border-dhl-yellow-dark" data-testid="utility-bar">
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between gap-4">
      <Link to="/" className="inline-flex items-center" data-testid="gf-header-lockup-link">
        <img
          src={LOCKUP_SRC}
          alt="DHL Global Forwarding"
          loading="eager"
          data-testid="gf-header-lockup"
          className="h-8 lg:h-10 w-auto"
        />
      </Link>
      <nav className="hidden md:flex items-center gap-4 text-[13px] text-dhl-ink/85">
        <Link to="/locations" className="hover:text-dhl-red inline-flex items-center gap-1.5">
          Find a service point
        </Link>
        <button type="button" onClick={onSearch} className="hover:text-dhl-red">
          Search
        </button>
        <CountryPicker />
      </nav>
    </div>
  </div>
);

/* ─────────────── Helpers ─────────────── */
const Eyebrow = ({ children }) => (
  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-4">
    {children}
  </div>
);

/* ─────────────── Hero ─────────────── */
const Hero = () => (
  <section
    data-testid="gf-hero"
    className="relative h-[70vh] min-h-[520px] bg-cover bg-center"
    style={{ backgroundImage: "url('/hero-delivery.png')" }}
  >
    {/* Dark bottom-up gradient so the headline holds against busy photo. */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

    <div className="relative max-w-[1100px] mx-auto px-6 lg:px-10 h-full flex flex-col justify-center text-white">
      <Eyebrow>GLOBAL FORWARDING</Eyebrow>
      <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-5 max-w-3xl [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]">
        Move freight with global reach and local precision.
      </h1>
      <p className="text-base lg:text-lg text-white/90 max-w-2xl mb-8 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
        Air, ocean and road freight forwarding backed by a worldwide network.
        Quote, book, document and track every leg from a single portal.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/dashboard/quote"
          data-testid="gf-hero-cta-quote"
          className="inline-flex items-center gap-2 h-12 px-7 bg-dhl-red hover:bg-dhl-red-dark text-white font-bold text-sm rounded-md transition-colors"
        >
          Get a freight quote <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/login"
          data-testid="gf-hero-cta-signin"
          className="inline-flex items-center gap-2 h-12 px-7 border-2 border-white text-white hover:bg-white hover:text-dhl-ink font-bold text-sm rounded-md transition-colors"
        >
          Sign in to myDHLi
        </Link>
      </div>
    </div>

    {/* Brand watermark stamp — sits bottom-right of the hero photo at
        ~70% opacity. Reads as a brand signature without competing with
        the H1 typography. */}
    <img
      src={LOCKUP_SRC}
      alt="DHL Global Forwarding"
      data-testid="gf-hero-brand-stamp"
      className="absolute bottom-6 right-6 opacity-70 max-w-[160px] lg:max-w-[220px] w-auto pointer-events-none select-none"
    />
  </section>
);

/* ─────────────── Section: three freight modes ─────────────── */
const MODE_CARDS = [
  {
    key: "AIR",
    icon: Plane,
    title: "Air freight",
    body: "Time-critical and high-value cargo on the world's largest air freight network.",
    image: "/assets/dhl/air-freight-photo.png",
    quoteHref: "/dashboard/quote?mode=AIR",
    exploreHref: URLS.air,
  },
  {
    key: "OCEAN",
    icon: Ship,
    title: "Ocean freight",
    body: "FCL, LCL and project cargo with competitive transit on every ocean corridor.",
    image: "/assets/dhl/ocean-freight-photo.png",
    quoteHref: "/dashboard/quote?mode=OCEAN",
    exploreHref: URLS.ocean,
  },
  {
    key: "ROAD",
    icon: Truck,
    title: "Road freight",
    body: "Cross-border road haulage with cross-dock and milk-run options across the region.",
    image: "/assets/dhl/road-freight-photo.png",
    quoteHref: "/dashboard/quote?mode=ROAD",
    exploreHref: URLS.road,
  },
];

const FreightModes = () => (
  <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20" data-testid="gf-modes">
    <Eyebrow>OUR MODES</Eyebrow>
    <h2 className="font-display font-bold text-3xl lg:text-4xl text-dhl-ink mb-2">
      One forwarder for every freight reference.
    </h2>
    <p className="text-sm text-stone-600 mb-10 max-w-2xl">
      Pick the mode that fits your cargo, lead time and budget — same portal, same tracking surface.
    </p>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {MODE_CARDS.map((m) => {
        const Icon = m.icon;
        const modeLabel = m.title.toLowerCase();
        return (
          <article
            key={m.key}
            data-testid={`gf-mode-card-${m.key.toLowerCase()}`}
            className="bg-white border border-stone-200 rounded-lg overflow-hidden flex flex-col"
          >
            <div
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url('${m.image}')` }}
            />
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-dhl-red" />
                <h3 className="font-display text-xl font-bold text-dhl-ink">{m.title}</h3>
              </div>
              <p className="text-sm text-stone-600 mb-5 flex-1">{m.body}</p>
              <div className="flex flex-col gap-2">
                <Link
                  to={m.quoteHref}
                  data-testid={`gf-mode-${m.key.toLowerCase()}-quote`}
                  className="text-sm font-bold text-dhl-red hover:text-dhl-red-dark inline-flex items-center gap-1"
                >
                  Get a {modeLabel} quote <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href={m.exploreHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`gf-mode-${m.key.toLowerCase()}-explore`}
                  className="text-sm font-bold text-dhl-ink hover:text-dhl-red inline-flex items-center gap-1"
                >
                  Explore {modeLabel} <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

/* ─────────────── Section: industry sectors ─────────────── */
const SECTORS = [
  { icon: Car,         title: "Auto-mobility",                       body: "Inbound, outbound and aftermarket logistics for OEMs and Tier-1 suppliers." },
  { icon: Zap,         title: "Energy",                              body: "Heavy lift, project cargo and renewables for oil, gas and clean energy." },
  { icon: Wrench,      title: "Engineering & manufacturing",         body: "Project cargo and just-in-time inbound for industrial production." },
  { icon: HeartPulse,  title: "Life sciences & healthcare",          body: "Temperature-controlled, GxP-aligned forwarding for pharma and devices." },
  { icon: ShoppingBag, title: "Retail & fashion",                    body: "Peak-season air-ocean balance for omnichannel retail." },
  { icon: Cpu,         title: "Technology",                          body: "High-value, high-velocity flows for semiconductors and consumer electronics." },
];

const IndustrySectors = () => (
  <section className="bg-stone-50 border-y border-stone-200" data-testid="gf-sectors">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20">
      <Eyebrow>INDUSTRY EXPERTISE</Eyebrow>
      <h2 className="font-display font-bold text-3xl lg:text-4xl text-dhl-ink mb-10">
        Specialists in your sector.
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {SECTORS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="flex flex-col items-start gap-3">
              <Icon className="text-dhl-red" style={{ width: 44, height: 44 }} />
              <h3 className="font-bold text-sm text-dhl-ink leading-tight">{s.title}</h3>
              <p className="text-xs text-stone-500 leading-snug">{s.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

/* ─────────────── Section: 4 pillars ─────────────── */
const PILLARS = [
  { icon: MapPin,      title: "End-to-end control", body: "One platform, one record, every milestone documented." },
  { icon: Zap,         title: "Speed at every leg", body: "Pre-cleared customs and pre-allocated capacity reduce dwell." },
  { icon: Activity,    title: "Live visibility",    body: "Event-by-event tracking with proactive ETA shifts." },
  { icon: ShieldCheck, title: "Compliance first",   body: "Trade compliance, screening and documentation built in." },
];

const Pillars = () => (
  <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20" data-testid="gf-pillars">
    <Eyebrow>WHY WORK WITH US</Eyebrow>
    <h2 className="font-display font-bold text-3xl lg:text-4xl text-dhl-ink mb-10">
      Four reasons buyers stay with us.
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {PILLARS.map((p, i) => {
        const Icon = p.icon;
        return (
          <div key={p.title} className="flex flex-col items-start gap-3">
            <div className="text-stone-300 font-display font-bold text-5xl leading-none">
              0{i + 1}
            </div>
            <Icon className="w-7 h-7 text-dhl-red" />
            <h3 className="font-bold text-lg text-dhl-ink">{p.title}</h3>
            <p className="text-sm text-stone-600">{p.body}</p>
          </div>
        );
      })}
    </div>
  </section>
);

/* ─────────────── Section: myDHLi platform callout ─────────────── */
const PlatformCallout = () => (
  <section className="bg-dhl-ink text-white py-20" data-testid="gf-platform-callout">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <Eyebrow>THE PORTAL</Eyebrow>
        <h2 className="font-display font-bold text-3xl lg:text-4xl mb-6 leading-tight">
          Quote, book, document and track in one place.
        </h2>
        <ul className="space-y-3 mb-8">
          {[
            "Multi-mode bookings in minutes.",
            "Documents on demand — HBL, MAWB, invoices and more.",
            "Per-country currency and locale formatting built in.",
          ].map((b) => (
            <li key={b} className="flex items-start gap-3 text-base text-white/90">
              <Check className="w-5 h-5 text-dhl-red shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/login"
            data-testid="gf-platform-signin"
            className="inline-flex items-center gap-2 h-12 px-7 border-2 border-white text-white hover:bg-white hover:text-dhl-ink font-bold text-sm rounded-md transition-colors"
          >
            Sign in to myDHLi
          </Link>
          <Link
            to="/register"
            data-testid="gf-platform-register"
            className="inline-flex items-center gap-2 h-12 px-7 bg-dhl-red hover:bg-dhl-red-dark text-white font-bold text-sm rounded-md transition-colors"
          >
            Create an account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl aspect-[16/10] flex items-center justify-center">
        {/* TODO: replace with a real myDHLi product screenshot in a follow-up. */}
        <Lock className="w-16 h-16 text-white/40" />
      </div>
    </div>
  </section>
);

/* ─────────────── Section: sustainability strip ─────────────── */
const SustainabilityStrip = () => (
  <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16" data-testid="gf-sustainability">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
      <div
        className="h-72 lg:h-96 bg-cover bg-center rounded-lg"
        style={{ backgroundImage: "url('/assets/dhl/sustainability-photo.png')" }}
      />
      <div>
        <Eyebrow>SUSTAINABILITY</Eyebrow>
        <h2 className="font-display font-bold text-3xl lg:text-4xl text-dhl-ink mb-4">
          A greener way to move freight.
        </h2>
        <p className="text-base text-stone-600 mb-6 max-w-xl">
          Sustainable aviation fuel, low-emission ocean services and EV-ready
          road fleets help cut Scope 3 emissions across your supply chain.
        </p>
        <a
          href={URLS.sustainability}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="gf-sustainability-cta"
          className="inline-flex items-center gap-2 h-11 px-6 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white font-bold text-sm rounded-md transition-colors"
        >
          Explore our sustainability program <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  </section>
);

/* ─────────────── Section: insights cards ─────────────── */
const INSIGHT_CARDS = [
  {
    title: "Tariff outlook 2026",
    body: "What new measures mean for global lanes.",
    bg: "bg-gradient-to-br from-amber-100 via-yellow-50 to-stone-100",
  },
  {
    title: "Air freight capacity update",
    body: "Where capacity is tight and where it's loosening.",
    image: "/assets/dhl/air-freight-photo.png",
  },
  {
    title: "Ocean rates briefing",
    body: "Quarterly rate trajectory across the major corridors.",
    image: "/assets/dhl/ocean-freight-photo.png",
  },
];

const InsightsRow = () => (
  <section className="bg-stone-50 border-y border-stone-200" data-testid="gf-insights">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20">
      <Eyebrow>INSIGHTS</Eyebrow>
      <h2 className="font-display font-bold text-3xl lg:text-4xl text-dhl-ink mb-10">
        Trade flows are changing. Stay ahead.
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {INSIGHT_CARDS.map((c) => (
          <a
            key={c.title}
            href={URLS.insights}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`gf-insight-${c.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            className="group block bg-white rounded-2xl shadow-md border border-stone-200/60 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <div
              className={`h-48 ${c.bg || "bg-cover bg-center"}`}
              style={c.image ? { backgroundImage: `url('${c.image}')` } : undefined}
            />
            <div className="p-6">
              <div className="flex items-start gap-2 mb-2">
                <h3 className="font-display text-lg font-bold text-dhl-ink flex-1 leading-snug">
                  {c.title}
                </h3>
                <ArrowRight className="w-4 h-4 text-dhl-red shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm text-stone-600 mb-3">{c.body}</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-dhl-red">
                Read the brief <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────── Section: final yellow CTA band ─────────────── */
const FinalCTA = () => (
  <section className="bg-dhl-yellow py-16" data-testid="gf-final-cta">
    <div className="max-w-[800px] mx-auto px-6 lg:px-10 text-center">
      <h2 className="font-display font-bold text-3xl lg:text-4xl text-dhl-ink mb-3">
        Ready to move your next shipment?
      </h2>
      <p className="text-base text-dhl-ink/80 mb-7">
        Quote in minutes. Book in one flow. Track at every leg.
      </p>
      <Link
        to="/dashboard/quote"
        data-testid="gf-final-cta-quote"
        className="inline-flex items-center gap-2 h-14 px-10 bg-dhl-red hover:bg-dhl-red-dark text-white font-bold text-base rounded-md transition-colors"
      >
        Get a freight quote <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </section>
);

/* ─────────────── Page ─────────────── */
const GlobalForwarding = () => {
  useTitle("Global Forwarding");
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" data-testid="page-global-forwarding">
      <header data-testid="gf-header">
        <GFUtilityBar onSearch={() => setSearchOpen(true)} />
        <NavBar onMobileMenu={() => setDrawerOpen(true)} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </header>

      <Hero />
      <FreightModes />
      <IndustrySectors />
      <Pillars />
      <PlatformCallout />
      <SustainabilityStrip />
      <InsightsRow />
      <FinalCTA />
      <Footer />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

// Suppress unused-import lint on the shared BrandWordmark — kept here in
// case a follow-up turn wants to swap the GF lockup back for the standard
// wordmark on this page. Reference it cheaply at module scope.
void BrandWordmark;

export default GlobalForwarding;
