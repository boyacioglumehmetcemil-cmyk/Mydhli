import Logo from "@/components/Logo";

const Footer = () => {
  const columns = [
    {
      title: "Freight Services",
      links: ["Track Shipment", "Book a Shipment", "Get a Quote", "Pre-carriage Pickup"],
    },
    {
      title: "Business",
      links: ["Open an Account", "Volume Pricing", "Customs Help", "Industry Solutions"],
    },
    {
      title: "Support",
      links: ["Contact Us", "Service Areas", "Restricted Items", "Claims"],
    },
    {
      title: "Company",
      links: ["About PNG Network", "Careers", "Press Room", "Sustainability"],
    },
  ];

  return (
    <footer
      data-testid="landing-footer"
      className="bg-dhl-ink text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-yellow mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      data-testid={`footer-link-${link.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-white/70 hover:text-dhl-yellow transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" to={null} />
            <span className="text-xs text-white/50">DHL Global Forwarding</span>
          </div>
          <div className="text-xs text-white/40 font-mono">
            DEMO BUILD · NOT AFFILIATED WITH DEUTSCHE POST DHL GROUP
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
