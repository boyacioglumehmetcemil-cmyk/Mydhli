import { useEffect, useState, useMemo } from "react";
import { X, MapPin, Clock, Phone, Search, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";

const SERVICES = ["Pickup", "Drop-off", "Customs", "Account Services"];

const LOCATIONS = [
  {
    id: "pom-central",
    name: "Port Moresby Service Centre",
    address: "Lvl 2, Defens Haus, Champion Parade",
    city: "Port Moresby",
    hours: "Mon–Fri 8:00–17:30, Sat 8:00–12:00",
    phone: "+675 320 7100",
    services: ["Pickup", "Drop-off", "Customs", "Account Services"],
  },
  {
    id: "lae-branch",
    name: "Lae Branch",
    address: "Lot 7 Section 22, Top Town Industrial",
    city: "Lae",
    hours: "Mon–Fri 8:00–17:00, Sat 8:00–12:00",
    phone: "+675 472 2030",
    services: ["Pickup", "Drop-off", "Customs"],
  },
  {
    id: "mt-hagen",
    name: "Mt Hagen Service Point",
    address: "Hagen Park Centre, Komo Road",
    city: "Mount Hagen",
    hours: "Mon–Fri 8:30–16:30",
    phone: "+675 542 1100",
    services: ["Pickup", "Drop-off"],
  },
  {
    id: "madang",
    name: "Madang Office",
    address: "Modilon Road, Madang Town",
    city: "Madang",
    hours: "Mon–Fri 8:30–16:30",
    phone: "+675 422 8200",
    services: ["Pickup", "Drop-off", "Account Services"],
  },
  {
    id: "goroka",
    name: "Goroka Pickup Point",
    address: "Edwards Street, Goroka",
    city: "Goroka",
    hours: "Mon–Fri 9:00–16:00",
    phone: "+675 532 3700",
    services: ["Pickup", "Drop-off"],
  },
];

const FindLocationModal = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOCATIONS.filter((loc) => {
      const matchesQ = !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q);
      const matchesF = activeFilters.length === 0 ||
        activeFilters.every((f) => loc.services.includes(f));
      return matchesQ && matchesF;
    });
  }, [query, activeFilters]);

  const toggleFilter = (f) => {
    setActiveFilters((cur) =>
      cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]
    );
  };

  if (!open) return null;

  return (
    <div
      data-testid="find-location-modal"
      className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[760px] mt-4 sm:mt-12 border border-dhl-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dhl-border">
          <h2 className="font-display text-xl font-black text-dhl-ink">
            Find a Location
          </h2>
          <button
            type="button"
            data-testid="location-modal-close"
            onClick={onClose}
            className="p-1.5 hover:bg-dhl-panel transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-dhl-text" />
          </button>
        </div>

        {/* Search + filters */}
        <div className="px-6 py-4 border-b border-dhl-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dhl-muted" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter city or postcode"
              data-testid="location-search-input"
              className="w-full border border-dhl-border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-dhl-ink"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const active = activeFilters.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleFilter(s)}
                  data-testid={`location-filter-${s.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider border transition-colors ${
                    active
                      ? "bg-dhl-yellow border-dhl-ink text-dhl-ink"
                      : "bg-white border-dhl-border text-dhl-muted hover:border-dhl-ink hover:text-dhl-text"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="px-6 py-4 space-y-3 max-h-[55vh] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center text-dhl-muted text-sm py-8">
              No locations match your filters.
            </div>
          )}
          {filtered.map((loc) => (
            <div
              key={loc.id}
              data-testid={`location-card-${loc.id}`}
              className="border border-dhl-border p-4 hover:border-dhl-ink transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-dhl-text">{loc.name}</div>
                  <div className="text-xs text-dhl-muted mt-1 flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{loc.address}, {loc.city}, PG</span>
                  </div>
                  <div className="text-xs text-dhl-muted mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{loc.hours}</span>
                  </div>
                  <div className="text-xs text-dhl-muted mt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0" />
                    <a href={`tel:${loc.phone.replace(/\s+/g, '')}`} className="hover:text-dhl-text">
                      {loc.phone}
                    </a>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {loc.services.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-dhl-panel border border-dhl-border text-dhl-text"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Map view coming soon")}
                  data-testid={`location-map-${loc.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0EA5B7] hover:text-[#0B8C9C] transition-colors shrink-0"
                >
                  <MapIcon className="w-3 h-3" />
                  View on map
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FindLocationModal;
