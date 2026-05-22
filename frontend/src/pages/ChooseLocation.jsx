/**
 * ChooseLocation — DHL "Choose your location" full-page picker.
 *
 * This page replaces the popover/combobox picker for the primary country
 * switch. Layout mirrors dhl.com/global-en/home/country-selector.html:
 *
 *   ┌────────────────────────────────────────────────────┐
 *   │ Choose your location                                │
 *   │ Select your market below, those sites that only     │
 *   │ have our DHL Express division are marked with ↗     │
 *   │                                                     │
 *   │ Jump to                                             │
 *   │ ┌────────┐ ┌────────┐ ┌────────┐                    │
 *   │ │ A - D  │ │ I - L  │ │ Q - T  │                    │
 *   │ │ E - H  │ │ M - P  │ │ U - Z  │                    │
 *   │ └────────┘ └────────┘ └────────┘                    │
 *   │                                                     │
 *   │ A                                                   │
 *   │ Afghanistan >       Angola >        Aruba ↗ >       │
 *   │ Albania >           Anguilla ↗ >    Australia >     │
 *   │ …                                                   │
 *   └────────────────────────────────────────────────────┘
 *
 * Selecting a row sets the country in CountryContext (persisted to
 * localStorage) and navigates back to the page the user came from
 * (router state). External-marked entries open dhl.com in a new tab
 * rather than switching state — they represent DHL Express-only
 * regions whose sites live outside this demo.
 *
 * The page is reachable as a public route at `/choose-location` so the
 * unauthenticated landing page can link into it as well.
 */
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, ExternalLink } from "lucide-react";
import {
  COUNTRIES_BY_LETTER,
  JUMP_TO_BUCKETS,
} from "@/data/countries";
import { useCountry } from "@/contexts/CountryContext";

const ChooseLocation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCountry } = useCountry();

  // Remember where the user came from so we can return them there after
  // they pick a country. Default to "/" when no referrer is present.
  const returnTo = location.state?.from || "/";

  // Refs for each letter section so the Jump-to chips can scroll to them.
  const letterRefs = useRef({});

  // Scroll page to top on mount (in case it's reached from a deep scroll
  // position on the previous page).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handlePick = (c) => {
    if (c.external) {
      // External DHL Express division — open the public DHL country site
      // in a new tab rather than switching demo state.
      const url = `https://www.dhl.com/${(c.flagCode || c.code).toLowerCase()}-en/home.html`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setCountry(c.code);
    navigate(returnTo, { replace: true });
  };

  const handleJump = (bucket) => {
    // Find the first letter section that falls in this bucket and scroll
    // to it. Bucket ranges (e.g. "A"–"D") are inclusive.
    const first = COUNTRIES_BY_LETTER.find(
      (g) => g.letter >= bucket.from && g.letter <= bucket.to
    );
    if (!first) return;
    const node = letterRefs.current[first.letter];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Render-time: pre-compute the 3 jump-to columns DHL uses (two chips per
  // column, six chips total). We slice the 6-bucket array into [0..2], [2..4],
  // [4..6] so the visual layout is two rows × three columns on desktop.
  const jumpToColumns = useMemo(
    () => [
      [JUMP_TO_BUCKETS[0], JUMP_TO_BUCKETS[1]],
      [JUMP_TO_BUCKETS[2], JUMP_TO_BUCKETS[3]],
      [JUMP_TO_BUCKETS[4], JUMP_TO_BUCKETS[5]],
    ],
    []
  );

  return (
    <div className="min-h-screen bg-white" data-testid="choose-location-page">
      {/* Top yellow strip — matches DHL's site-wide header band. */}
      <div className="h-2 bg-dhl-yellow w-full" />

      {/* Main content column. DHL uses a centred ~1140px container. */}
      <main className="max-w-[1140px] mx-auto px-6 py-10">
        <h1
          className="text-[40px] leading-tight font-extrabold text-dhl-text mb-3"
          data-testid="choose-location-heading"
        >
          Choose your location
        </h1>
        <p className="text-sm text-stone-700 mb-8 max-w-3xl">
          Select your market below, those sites that only have our DHL
          Express division are marked with{" "}
          <span className="inline-flex items-center align-baseline">
            <ExternalLink className="w-3.5 h-3.5 mx-0.5" />
          </span>{" "}
          external icon
        </p>

        {/* "Jump to" letter chips */}
        <section className="mb-10" aria-label="Jump to letter group">
          <h2 className="text-sm font-bold text-dhl-text mb-3">Jump to</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2">
            {jumpToColumns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-2">
                {col.map((bucket) => (
                  <button
                    key={bucket.id}
                    type="button"
                    onClick={() => handleJump(bucket)}
                    data-testid={`jump-to-${bucket.id}`}
                    className="w-full flex items-center justify-between text-left text-sm text-dhl-red font-medium border-b border-stone-200 hover:border-dhl-red pb-2 transition-colors"
                  >
                    <span>{bucket.label}</span>
                    <span aria-hidden="true" className="text-dhl-red">↓</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Letter sections */}
        {COUNTRIES_BY_LETTER.map(({ letter, items }) => (
          <section
            key={letter}
            ref={(node) => {
              if (node) letterRefs.current[letter] = node;
            }}
            className="mb-10"
            data-testid={`letter-section-${letter}`}
            aria-label={`Countries starting with ${letter}`}
          >
            <h2 className="text-3xl font-extrabold text-dhl-text mb-4">{letter}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">
              {items.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handlePick(c)}
                  data-testid={`country-link-${c.code}`}
                  data-external={c.external ? "true" : "false"}
                  className="w-full flex items-center justify-between text-left text-sm text-dhl-text border-b border-stone-200 py-2.5 hover:text-dhl-red transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{c.name}</span>
                    {c.external && (
                      <ExternalLink
                        className="w-3 h-3 text-dhl-muted group-hover:text-dhl-red"
                        aria-label="External"
                      />
                    )}
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-dhl-red shrink-0" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default ChooseLocation;
