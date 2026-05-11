import { useState, useRef, useEffect } from "react";
import Logo from "@/components/Logo";
import PngFlagSvg from "./PngFlagSvg";
import { Twitter, Linkedin, Youtube, Facebook, ChevronDown, X } from "lucide-react";
import SectionEyebrow from "./SectionEyebrow";

const COLS = [
  {
    eyebrow: "Contact and Support",
    links: [
      { l: "Help and Support", to: "#" },
      { l: "FAQs", to: "#" },
      { l: "Contact Us", to: "#" },
      { l: "Find a Location", to: "#" },
    ],
  },
  {
    eyebrow: "Legal",
    links: [
      { l: "Terms and Conditions", to: "#" },
      { l: "Privacy Notice", to: "#" },
      { l: "Cookie Settings", to: "#", action: "cookies" },
    ],
  },
  {
    eyebrow: "Alerts",
    links: [
      { l: "Fraud Awareness", to: "#" },
      { l: "Important Information", to: "#" },
      { l: "Service Updates", to: "#" },
    ],
  },
];

const COUNTRIES = [
  "Papua New Guinea (PG)",
  "Australia (AU)",
  "Singapore (SG)",
  "United States (US)",
  "United Kingdom (GB)",
];

const RichFooter = () => {
  const [countryOpen, setCountryOpen] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [cookieModal, setCookieModal] = useState(false);
  const [consentModal, setConsentModal] = useState(false);
  const countryRef = useRef(null);

  useEffect(() => {
    const onClick = (e) =>
      countryRef.current && !countryRef.current.contains(e.target) && setCountryOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <footer id="contact" data-testid="rich-footer" style={{ backgroundColor: "#FAF7F0" }} className="text-[#2A2A2A]">
      {/* Top yellow strip */}
      <div className="h-1.5 bg-dhl-yellow" />

      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {COLS.map((c) => (
            <div key={c.eyebrow}>
              <SectionEyebrow theme="light" className="mb-5">
                {c.eyebrow}
              </SectionEyebrow>
              <ul className="space-y-3 mt-4">
                {c.links.map((l) => (
                  <li key={l.l}>
                    <a
                      href={l.to}
                      onClick={(e) => {
                        if (l.action === "cookies") {
                          e.preventDefault();
                          setCookieModal(true);
                        }
                      }}
                      data-testid={`footer-link-${l.l.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-[#333] hover:text-[#1A1A1A] hover:underline underline-offset-4 decoration-[#D4A800] decoration-2 transition-all"
                    >
                      {l.l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Brand block */}
          <div data-testid="footer-brand-block">
            <Logo variant="compact" to={null} />
            <p className="text-sm text-[#555] leading-[1.6] mt-5 mb-5 max-w-xs">
              Global express logistics. Built for businesses that ship every day.
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] text-[#555] mb-6">
              {["About", "Press", "Careers", "Sustainability", "Legal Notice"].map((mini, i, arr) => (
                <span key={mini} className="inline-flex items-center">
                  <a
                    href="#"
                    data-testid={`footer-mini-${mini.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-[#1A1A1A] transition-colors"
                  >
                    {mini}
                  </a>
                  {i < arr.length - 1 && <span className="ml-2 text-[#999]">·</span>}
                </span>
              ))}
            </div>

            {/* Country selector */}
            <div ref={countryRef} className="relative inline-block">
              <button
                type="button"
                onClick={() => setCountryOpen((v) => !v)}
                data-testid="footer-country-toggle"
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#E0DCD0] hover:bg-[#F0EDE5] transition-colors text-[#333] text-sm rounded-sm"
              >
                <PngFlagSvg className="w-5 h-3.5" />
                <span className="font-semibold text-[#1A1A1A]">{country}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${countryOpen ? "rotate-180" : ""}`}
                />
              </button>
              {countryOpen && (
                <div
                  data-testid="footer-country-menu"
                  className="absolute left-0 bottom-full mb-2 w-60 bg-white text-dhl-text shadow-2xl py-1 z-50 max-h-64 overflow-y-auto border border-[#E0DCD0]"
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
        </div>
      </div>

      {/* Bottom bar — slightly darker cream */}
      <div style={{ backgroundColor: "#F0EDE5" }} className="border-t border-[#E0DCD0]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 min-h-[56px]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#666]">
              Follow Us
            </span>
            <div className="flex items-center gap-2">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "X / Twitter" },
                { Icon: Linkedin, label: "LinkedIn" },
                { Icon: Youtube, label: "YouTube" },
              ].map(({ Icon, label }, i) => (
                <a
                  key={label}
                  href="#"
                  data-testid={`footer-social-${i}`}
                  aria-label={label}
                  className="w-8 h-8 border border-[#D0CCBE] flex items-center justify-center text-[#333] hover:bg-dhl-yellow hover:text-dhl-ink hover:border-dhl-yellow transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConsentModal(true)}
            data-testid="footer-consent-settings"
            className="text-sm text-[#333] hover:text-[#1A1A1A] hover:underline underline-offset-4 decoration-[#D4A800] decoration-2 transition-all"
          >
            Consent Settings
          </button>

          <div className="text-xs text-[#666] text-center md:text-right">
            © 2026 DHL Express (Demo) — All rights reserved.
          </div>
        </div>
      </div>

      <div className="text-[10px] text-[#888] font-mono uppercase tracking-wider text-center py-3 px-4" style={{ backgroundColor: "#F0EDE5" }}>
        Demo build · Not affiliated with Deutsche Post DHL Group
      </div>

      {/* Cookie modal */}
      {cookieModal && (
        <div
          data-testid="cookie-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-dhl-text"
          onClick={() => setCookieModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-display text-xl font-black">Cookie Settings</h3>
              <button onClick={() => setCookieModal(false)} className="p-1 hover:bg-dhl-panel rounded">
                <X className="w-4 h-4 text-dhl-muted" />
              </button>
            </div>
            <p className="text-sm text-dhl-muted leading-[1.6] mb-5">
              We use cookies to deliver this site and improve your experience. Manage your preferences
              below.
            </p>
            <div className="space-y-3 mb-5">
              {["Essential", "Analytics", "Marketing"].map((c, i) => (
                <label key={c} className="flex items-center justify-between p-3 border border-dhl-border">
                  <div>
                    <div className="font-bold text-sm">{c}</div>
                    <div className="text-[11px] text-dhl-muted">
                      {i === 0 ? "Always active — required for site function" : "Optional"}
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked={i === 0} disabled={i === 0} className="w-4 h-4" />
                </label>
              ))}
            </div>
            <button
              onClick={() => setCookieModal(false)}
              className="w-full h-11 bg-dhl-ink text-dhl-yellow font-bold uppercase tracking-wider text-xs"
            >
              Save Preferences
            </button>
            <div className="text-[10px] text-dhl-muted italic mt-3 text-center">
              Demo build — preferences are not persisted.
            </div>
          </div>
        </div>
      )}

      {/* Consent modal */}
      {consentModal && (
        <div
          data-testid="consent-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-dhl-text"
          onClick={() => setConsentModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-display text-xl font-black">Consent Settings</h3>
              <button onClick={() => setConsentModal(false)} className="p-1 hover:bg-dhl-panel rounded">
                <X className="w-4 h-4 text-dhl-muted" />
              </button>
            </div>
            <p className="text-sm text-dhl-muted leading-[1.6] mb-5">
              Choose what data we may use to personalise your experience.
            </p>
            <button
              onClick={() => setConsentModal(false)}
              className="w-full h-11 bg-dhl-red text-white font-bold uppercase tracking-wider text-xs"
            >
              Confirm
            </button>
            <div className="text-[10px] text-dhl-muted italic mt-3 text-center">
              Demo build — not persisted.
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default RichFooter;
