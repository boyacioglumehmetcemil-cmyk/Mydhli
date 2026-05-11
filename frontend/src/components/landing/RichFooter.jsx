import Logo from "@/components/Logo";
import { Twitter, Linkedin, Youtube, Facebook } from "lucide-react";

const RichFooter = () => {
  const cols = [
    { title: "Ship", links: ["Track", "Get Rate", "Ship Now", "Schedule Pickup"] },
    { title: "Business", links: ["Open Account", "Enterprise", "API", "Customs"] },
    { title: "Support", links: ["Help Center", "Contact", "Service Updates", "FAQs"] },
    { title: "Company", links: ["About", "Sustainability", "Press", "Careers"] },
  ];
  return (
    <footer id="contact" data-testid="rich-footer" className="bg-dhl-ink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Logo size="md" to={null} />
            <p className="text-sm text-white/60 leading-relaxed mt-5 mb-5 max-w-xs">
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
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-yellow mb-4">
                {c.title}
              </h4>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      data-testid={`footer-link-${l.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-white/70 hover:text-dhl-yellow transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="text-white/40">
            © 2026 DHL Express (Demo) ·{" "}
            <a href="#" className="hover:text-white">Privacy</a> ·{" "}
            <a href="#" className="hover:text-white">Terms</a> ·{" "}
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <span>Country:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10">
              🇵🇬 <span className="font-bold text-white">Papua New Guinea (PG)</span>
            </span>
          </div>
        </div>
        <div className="mt-6 text-[10px] text-white/30 font-mono uppercase tracking-wider text-center">
          DEMO BUILD · NOT AFFILIATED WITH DEUTSCHE POST DHL GROUP
        </div>
      </div>
    </footer>
  );
};

export default RichFooter;
