import Logo from "@/components/Logo";
import PngFlagSvg from "./PngFlagSvg";
import { Twitter, Linkedin, Youtube, Facebook, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const COLS = [
  {
    title: "Ship",
    links: [
      { l: "Get a Quote", to: "#" },
      { l: "Create a Shipment", to: "#" },
      { l: "Schedule Pickup", to: "#" },
      { l: "Track", to: "/track" },
    ],
  },
  {
    title: "Business",
    links: [
      { l: "Open Account", to: "/register" },
      { l: "Enterprise", to: "#" },
      { l: "API & Integration", to: "#" },
      { l: "Customs Services", to: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { l: "Help Center", to: "#" },
      { l: "Contact Us", to: "#" },
      { l: "Service Updates", to: "#" },
      { l: "FAQs", to: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { l: "About", to: "#" },
      { l: "Sustainability", to: "#" },
      { l: "Compliance", to: "#" },
      { l: "Press", to: "#" },
      { l: "Careers", to: "#" },
    ],
  },
];

const COUNTRIES = ["Papua New Guinea (PG)", "Australia (AU)", "Singapore (SG)", "United States (US)", "United Kingdom (GB)"];

const RichFooter = () => {
  const [countryOpen, setCountryOpen] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setCountryOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <footer id="contact" data-testid="rich-footer" className="bg-dhl-ink text-white">
      {/* Top yellow strip */}
      <div className="h-1.5 bg-dhl-yellow" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Logo variant="default" theme="light" to={null} />
            <p className="text-sm text-white/60 leading-[1.55] mt-5 mb-5 max-w-xs">
              Global express logistics. Built for businesses that ship every day.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin, Youtube, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  data-testid={`footer-social-${i}`}
                  className="w-9 h-9 border border-white/20 flex items-center justify-center hover:bg-dhl-yellow hover:text-dhl-ink hover:border-dhl-yellow transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-yellow mb-4">
                {c.title}
              </h4>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.l}>
                    <a
                      href={l.to}
                      data-testid={`footer-link-${l.l.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-white/70 hover:text-dhl-yellow transition-colors"
                    >
                      {l.l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs">
          <div className="text-white/40 flex flex-wrap gap-x-3 gap-y-1.5 items-center">
            <span>© 2026 DHL Express (Demo)</span>
            <span className="text-white/20">·</span>
            <a href="#" className="hover:text-white">Privacy</a>
            <span className="text-white/20">·</span>
            <a href="#" className="hover:text-white">Terms</a>
            <span className="text-white/20">·</span>
            <a href="#" className="hover:text-white">Cookies</a>
            <span className="text-white/20">·</span>
            <a href="#" className="hover:text-white">Site Map</a>
            <span className="text-white/20">·</span>
            <a href="#" className="hover:text-white">Sustainability</a>
            <span className="text-white/20">·</span>
            <a href="#" className="hover:text-white">Compliance</a>
          </div>

          <div ref={ref} className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen((v) => !v)}
              data-testid="footer-country-toggle"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/80"
            >
              <PngFlagSvg className="w-5 h-3.5" />
              <span className="font-semibold text-white">{country}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${countryOpen ? "rotate-180" : ""}`} />
            </button>
            {countryOpen && (
              <div
                data-testid="footer-country-menu"
                className="absolute right-0 bottom-full mb-2 w-60 bg-white text-dhl-text shadow-2xl py-1 z-50 max-h-64 overflow-y-auto"
              >
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCountry(c);
                      setCountryOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-dhl-yellow/30 ${
                      c === country ? "bg-dhl-yellow/20 font-bold" : ""
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-[10px] text-white/30 font-mono uppercase tracking-wider text-center">
          Demo build · Not affiliated with Deutsche Post DHL Group
        </div>
      </div>
    </footer>
  );
};

export default RichFooter;
