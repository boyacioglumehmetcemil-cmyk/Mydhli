import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ExternalLink, Globe, ChevronDown, ChevronRight, Menu, X,
  Plane, Ship, Truck, Calendar, Calculator, Building2, ArrowRight,
  Eye, ClipboardList, TrendingUp, ShieldCheck, Linkedin, Youtube,
  Twitter, Container, Boxes, Facebook, Instagram,
} from "lucide-react";
import { toast } from "sonner";
import BrandWordmark from "@/components/BrandWordmark";
import BrandImagePlaceholder from "@/components/BrandImagePlaceholder";
import useTitle from "@/hooks/useTitle";

/* -------------------------------------------------------------------------- */
/* Header — utility bar + nav bar (2 rows, sticky)                             */
/* -------------------------------------------------------------------------- */
const COUNTRIES = ["Global", "United States", "United Kingdom", "Germany", "Singapore", "Australia", "Papua New Guinea"];

const UtilityBar = ({ onSearch, country, setCountry }) => {
  const [openCountry, setOpenCountry] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (!dropdownRef.current?.contains(e.target)) setOpenCountry(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div className="bg-dhl-yellow border-b border-dhl-yellow-dark" data-testid="utility-bar">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between gap-4">
        <BrandWordmark to="/" placement="header" data-testid="utility-bar-logo" />
        <nav className="hidden md:flex items-center gap-6 text-[13px] text-dhl-ink/85">
          <Link to="/locations" className="inline-flex items-center gap-1.5 hover:text-dhl-red" data-testid="utility-find-location">
            Find a service point <ExternalLink className="w-3 h-3" />
          </Link>
          <button type="button" onClick={onSearch} className="inline-flex items-center gap-1.5 hover:text-dhl-red" data-testid="utility-search">
            <Search className="w-3.5 h-3.5" /> Search
          </button>
          <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setOpenCountry(!openCountry)} data-testid="utility-country"
              className="inline-flex items-center gap-1.5 hover:text-dhl-red">
              <Globe className="w-3.5 h-3.5" />
              {country}
              <ChevronDown className="w-3 h-3" />
            </button>
            {openCountry && (
              <div data-testid="country-dropdown" className="absolute right-0 top-full mt-1 bg-white border border-dhl-border rounded-md shadow-lg min-w-[200px] py-1 z-50">
                {COUNTRIES.map(c => (
                  <button key={c} type="button"
                    onClick={() => { setCountry(c); setOpenCountry(false); }}
                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-dhl-panel ${c === country ? "font-bold text-dhl-red" : "text-dhl-text"}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

const NAV_ITEMS = [
  { label: "Track", to: "/track" },
  {
    label: "Ship",
    items: [
      { label: "Air freight",   to: "/dashboard/ship?mode=AIR",   icon: Plane },
      { label: "Ocean freight", to: "/dashboard/ship?mode=OCEAN", icon: Ship },
      { label: "Road freight",  to: "/dashboard/ship?mode=ROAD",  icon: Truck },
    ],
  },
  {
    label: "Enterprise Logistics Services",
    items: [
      { label: "Industries",        to: "/solutions" },
      { label: "Service modes",     to: "/solutions" },
      { label: "Customs clearance", to: "/solutions" },
      { label: "Sustainability",    to: "/solutions" },
    ],
  },
  { label: "Customer Service", to: "/help" },
];

const PORTAL_ITEMS = [
  { label: "myDHLi (Global Forwarding)",  to: "/login", testId: "portal-mydhli" },
  { label: "Other DHL portals",           to: "https://www.dhl.com", external: true, testId: "portal-other" },
];

const NavDropdown = ({ items, open, onClose }) => (
  <div data-testid="nav-dropdown" className="absolute left-0 top-full mt-0.5 bg-white border border-dhl-border rounded-md shadow-lg min-w-[240px] py-2 z-50">
    {items.map((it) => {
      const Icon = it.icon;
      return (
        <Link key={it.label} to={it.to} onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-dhl-text hover:bg-dhl-panel hover:text-dhl-red">
          {Icon && <Icon className="w-4 h-4 text-dhl-red" />}
          {it.label}
        </Link>
      );
    })}
  </div>
);

const NavBar = ({ onMobileMenu }) => {
  const [openIdx, setOpenIdx] = useState(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const navRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (!navRef.current?.contains(e.target)) { setOpenIdx(null); setPortalOpen(false); } };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div className="bg-white border-b border-dhl-border sticky top-0 z-40 shadow-sm" data-testid="nav-bar">
      <div ref={navRef} className="max-w-[1440px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((it, i) => {
            const hasDropdown = !!it.items;
            return (
              <div key={it.label} className="relative">
                {hasDropdown ? (
                  <button type="button" onClick={() => setOpenIdx(openIdx === i ? null : i)} data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="px-4 py-2 text-sm font-semibold text-dhl-text hover:text-dhl-red inline-flex items-center gap-1 border-b-2 border-transparent hover:border-dhl-yellow transition-colors">
                    {it.label} <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link to={it.to} data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="px-4 py-2 text-sm font-semibold text-dhl-text hover:text-dhl-red border-b-2 border-transparent hover:border-dhl-yellow inline-block transition-colors">
                    {it.label}
                  </Link>
                )}
                {hasDropdown && openIdx === i && <NavDropdown items={it.items} open={true} onClose={() => setOpenIdx(null)} />}
              </div>
            );
          })}
        </nav>
        <button type="button" onClick={onMobileMenu} className="md:hidden p-2" data-testid="mobile-menu-toggle">
          <Menu className="w-6 h-6 text-dhl-ink" />
        </button>
        <div className="relative hidden md:block">
          <button type="button" onClick={() => setPortalOpen(!portalOpen)} data-testid="customer-portal-logins"
            className="inline-flex items-center gap-2 h-10 px-5 bg-stone-100 text-dhl-ink border border-stone-300 hover:bg-stone-200 font-semibold text-sm rounded-md transition-colors">
            Customer portal logins <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {portalOpen && (
            <div data-testid="portal-dropdown" className="absolute right-0 top-full mt-1 bg-white border border-dhl-border rounded-md shadow-lg min-w-[260px] py-2 z-50">
              {PORTAL_ITEMS.map(p => (
                p.external ? (
                  <a key={p.label} href={p.to} target="_blank" rel="noopener noreferrer" data-testid={p.testId}
                    className="flex items-center justify-between px-4 py-2.5 text-[13px] text-dhl-text hover:bg-dhl-panel hover:text-dhl-red">
                    {p.label} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link key={p.label} to={p.to} onClick={() => setPortalOpen(false)} data-testid={p.testId}
                    className="flex items-center justify-between px-4 py-2.5 text-[13px] text-dhl-text hover:bg-dhl-panel hover:text-dhl-red">
                    {p.label} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MobileDrawer = ({ open, onClose }) => (
  open && (
    <div data-testid="mobile-drawer" className="fixed inset-0 z-[100] md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-[78vw] max-w-sm bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dhl-border">
          <BrandWordmark to="/" placement="header" />
          <button type="button" onClick={onClose} className="p-1" data-testid="mobile-drawer-close">
            <X className="w-5 h-5 text-dhl-ink" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.map(it => (
            <div key={it.label}>
              {it.items ? (
                <>
                  <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted">{it.label}</div>
                  {it.items.map(sub => (
                    <Link key={sub.label} to={sub.to} onClick={onClose}
                      className="block px-7 py-2.5 text-sm text-dhl-text hover:bg-dhl-panel hover:text-dhl-red">{sub.label}</Link>
                  ))}
                </>
              ) : (
                <Link to={it.to} onClick={onClose}
                  className="block px-5 py-3 text-sm font-semibold text-dhl-text hover:bg-dhl-panel hover:text-dhl-red border-b border-dhl-border">{it.label}</Link>
              )}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-dhl-border">
          <Link to="/login" onClick={onClose} className="block w-full h-11 inline-flex items-center justify-center bg-dhl-red text-white font-bold rounded-md text-sm" data-testid="mobile-drawer-login">
            Sign in to myDHLi
          </Link>
        </div>
      </div>
    </div>
  )
);

/* -------------------------------------------------------------------------- */
/* Freight mode silhouettes — minimal flat outlines used by FreightModeSection */
/* -------------------------------------------------------------------------- */
const PlaneSilhouette = () => (
  <svg viewBox="0 0 400 260" width="100%" height="100%" aria-hidden="true">
    <g fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M40 160 L150 140 L240 60 L268 60 L230 145 L320 140 L360 120 L370 130 L300 165 L228 175 L150 230 L130 225 L160 180 L70 195 Z" />
      <path d="M150 140 L150 230" opacity="0.35" />
      <path d="M230 145 L320 145" opacity="0.35" />
      <circle cx="372" cy="129" r="4" fill="rgba(0,0,0,0.14)" stroke="none" />
    </g>
  </svg>
);

const ContainerShipSilhouette = () => (
  <svg viewBox="0 0 460 280" width="100%" height="100%" aria-hidden="true">
    <g fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M30 200 L80 200 L80 130 L380 130 L380 200 L430 200 L410 240 L50 240 Z" />
      <path d="M80 200 L380 200" />
      <path d="M120 130 L120 80 L210 80 L210 130" />
      <path d="M150 80 L150 60 L195 60 L195 80" />
      <g>
        <rect x="100" y="145" width="60" height="40" />
        <rect x="170" y="145" width="60" height="40" />
        <rect x="240" y="145" width="60" height="40" />
        <rect x="310" y="145" width="60" height="40" />
        <rect x="130" y="105" width="60" height="35" />
        <rect x="220" y="105" width="60" height="35" />
        <rect x="310" y="105" width="60" height="35" />
      </g>
    </g>
  </svg>
);

const TruckSilhouette = () => (
  <svg viewBox="0 0 460 240" width="100%" height="100%" aria-hidden="true">
    <g fill="none" stroke="rgba(255,204,0,0.18)" strokeWidth="2.5" strokeLinejoin="round">
      <rect x="30" y="70" width="240" height="100" rx="4" />
      <path d="M270 90 L350 90 L390 130 L420 130 L420 170 L270 170 Z" />
      <path d="M350 90 L350 130 L420 130" />
      <line x1="50" y1="100" x2="250" y2="100" opacity="0.5" />
      <line x1="50" y1="120" x2="250" y2="120" opacity="0.5" />
      <line x1="50" y1="140" x2="250" y2="140" opacity="0.5" />
      <circle cx="110" cy="180" r="22" />
      <circle cx="110" cy="180" r="9" />
      <circle cx="200" cy="180" r="22" />
      <circle cx="200" cy="180" r="9" />
      <circle cx="320" cy="180" r="22" />
      <circle cx="320" cy="180" r="9" />
      <circle cx="395" cy="180" r="22" />
      <circle cx="395" cy="180" r="9" />
    </g>
  </svg>
);

/* -------------------------------------------------------------------------- */
/* FreightModeSection — single DRY component, 3 instances in main()           */
/* -------------------------------------------------------------------------- */
const ChevronBullet = ({ children }) => (
  <li className="flex items-start gap-3">
    <span aria-hidden="true" className="shrink-0 w-6 h-6 bg-dhl-yellow rounded-sm flex items-center justify-center mt-0.5">
      <ChevronRight className="w-4 h-4 text-dhl-red" strokeWidth={3} />
    </span>
    <span className="text-[15px] text-dhl-text leading-snug">{children}</span>
  </li>
);

const SubCard = ({ icon: Icon, title, body, href }) => (
  <Link to={href}
    className="group bg-white border border-dhl-border rounded-lg p-4 flex items-center gap-4 hover:border-dhl-yellow hover:shadow-md transition-all">
    <span className="shrink-0 w-12 h-12 bg-dhl-yellow rounded-md flex items-center justify-center">
      <Icon className="w-5 h-5 text-dhl-red" strokeWidth={2} />
    </span>
    <div className="flex-1 min-w-0">
      <div className="font-display font-bold text-dhl-text text-[15px] mb-0.5">{title}</div>
      <div className="text-[12px] text-dhl-muted leading-snug">{body}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-dhl-muted group-hover:text-dhl-red transition-colors" />
  </Link>
);

const FreightModeSection = ({
  mode, align = "image-right", bg = "white",
  eyebrow, headline, subhead, body, bullets, subCards, cta,
  imageVariant = "yellow", imageIcon, swapTarget,
}) => {
  const imageOnRight = align === "image-right";
  const bgCls = bg === "gray-50" ? "bg-dhl-panel" : "bg-white";
  const ContentBlock = (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-4">{eyebrow}</div>
      <h2 className="font-display font-bold text-dhl-text leading-tight tracking-tight mb-4 text-[28px] lg:text-[44px]">
        {headline}
      </h2>
      {subhead && (
        <p className="text-dhl-text font-medium text-lg lg:text-xl mb-4">{subhead}</p>
      )}
      <p className="text-dhl-muted text-[15px] lg:text-base leading-relaxed mb-7 max-w-prose">{body}</p>
      {bullets && bullets.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-7" data-testid={`mode-bullets-${mode.toLowerCase()}`}>
          {bullets.map((b) => <ChevronBullet key={b}>{b}</ChevronBullet>)}
        </ul>
      )}
      {subCards && subCards.length > 0 && (
        <div className="space-y-3 mb-7" data-testid={`mode-subcards-${mode.toLowerCase()}`}>
          {subCards.map((c) => <SubCard key={c.title} {...c} />)}
        </div>
      )}
      {cta && (
        <Link to={cta.href} data-testid={`mode-cta-${mode.toLowerCase()}`}
          className="inline-flex items-center gap-2 h-11 px-6 bg-dhl-red text-white hover:bg-dhl-red-dark font-semibold text-sm rounded-md transition-colors">
          {cta.label} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
  const ImageBlock = (
    <BrandImagePlaceholder
      variant={imageVariant}
      icon={imageIcon}
      iconAlign="center"
      iconSize={420}
      className="aspect-[4/3] lg:min-h-[480px] rounded-xl"
      testId={swapTarget}
    />
  );
  return (
    <section data-testid={`freight-mode-${mode.toLowerCase()}`} className={bgCls}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {imageOnRight ? (
          <>
            <div className="order-2 lg:order-1">{ContentBlock}</div>
            <div className="order-1 lg:order-2">{ImageBlock}</div>
          </>
        ) : (
          <>
            <div className="order-1">{ImageBlock}</div>
            <div className="order-2">{ContentBlock}</div>
          </>
        )}
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* AirFreightOverlappingSection — bespoke layout for the AIR freight block.    */
/* Mirrors the dhl.com "card-overlapping-photo" pattern: a white content card  */
/* with shadow sits on top of a tall photo column on the right; on lg+ the    */
/* photo bleeds vertically beyond the card edges so the card visually "punches */
/* into" the photo. Mobile collapses to a normal stacked layout.              */
/* Copy is OUR original — no verbatim copy from any DHL marketing source.     */
/* -------------------------------------------------------------------------- */
const AirFreightOverlappingSection = () => {
  const bullets = [
    "Daily consolidation flights",
    "Door-to-door visibility",
    "Charter and time-definite options",
    "HAWB and MAWB managed end-to-end",
  ];
  return (
    <section data-testid="freight-mode-air" className="bg-white py-16 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[6fr_5fr] gap-8 lg:gap-0 items-center relative">
          {/* CONTENT CARD — left column, raised above photo on lg+ */}
          <div className="relative z-10 bg-white rounded-xl shadow-xl border border-black/5 p-6 sm:p-8 lg:p-10 lg:max-w-[640px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-3">
              Air freight
            </div>
            <h2 className="font-display font-bold text-dhl-ink leading-tight tracking-tight mb-3 text-[26px] lg:text-[36px]">
              Time-critical air freight, delivered globally.
            </h2>
            <p className="text-dhl-ink/70 text-[15px] lg:text-base mb-4">
              For shippers who need speed.
            </p>
            <p className="text-dhl-ink/85 text-[14px] lg:text-[15px] leading-relaxed mb-6 max-w-prose">
              Consolidated and charter air services across more than two hundred destinations, with integrated customs clearance and door-to-door visibility from booking to delivery.
            </p>

            {/* Service capabilities — yellow chevron bullets */}
            <div className="bg-dhl-panel/60 rounded-lg p-4 lg:p-5 mb-6" data-testid="air-services-card">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-dhl-ink mb-3">
                Service capabilities
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-3" data-testid={`air-bullet-${i}`}>
                    <div className="w-5 h-5 bg-dhl-yellow rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ChevronRight className="w-3.5 h-3.5 text-dhl-red" strokeWidth={3} />
                    </div>
                    <span className="text-[13px] lg:text-sm text-dhl-ink/90 leading-snug">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/dashboard/quote?mode=AIR"
              data-testid="mode-cta-air"
              className="inline-flex items-center gap-2 h-11 px-6 bg-dhl-red text-white hover:bg-dhl-red-dark font-semibold text-sm rounded-md transition-colors"
            >
              Explore air freight <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* PHOTO — right column. On lg+ negative left margin pulls it under the
              card, and negative vertical margin makes it taller than the card so
              the card visually sits within a frame of photo above and below. */}
          <div
            data-testid="air-freight-photo"
            className="relative z-0 lg:-ml-16 lg:-my-16 rounded-xl lg:rounded-2xl overflow-hidden shadow-xl"
          >
            <img
              src="/assets/dhl/air-freight-cargo.jpg"
              alt="DHL Aviation cargo freighter and ULDs on the apron"
              className="w-full h-[280px] sm:h-[360px] lg:h-[640px] object-cover object-[center_55%]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* OceanFreightOverlappingSection — mirror of the AIR layout: PHOTO LEFT,      */
/* white content card RIGHT. Photo bleeds rightward into the card and         */
/* vertically above/below on lg+; mobile collapses to content-first stack.    */
/* -------------------------------------------------------------------------- */
const OceanFreightOverlappingSection = () => {
  const subCards = [
    { icon: Container, title: "FCL — Full container load",      body: "Dedicated container capacity with sailing schedules and HBL/MBL handling." },
    { icon: Boxes,     title: "LCL — Less than container load", body: "Consolidate smaller volumes with predictable transit and shared costs."   },
  ];
  return (
    <section data-testid="freight-mode-ocean" className="bg-dhl-panel/40 py-16 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[5fr_6fr] gap-8 lg:gap-0 items-center relative">
          {/* PHOTO — order-2 on mobile (below content), order-1 on lg (left side) */}
          <div
            data-testid="ocean-freight-photo"
            className="order-2 lg:order-1 relative z-0 lg:-mr-16 lg:-my-16 rounded-xl lg:rounded-2xl overflow-hidden shadow-xl"
          >
            <img
              src="/assets/dhl/ocean-freight-photo.png"
              alt="DHL Global Forwarding staff at a container port"
              className="w-full h-[280px] sm:h-[360px] lg:h-[640px] object-cover"
              loading="lazy"
            />
          </div>

          {/* CONTENT CARD — order-1 on mobile (above), order-2 on lg (right side) */}
          <div className="order-1 lg:order-2 relative z-10 bg-white rounded-xl shadow-xl border border-black/5 p-6 sm:p-8 lg:p-10 lg:max-w-[640px] lg:ml-auto">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-3">
              Ocean freight
            </div>
            <h2 className="font-display font-bold text-dhl-ink leading-tight tracking-tight mb-3 text-[26px] lg:text-[36px]">
              FCL, LCL and project cargo on every major lane.
            </h2>
            <p className="text-dhl-ink/70 text-[15px] lg:text-base mb-4">
              Business shippers, end to end.
            </p>
            <p className="text-dhl-ink/85 text-[14px] lg:text-[15px] leading-relaxed mb-6 max-w-prose">
              From a single pallet on an LCL consolidation to full-container chartering and oversized project cargo, our ocean teams plan, document and dispatch across global trade lanes.
            </p>

            {/* Sub-cards — FCL + LCL */}
            <div className="space-y-3 mb-6" data-testid="ocean-subcards">
              {subCards.map((c, i) => (
                <Link
                  key={i}
                  to="/dashboard/quote?mode=OCEAN"
                  data-testid={`ocean-subcard-${i}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-dhl-panel/60 hover:bg-dhl-panel transition-colors group"
                >
                  <div className="w-9 h-9 rounded-md bg-dhl-yellow/30 flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-dhl-ink" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] lg:text-sm font-bold text-dhl-ink leading-tight mb-0.5">{c.title}</div>
                    <div className="text-[12px] lg:text-[13px] text-dhl-ink/70 leading-snug">{c.body}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-dhl-red flex-shrink-0 mt-2 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>

            <Link
              to="/dashboard/quote?mode=OCEAN"
              data-testid="mode-cta-ocean"
              className="inline-flex items-center gap-2 h-11 px-6 bg-dhl-red text-white hover:bg-dhl-red-dark font-semibold text-sm rounded-md transition-colors"
            >
              Explore ocean freight <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* RoadFreightOverlappingSection — same direction as AIR (content LEFT, photo  */
/* RIGHT). Closes the freight-mode trio with an alternating bg-white rhythm.   */
/* -------------------------------------------------------------------------- */
const RoadFreightOverlappingSection = () => {
  const bullets = [
    "Cross-border consolidations",
    "Domestic distribution networks",
    "Reefer and oversized cargo",
    "Multimodal handoffs",
  ];
  return (
    <section data-testid="freight-mode-road" className="bg-white py-16 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[6fr_5fr] gap-8 lg:gap-0 items-center relative">
          {/* CONTENT CARD — LEFT, z-10 */}
          <div className="relative z-10 bg-white rounded-xl shadow-xl border border-black/5 p-6 sm:p-8 lg:p-10 lg:max-w-[640px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-3">
              Road freight
            </div>
            <h2 className="font-display font-bold text-dhl-ink leading-tight tracking-tight mb-3 text-[26px] lg:text-[36px]">
              Cross-border road freight without the friction.
            </h2>
            <p className="text-dhl-ink/70 text-[15px] lg:text-base mb-4">
              Domestic, regional and multimodal.
            </p>
            <p className="text-dhl-ink/85 text-[14px] lg:text-[15px] leading-relaxed mb-6 max-w-prose">
              Truckloads, less-than-truckload consolidations, and reefer or oversized cargo coordinated across borders with full customs documentation.
            </p>

            <div className="bg-dhl-panel/60 rounded-lg p-4 lg:p-5 mb-6" data-testid="road-services-card">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-dhl-ink mb-3">
                Service capabilities
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-3" data-testid={`road-bullet-${i}`}>
                    <div className="w-5 h-5 bg-dhl-yellow rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ChevronRight className="w-3.5 h-3.5 text-dhl-red" strokeWidth={3} />
                    </div>
                    <span className="text-[13px] lg:text-sm text-dhl-ink/90 leading-snug">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/dashboard/quote?mode=ROAD"
              data-testid="mode-cta-road"
              className="inline-flex items-center gap-2 h-11 px-6 bg-dhl-red text-white hover:bg-dhl-red-dark font-semibold text-sm rounded-md transition-colors"
            >
              Explore road freight <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* PHOTO — RIGHT, z-0, bleeds left into card + vertically beyond on lg+ */}
          <div
            data-testid="road-freight-photo"
            className="relative z-0 lg:-ml-16 lg:-my-16 rounded-xl lg:rounded-2xl overflow-hidden shadow-xl"
          >
            <img
              src="/assets/dhl/road-freight-photo.png"
              alt="DHL trucking fleet at a cross-dock terminal"
              className="w-full h-[280px] sm:h-[360px] lg:h-[640px] object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */
const HeroFreightSilhouette = () => (
  <svg viewBox="0 0 480 320" width="100%" height="100%" aria-hidden="true">
    <g fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="2">
      <path d="M50 230 Q140 210 230 230 T410 230" />
      <path d="M70 250 L380 250" />
      <rect x="120" y="170" width="160" height="60" rx="4" />
      <path d="M120 170 L160 150 L240 150 L280 170" />
      <circle cx="160" cy="240" r="14" />
      <circle cx="220" cy="240" r="14" />
      <path d="M320 110 L420 120 L440 100 L420 95 L380 90 Z" />
      <path d="M380 95 L400 70 L405 95" />
      <path d="M295 270 Q310 250 340 268 L420 268 L420 290 L295 290 Z" />
      <path d="M340 268 L340 250" />
    </g>
  </svg>
);

const Hero = () => {
  const navigate = useNavigate();
  const [ref, setRef] = useState("");
  const onSubmit = (e) => {
    e?.preventDefault();
    const v = ref.trim().toUpperCase();
    if (!v) return toast.error("Enter a tracking reference");
    navigate(`/track/${encodeURIComponent(v)}`);
  };
  return (
    <section data-testid="landing-hero" className="relative isolate">
      {/* Real DHL operational photo (image19 from PCT asset pack — outdoor delivery scene with mountain backdrop). Kept as a CSS background so we can keep the existing flow-layout that determines hero height. */}
      <div
        data-testid="hero-image"
        className="absolute inset-0 bg-cover bg-no-repeat bg-[center_30%]"
        style={{ backgroundImage: "url('/assets/dhl/hero-delivery.png')" }}
        aria-hidden="true"
      />
      {/* Readability overlay — concentrated near the top where the headline + tracking widget sit. Keeps the lower half of the photo (DHL van, courier) visible. */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-transparent"
        aria-hidden="true"
      />
      <div className="relative max-w-[1100px] mx-auto px-6 lg:px-10 py-12 lg:py-20 min-h-[50vh] flex flex-col justify-center">
        <div className="w-full max-w-xl mx-auto">
          <h1 className="font-display font-semibold text-white leading-tight tracking-tight mb-3 text-[22px] sm:text-[26px] lg:text-[32px] text-center [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
            Track your shipment
          </h1>
          <p className="text-white/90 mb-8 text-[13px] lg:text-[14px] text-center [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
            Air, ocean and road — one tracking surface for every freight reference.
          </p>
          <form onSubmit={onSubmit} data-testid="hero-track-form"
            className="bg-white border border-dhl-border rounded-md shadow-lg p-1.5 flex flex-col sm:flex-row gap-1.5 w-full">
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              type="text"
              data-testid="hero-track-input"
              placeholder="Enter your tracking number"
              className="flex-1 h-12 px-4 text-base bg-transparent border-0 outline-none font-mono uppercase placeholder:text-dhl-muted placeholder:normal-case placeholder:font-sans placeholder:text-[14px]"
              aria-label="Tracking number"
            />
            <button type="submit" data-testid="hero-track-submit"
              className="h-12 px-8 bg-dhl-red text-white hover:bg-dhl-red-dark font-bold text-sm rounded-md transition-colors">
              Track
            </button>
          </form>
          <div className="mt-3 text-[12px] text-white/80 text-center [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
            AWB, HBL, container number or booking reference
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Floating action cards                                                       */
/* -------------------------------------------------------------------------- */
const ActionCard = ({ to, icon: Icon, title, sub, testId, highlight = false }) => (
  <Link to={to} data-testid={testId}
    className="group relative overflow-hidden bg-white rounded-xl shadow-lg p-4 lg:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 block">
    {/* DHL-style folded corner — yellow triangle in the top-right corner, used to highlight the featured card. CSS border trick keeps it crisp at any zoom level. */}
    {highlight && (
      <div
        data-testid={`${testId}-folded-corner`}
        className="absolute top-0 right-0 w-12 h-12 overflow-hidden rounded-tr-xl pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[48px] border-t-dhl-yellow border-l-[48px] border-l-transparent"></div>
      </div>
    )}
    <div className="w-10 h-10 bg-dhl-red/10 rounded-md flex items-center justify-center mb-3">
      <Icon className="w-5 h-5 text-dhl-red" strokeWidth={2} />
    </div>
    <h3 className="font-display font-bold text-dhl-text text-base lg:text-lg mb-1">{title}</h3>
    <p className="text-[12px] lg:text-[13px] text-dhl-muted leading-snug">{sub}</p>
    <div className="flex items-center gap-1 mt-3 text-[12px] font-bold text-dhl-red group-hover:gap-2 transition-all">
      Get started <ArrowRight className="w-3.5 h-3.5" />
    </div>
  </Link>
);

const FloatingCards = () => (
  <section data-testid="landing-cards" className="relative z-10 -mt-20 lg:-mt-24 mb-16 lg:mb-24 px-6 lg:px-10">
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
      <ActionCard to="/dashboard/ship"            icon={Calendar}    title="Ship now"                   sub="Find the right service mode for your freight." testId="card-ship-now" />
      <ActionCard to="/dashboard/quote"           icon={Calculator}  title="Get a quote"                sub="Compare air, ocean and road side by side."     testId="card-get-quote" />
      <ActionCard to="/register?type=business"    icon={Building2}   title="Request a business account" sub="For regular shippers seeking volume rates."    testId="card-business-account" highlight />
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Info band — yellow, image left + content right                              */
/* -------------------------------------------------------------------------- */
const ChecklistMark = () => (
  <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
    <g fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5">
      <rect x="30" y="30" width="140" height="140" rx="8" />
      <path d="M50 75 L70 92 L100 60" />
      <path d="M115 75 L165 75" />
      <path d="M50 120 L70 137 L100 105" />
      <path d="M115 120 L165 120" />
      <path d="M50 165 L70 182 L100 150" />
      <path d="M115 165 L165 165" />
    </g>
  </svg>
);

const InfoBand = () => (
  <section data-testid="landing-info-band" className="bg-dhl-yellow">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 lg:py-14 grid lg:grid-cols-[5fr_7fr] gap-10 lg:gap-16 items-stretch">
      <div data-testid="info-band-image" className="aspect-[4/5] lg:aspect-auto lg:-my-14 rounded-xl lg:rounded-none border border-black/10 lg:border-0 overflow-hidden bg-white">
        <img
          src="/assets/dhl/info-band-tariff.png"
          alt="DHL freight forwarder reviewing customs documents"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-4">Trade insights</div>
        <h2 className="font-display font-bold text-dhl-ink leading-tight tracking-tight mb-5 text-[28px] lg:text-[40px]">
          Move forward with confidence in shifting trade flows.
        </h2>
        <p className="text-dhl-ink/85 text-[15px] lg:text-base leading-relaxed mb-6 max-w-3xl">
          Global trade conditions evolve constantly. Our freight forwarding teams help shippers plan around tariff changes, capacity shifts, and route disruptions across every mode — air, ocean and road.
        </p>
        <Link to="/solutions" data-testid="info-band-cta"
          className="inline-flex items-center gap-2 h-11 px-6 bg-dhl-red text-white hover:bg-dhl-red-dark font-semibold text-sm rounded-md transition-colors">
          Explore solutions <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Sustainability — green, reversed layout                                     */
/* -------------------------------------------------------------------------- */
const LeafMark = () => (
  <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
    <g fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2.5">
      <path d="M100 30 C150 60 150 130 100 170 C50 130 50 60 100 30 Z" />
      <path d="M100 30 L100 170" />
      <path d="M100 60 L130 70" />
      <path d="M100 90 L138 105" />
      <path d="M100 120 L130 138" />
      <path d="M100 60 L70 70" />
      <path d="M100 90 L62 105" />
      <path d="M100 120 L70 138" />
    </g>
  </svg>
);

const Sustainability = () => (
  <section data-testid="landing-sustainability" className="bg-white">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-[7fr_5fr] gap-10 lg:gap-16 items-center">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-green mb-4">Sustainability</div>
        <h2 className="font-display font-bold text-dhl-text leading-tight tracking-tight mb-5 text-[28px] lg:text-[40px]">
          Lower-carbon freight is built into every quote.
        </h2>
        <p className="text-dhl-muted text-[15px] lg:text-base leading-relaxed mb-6 max-w-xl">
          When you compare modes in our quote tool, you see emissions alongside cost and transit time. Choose what fits your impact targets — and report Scope 3 with one click.
        </p>
        <Link to="/dashboard/quote" data-testid="sustainability-cta"
          className="inline-flex items-center gap-2 h-11 px-6 bg-dhl-red text-white hover:bg-dhl-red-dark font-semibold text-sm rounded-md transition-colors">
          See our quote comparison <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div data-testid="sustainability-image" className="aspect-[3/2] rounded-xl overflow-hidden shadow-lg bg-white">
        <img
          src="/assets/dhl/sustainability-photo.png"
          alt="DHL electric delivery van on a tree-lined street"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Why choose us — 4 icon grid                                                 */
/* -------------------------------------------------------------------------- */
const WHY = [
  { Icon: Eye,          title: "End-to-end visibility", desc: "Track every leg from booking to proof of delivery."     },
  { Icon: ClipboardList,title: "Documents on demand",   desc: "Access HBL, HAWB and customs paperwork instantly."     },
  { Icon: TrendingUp,   title: "Capacity at scale",     desc: "Access global air, ocean and road networks."           },
  { Icon: ShieldCheck,  title: "Customs expertise",     desc: "Compliance built into every shipment we move."         },
];

/* -------------------------------------------------------------------------- */
/* SMBBusinessSection — yellow band aimed at small/medium-sized businesses.   */
/* Photo on the left with a soft yellow gradient fade on its right edge so it */
/* dissolves into the band background. Body copy is OUR original — no         */
/* verbatim text from any DHL marketing source.                               */
/* -------------------------------------------------------------------------- */
const SMBBusinessSection = () => (
  <section data-testid="smb-business" className="bg-dhl-yellow relative overflow-hidden">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <div className="grid lg:grid-cols-[5fr_7fr] gap-8 lg:gap-12 items-center">
        {/* PHOTO + soft right-edge fade into yellow */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-xl lg:rounded-2xl shadow-xl lg:-my-14">
            <img
              src="/assets/dhl/smb-business.png"
              alt="Small business owner managing online orders and shipping"
              className="w-full h-[260px] sm:h-[320px] lg:h-[420px] object-cover"
              loading="lazy"
            />
            {/* Right-edge dissolve into the band's yellow (only on lg+) */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute inset-y-0 right-0 w-28 pointer-events-none"
              style={{ background: "linear-gradient(to right, rgba(255,204,0,0) 0%, rgba(255,204,0,0.85) 70%, #FFCC00 100%)" }}
            />
          </div>
        </div>
        {/* CONTENT */}
        <div className="lg:pl-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-3">
            Business shipping
          </div>
          <h2 className="font-display font-bold text-dhl-ink leading-tight tracking-tight mb-5 text-[28px] lg:text-[40px]">
            DHL for your business.
          </h2>
          <p className="text-dhl-ink/85 text-[15px] lg:text-base leading-relaxed mb-8 max-w-prose">
            Scale your small and medium-sized business with end-to-end freight forwarding, customs expertise and reliable transit. Our specialists adapt to your customers' changing needs.
          </p>
          <Link
            to="/solutions"
            data-testid="smb-business-cta"
            className="inline-flex items-center gap-2 h-12 px-7 bg-dhl-red text-white hover:bg-dhl-red-dark font-semibold text-sm rounded-md shadow-md transition-colors"
          >
            Explore business solutions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const WhyChooseUs = () => (
  <section data-testid="landing-why" className="bg-dhl-panel">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
      <div className="text-center mb-12 lg:mb-16">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-3">Why myDHLi</div>
        <h2 className="font-display font-bold text-dhl-text leading-tight tracking-tight text-[28px] lg:text-[40px]">
          Built for global freight movers.
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7">
        {WHY.map((w) => (
          <div key={w.title} data-testid={`why-${w.title.toLowerCase().split(" ")[0]}`}
            className="bg-white p-6 lg:p-7 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-11 h-11 bg-dhl-red/10 rounded-md flex items-center justify-center mb-5">
              <w.Icon className="w-5 h-5 text-dhl-red" strokeWidth={2} />
            </div>
            <h3 className="font-display font-bold text-dhl-text text-base lg:text-lg mb-2">{w.title}</h3>
            <p className="text-[13px] text-dhl-muted leading-relaxed">{w.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */
const Footer = () => {
  /* ---------- Tier 1: Service updates band ---------- */
  const updates = [
    "Operational update — Pacific region",
    "Weekly fuel surcharge adjustment",
  ];

  /* ---------- Tier 2: Promo cards (no new asset for Innovation) ---------- */
  const promoCards = [
    {
      title: "Sustainability",
      body: "Lower-carbon supply chains start with the modes you choose. We surface emissions alongside cost and transit time so you can balance impact and delivery in the same view.",
      image: "/assets/dhl/sustainability-photo.png",
      alt: "DHL electric delivery van on a tree-lined street",
    },
    {
      title: "Innovation",
      body: "Customer-centric tooling — from instant multi-mode quotes to AI-assisted customs prep. Every release we ship pulls another minute out of the booking flow for shippers.",
      image: null, // Yellow gradient placeholder — no dedicated asset yet
      alt: null,
    },
    {
      title: "Global connectedness",
      body: "Our 2026 outlook tracks how trade lanes are reshaping across regions. See where capacity is shifting and how mode-switching is unlocking shorter, more resilient routes.",
      image: "/assets/dhl/ocean-freight-photo.png",
      alt: "Container port with cargo ship and STS cranes",
    },
  ];

  /* ---------- Tier 3: Four-column footer ---------- */
  const columns = [
    {
      h: "Quick links",
      l: [
        "Customer service",
        "Customer portal login",
        "Strategic partner directory",
        "Developer portal",
        "Get a quote",
        "Request a business account",
        "Shipping guidance",
        "Aviation cargo",
      ],
    },
    {
      h: "Our divisions",
      l: ["DHL Express", "DHL Global Forwarding", "DHL Supply Chain", "DHL eCommerce", "Other global divisions"],
    },
    {
      h: "Industry sectors",
      l: [
        "Auto-Mobility",
        "Energy",
        "Engineering & Manufacturing",
        "Life Sciences & Healthcare",
        "Retail & Fashion",
        "Technology",
      ],
    },
    {
      h: "Company information",
      l: [
        "About DHL",
        "Delivered Magazine",
        "Careers",
        "Press Center",
        "Investors",
        "Sustainability",
        "Supplier Diversity",
        "Innovation",
        "Events",
        "Brand Partnerships",
      ],
    },
  ];

  const legalLinks = [
    "Fraud awareness",
    "Legal notice",
    "Terms of use",
    "Privacy notice",
    "Additional information",
    "Cookie settings",
  ];

  const socials = [
    { Icon: Youtube,   label: "YouTube"   },
    { Icon: Facebook,  label: "Facebook"  },
    { Icon: Linkedin,  label: "LinkedIn"  },
    { Icon: Instagram, label: "Instagram" },
  ];

  return (
    <footer data-testid="landing-footer" className="bg-white text-dhl-ink">
      {/* TIER 1 — Service updates band */}
      <section data-testid="footer-updates" className="border-b border-dhl-border">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 lg:py-12 grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12 items-start">
          <div>
            <h3 className="font-display font-bold text-dhl-ink text-[22px] lg:text-[26px] leading-tight mb-2">
              Important service updates
            </h3>
            <p className="text-dhl-muted text-[14px] leading-relaxed max-w-md">
              Service bulletins keep you up to date with news and alerts.
            </p>
          </div>
          <ul className="divide-y divide-dhl-border border-t border-b border-dhl-border">
            {updates.map((u) => (
              <li key={u}>
                <a
                  href="#"
                  data-testid="footer-update-link"
                  className="flex items-center justify-between gap-4 py-4 group hover:bg-dhl-panel/40 transition-colors px-2"
                >
                  <span className="text-[14px] lg:text-[15px] text-dhl-ink group-hover:text-dhl-red transition-colors">{u}</span>
                  <ChevronRight className="w-4 h-4 text-dhl-red flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TIER 2 — Promo cards */}
      <section data-testid="footer-promo-cards" className="bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {promoCards.map((c) => (
            <a
              key={c.title}
              href="#"
              data-testid={`footer-promo-${c.title.toLowerCase().replace(/\s+/g, "-")}`}
              className="group block bg-white rounded-2xl shadow-md border border-dhl-border/60 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              {/* Image OR yellow gradient fallback for Innovation */}
              <div className="aspect-[16/9] bg-dhl-yellow relative overflow-hidden">
                {c.image ? (
                  <img src={c.image} alt={c.alt} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(135deg, #FFCC00 0%, #FFE066 60%, #FFF3B0 100%)" }}
                    />
                    <div className="absolute inset-0 flex items-end p-6">
                      <span className="font-display font-bold text-dhl-ink/30 text-5xl lg:text-6xl leading-none uppercase tracking-tighter">
                        {c.title}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 lg:p-7">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-display font-bold text-dhl-ink text-[18px] lg:text-[20px] leading-tight">{c.title}</h4>
                  <ChevronRight className="w-5 h-5 text-dhl-red flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-dhl-muted text-[13px] lg:text-[14px] leading-relaxed">{c.body}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* TIER 3 — Four-column link footer */}
      <section data-testid="footer-columns" className="bg-neutral-50 border-t border-dhl-border">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {columns.map((c) => (
            <div key={c.h}>
              <h5 className="font-display font-bold text-dhl-red text-[14px] lg:text-[15px] mb-4">{c.h}</h5>
              <ul className="space-y-2.5">
                {c.l.map((x) => (
                  <li key={x}>
                    <a href="#" className="text-[13px] lg:text-[14px] text-dhl-ink hover:underline hover:text-dhl-red transition-colors">
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* TIER 4 — Bottom strip */}
      <section data-testid="footer-bottom" className="bg-neutral-100 border-t border-dhl-border">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 lg:py-10">
          {/* Row A: brand + social */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-6 border-b border-dhl-border">
            <BrandWordmark to={null} placement="footer" />
            <div className="flex items-center gap-4">
              <span className="text-[12px] uppercase tracking-[0.2em] font-bold text-dhl-muted">Follow us</span>
              <div className="flex items-center gap-2">
                {socials.map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    data-testid={`footer-social-${label.toLowerCase()}`}
                    className="w-9 h-9 rounded-md bg-white border border-dhl-border flex items-center justify-center text-dhl-muted hover:text-dhl-red hover:border-dhl-red transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Row B: legal links */}
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 py-5 text-[12px] text-dhl-muted">
            {legalLinks.map((x, i) => (
              <li key={x} className="flex items-center gap-x-5">
                <a href="#" className="hover:text-dhl-red transition-colors">{x}</a>
                {i < legalLinks.length - 1 && <span className="text-dhl-border" aria-hidden="true">·</span>}
              </li>
            ))}
          </ul>

          {/* Row C: copyright + demo badge */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-5 border-t border-dhl-border text-[11px] text-dhl-muted">
            <div className="text-center md:text-left">© 2026 — All rights reserved.</div>
            <div className="font-mono uppercase tracking-wider text-dhl-muted/70 text-[10px]">
              Demo build · Not affiliated with Deutsche Post DHL Group · myDHLi placeholder
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
};

/* -------------------------------------------------------------------------- */
/* Search modal (utility bar)                                                  */
/* -------------------------------------------------------------------------- */
const SearchModal = ({ open, onClose }) =>
  open && (
    <div data-testid="search-modal" className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-xl w-full mx-4 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-dhl-text">Search myDHLi</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-dhl-panel rounded" data-testid="search-modal-close">
            <X className="w-4 h-4 text-dhl-muted" />
          </button>
        </div>
        <input autoFocus type="text" data-testid="search-modal-input"
          placeholder="Tracking, FAQ, services…"
          className="w-full h-12 px-4 text-base bg-dhl-panel border-2 border-dhl-border focus:border-dhl-yellow focus:outline-none rounded-md" />
        <div className="text-[11px] text-dhl-muted mt-3">
          Quick search ships in the next release — try the hero tracking input meanwhile.
        </div>
      </div>
    </div>
  );

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */
const Landing = () => {
  useTitle("Freight forwarding");
  const [country, setCountry] = useState("Global");
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      <UtilityBar onSearch={() => setSearchOpen(true)} country={country} setCountry={setCountry} />
      <NavBar onMobileMenu={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main>
        <Hero />
        <FloatingCards />
        <InfoBand />
        <AirFreightOverlappingSection />
        <OceanFreightOverlappingSection />
        <RoadFreightOverlappingSection />
        <Sustainability />
        <SMBBusinessSection />
        <WhyChooseUs />
      </main>
      <Footer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Landing;
