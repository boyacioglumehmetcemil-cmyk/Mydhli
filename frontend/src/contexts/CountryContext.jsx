/**
 * CountryContext — selected-country / currency state for the whole app.
 *
 * The DHL Global Forwarding pitch demo lets a visitor pivot the entire UI
 * to any of ~240 countries via the utility-bar picker. Picking a country
 * does NOT trigger real i18n routing or FX conversion — it simply re-labels
 * currency-formatted numbers in the selected country's tender. Backend
 * amounts continue to flow through as raw numbers; this context owns the
 * formatter.
 *
 * Persistence: the selected country code is mirrored to `localStorage` under
 * `dhl_country_code` so a hard refresh keeps the user's choice.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, findCountry } from "@/data/countries";

const STORAGE_KEY = "dhl_country_code";

const CountryContext = createContext(null);

const readInitialCode = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && COUNTRIES.some((c) => c.code === stored)) return stored;
  } catch (_) {
    // localStorage unavailable (private mode, SSR, etc.) — fall through.
  }
  return DEFAULT_COUNTRY_CODE;
};

export const CountryProvider = ({ children }) => {
  const [code, setCode] = useState(readInitialCode);

  // Mirror selection to localStorage so refresh-state survives.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (_) {
      // ignore — non-fatal.
    }
  }, [code]);

  const country = useMemo(() => findCountry(code), [code]);

  /**
   * Format a number as currency in the selected country's tender.
   *
   * Demo behaviour: amounts coming back from the backend are assumed to be
   * in the source currency (PGK for PNG-origin shipments). When the user
   * pivots to e.g. Germany we simply re-label the same numeric value as
   * EUR. No FX is applied — pricing parity is intentionally out of scope.
   *
   * Intl.NumberFormat supports every ISO 4217 currency in modern Node /
   * Chromium environments, but some niche codes can throw RangeError on
   * older runtimes. We fall back to a manual symbol+amount render.
   */
  const formatCurrency = useCallback(
    (amount) => {
      const num = Number(amount || 0);
      try {
        return new Intl.NumberFormat(country.locale, {
          style: "currency",
          currency: country.currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
      } catch (_) {
        // Intl rejected the currency code on this runtime. Format manually
        // using the country's symbol and a plain en-US grouped number so
        // the demo never crashes on obscure tenders.
        const grouped = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
        return `${country.currencySymbol}${grouped}`;
      }
    },
    [country]
  );

  const setCountry = useCallback((nextCode) => {
    setCode(nextCode);
  }, []);

  const value = useMemo(
    () => ({
      country,
      setCountry,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      locale: country.locale,
      formatCurrency,
    }),
    [country, setCountry, formatCurrency]
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
};

export const useCountry = () => {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
};
