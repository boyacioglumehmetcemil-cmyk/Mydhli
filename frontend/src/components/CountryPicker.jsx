/**
 * CountryPicker — DHL country chip that opens the full-page Choose
 * Location selector.
 *
 * On dhl.com, the country switch is not a dropdown — it's a link in the
 * top utility bar (e.g. "🇸🇬 Singapore") that opens a full "Choose your
 * location" page. We mirror that behaviour: this component now renders
 * a plain link/button that navigates to `/choose-location` and passes
 * the current route through `location.state.from` so the picker page
 * can return the user back when they pick.
 *
 * Three trigger variants are supported so we don't have to fork the
 * component everywhere it's used:
 *
 *   `chip`  — compact utility-bar pill (🇸🇬 Singapore ⌄) used in headers
 *   `row`   — full-width drawer row used in the mobile menu
 *   `field` — full-width form-input style used in Register/Login flows
 *
 * All three variants navigate to the same `/choose-location` route.
 */
import { ChevronDown, ChevronRight, Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { flagFor } from "@/data/countries";
import { useCountry } from "@/contexts/CountryContext";

const CountryPicker = ({ variant = "chip", className = "" }) => {
  const { country } = useCountry();
  const navigate = useNavigate();
  const location = useLocation();

  const goToPicker = () => {
    navigate("/choose-location", {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  // Trigger styles per variant. All three call the same handler.
  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={goToPicker}
        data-testid="country-picker-trigger"
        className={`w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-dhl-text hover:bg-dhl-panel ${className}`}
      >
        <span className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-dhl-muted" />
          <span>Country &amp; currency</span>
        </span>
        <span className="flex items-center gap-1.5 text-dhl-muted">
          <span aria-hidden="true">{flagFor(country)}</span>
          <span className="text-xs">{country.name}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </button>
    );
  }

  if (variant === "field") {
    return (
      <button
        type="button"
        onClick={goToPicker}
        data-testid="country-picker-trigger"
        className={`w-full h-12 px-4 inline-flex items-center justify-between bg-dhl-panel border-2 border-dhl-border focus:border-dhl-yellow focus:outline-none text-dhl-text font-medium transition-colors hover:border-dhl-yellow/60 ${className}`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg leading-none" aria-hidden="true">
            {flagFor(country)}
          </span>
          <span className="truncate">{country.name}</span>
        </span>
        <span className="flex items-center gap-2 text-dhl-muted shrink-0 pl-3">
          <span data-testid="country-picker-code" className="font-mono text-xs">
            {country.code}
          </span>
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>
    );
  }

  // Default: `chip` — the compact utility-bar link (DHL standard).
  return (
    <button
      type="button"
      onClick={goToPicker}
      data-testid="country-picker-trigger"
      className={`text-sm font-medium h-8 px-2 inline-flex items-center gap-1.5 rounded-sm hover:bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-dhl-red/40 ${className}`}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {flagFor(country)}
      </span>
      <span data-testid="country-picker-name">{country.name}</span>
    </button>
  );
};

export default CountryPicker;
