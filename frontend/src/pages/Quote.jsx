import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calculator, ArrowRight, Loader2, Plane, Ship, Truck, Leaf, Clock } from "lucide-react";
import PageBanner from "@/components/PageBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { SERVICE_LABELS } from "@/lib/shipmentUtils";
import { useCountry } from "@/contexts/CountryContext";

const MODE_META = {
  AIR:   { icon: Plane, label: "Air freight",   accent: "bg-dhl-yellow text-dhl-ink",  desc: "Time-critical · HAWB tracked" },
  OCEAN: { icon: Ship,  label: "Ocean freight", accent: "bg-dhl-red text-white",       desc: "FCL / LCL · weekly sailings" },
  ROAD:  { icon: Truck, label: "Road freight",  accent: "bg-dhl-ink text-dhl-yellow",  desc: "Domestic + cross-border" },
};

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "SGD", "AUD", "JPY", "CNY", "PGK"];

const Quote = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Demo: amounts re-labelled in selected country's currency without FX conversion.
  const { formatCurrency } = useCountry();
  // Phase 8.2.2 — landing's mode CTAs route here with ?mode=AIR|OCEAN|ROAD.
  // We surface it as an eyebrow + tag on the result card; the multi-mode
  // comparison still renders all three modes side by side.
  const preselectedMode = (searchParams.get("mode") || "").toUpperCase();
  const validModes = ["AIR", "OCEAN", "ROAD"];
  const focusMode = validModes.includes(preselectedMode) ? preselectedMode : null;
  const [countries, setCountries] = useState([]);
  const [originCities, setOriginCities] = useState([]);
  const [destCities, setDestCities] = useState([]);
  const [form, setForm] = useState({
    originCountry: "AU", originCity: "Sydney",
    destinationCountry: "SG", destinationCity: "Singapore",
    weightKg: 5, cbm: 0, length: 30, width: 20, height: 15,
    declaredValueUSD: 250, currency: "USD",
  });
  const [result, setResult] = useState(null);
  const [multiResult, setMultiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [multiLoading, setMultiLoading] = useState(false);

  useEffect(() => {
    api.get("/locations/countries").then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.originCountry) api.get(`/locations/cities?country=${form.originCountry}`).then(r => setOriginCities(r.data));
  }, [form.originCountry]);

  useEffect(() => {
    if (form.destinationCountry) api.get(`/locations/cities?country=${form.destinationCountry}`).then(r => setDestCities(r.data));
  }, [form.destinationCountry]);

  // Debounced legacy parcel quote fetch (kept for the Air parcel card detail)
  useEffect(() => {
    if (!form.originCity || !form.destinationCity || !form.weightKg) return;
    const t = setTimeout(() => {
      setLoading(true);
      api.post("/quotes", form).then(r => setResult(r.data)).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [form]);

  const compareAllModes = () => {
    if (!form.originCountry || !form.originCity || !form.destinationCountry || !form.destinationCity) return;
    setMultiLoading(true);
    api.post("/quotes/multi-mode", {
      originCountry: form.originCountry, originCity: form.originCity,
      destinationCountry: form.destinationCountry, destinationCity: form.destinationCity,
      weightKg: form.weightKg, cbm: form.cbm || null,
    }).then(r => setMultiResult(r.data)).finally(() => setMultiLoading(false));
  };

  // Auto-trigger comparison once required fields exist
  useEffect(() => {
    const t = setTimeout(compareAllModes, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.originCountry, form.originCity, form.destinationCountry, form.destinationCity, form.weightKg, form.cbm]);

  const bookMode = (mode) => {
    navigate("/dashboard/ship", {
      state: {
        fromQuote: true, mode,
        sender: { country: form.originCountry, city: form.originCity },
        receiver: { country: form.destinationCountry, city: form.destinationCity },
        package: { weightKg: form.weightKg, l: form.length, w: form.width, h: form.height,
                    declaredValueUSD: form.declaredValueUSD, cbm: form.cbm },
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid="quote-page">
      <PageBanner title="Quote & Compare" icon={Calculator} data-testid="quote-page-banner" />

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        {/* Left: form */}
        <div className="bg-white border border-dhl-border p-6 space-y-5 rounded-lg">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-red">Origin</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Country">
              <Select value={form.originCountry} onValueChange={v => setForm({ ...form, originCountry: v, originCity: "" })}>
                <SelectTrigger data-testid="quote-origin-country"><SelectValue /></SelectTrigger>
                <SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="City">
              <Select value={form.originCity} onValueChange={v => setForm({ ...form, originCity: v })}>
                <SelectTrigger data-testid="quote-origin-city"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{originCities.map(c => <SelectItem key={c.code} value={c.city}>{c.city} ({c.code})</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-red">Destination</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Country">
              <Select value={form.destinationCountry} onValueChange={v => setForm({ ...form, destinationCountry: v, destinationCity: "" })}>
                <SelectTrigger data-testid="quote-dest-country"><SelectValue /></SelectTrigger>
                <SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="City">
              <Select value={form.destinationCity} onValueChange={v => setForm({ ...form, destinationCity: v })}>
                <SelectTrigger data-testid="quote-dest-city"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{destCities.map(c => <SelectItem key={c.code} value={c.city}>{c.city} ({c.code})</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-red">Cargo</div>
          <Field label={`Weight: ${form.weightKg} kg`}>
            <input type="range" min="0.5" max="5000" step="0.5" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: Number(e.target.value) })} className="w-full" data-testid="quote-weight" />
          </Field>
          <Field label={`Volume (CBM, optional)`}>
            <Input type="number" min="0" step="0.1" value={form.cbm} data-testid="quote-cbm" onChange={e => setForm({ ...form, cbm: Number(e.target.value) })} placeholder="e.g. 1.5" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="L (cm)"><Input type="number" value={form.length} data-testid="quote-l" onChange={e => setForm({ ...form, length: Number(e.target.value) })} /></Field>
            <Field label="W (cm)"><Input type="number" value={form.width} data-testid="quote-w" onChange={e => setForm({ ...form, width: Number(e.target.value) })} /></Field>
            <Field label="H (cm)"><Input type="number" value={form.height} data-testid="quote-h" onChange={e => setForm({ ...form, height: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Declared value">
              <Input type="number" value={form.declaredValueUSD} data-testid="quote-value" onChange={e => setForm({ ...form, declaredValueUSD: Number(e.target.value) })} />
            </Field>
            <Field label="Currency">
              <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                <SelectTrigger data-testid="quote-currency"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        {/* Right: results */}
        <div className="space-y-4" data-testid="quote-results">
          <div className="bg-dhl-ink text-white p-5 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-yellow">Live estimate</div>
              <div className="font-display text-xl font-bold">
                {result ? `${form.originCity} → ${form.destinationCity}` : "Pick a route"}
              </div>
            </div>
            {(loading || multiLoading) && <Loader2 className="w-5 h-5 animate-spin text-dhl-yellow" />}
          </div>

          {/* Multi-mode comparison strip */}
          {multiResult && (
            <div className="space-y-3" data-testid="quote-multi-mode">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-dhl-muted">
                Compare all modes — fastest · cheapest · greenest
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {multiResult.quotes.map(q => {
                  const meta = MODE_META[q.mode];
                  const Icon = meta.icon;
                  const isFastest  = multiResult.fastest === q.mode;
                  const isCheapest = multiResult.cheapest === q.mode;
                  const isGreenest = multiResult.greenest === q.mode;
                  return (
                    <div
                      key={q.mode}
                      data-testid={`quote-mode-${q.mode.toLowerCase()}`}
                      className="bg-white border-2 border-dhl-border hover:border-dhl-yellow transition-colors p-4 rounded-lg relative"
                    >
                      {(isCheapest || isFastest || isGreenest) && (
                        <div className="absolute -top-2 left-3 flex gap-1">
                          {isFastest  && <span className="bg-dhl-yellow text-dhl-ink text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">Fastest</span>}
                          {isCheapest && <span className="bg-dhl-red    text-white    text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">Cheapest</span>}
                          {isGreenest && <span className="bg-dhl-green   text-white    text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">Greenest</span>}
                        </div>
                      )}
                      <div className={`w-9 h-9 ${meta.accent} flex items-center justify-center rounded-md mb-3 mt-2`}>
                        <Icon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="font-display font-bold text-dhl-text text-base mb-0.5">{meta.label}</div>
                      <div className="text-[11px] text-dhl-muted mb-3">{meta.desc}</div>
                      <div className="font-display text-2xl font-bold text-dhl-text leading-none">
                        {formatCurrency(q.pricePGK)}
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-dhl-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {q.transitDaysMin}–{q.transitDaysMax}d
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-dhl-green" /> {q.co2EstimateKg} kg CO₂e
                        </span>
                      </div>
                      <Button
                        onClick={() => bookMode(q.mode)}
                        data-testid={`quote-book-${q.mode.toLowerCase()}`}
                        className="w-full mt-3 h-9 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-md font-bold text-xs border-2 border-dhl-ink"
                      >
                        Book this mode <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legacy air-freight service-level options (kept) */}
          {result?.options && result.options.length > 0 && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-dhl-muted pt-3">
                Service-level (air freight)
              </div>
              {result.options.map(opt => (
                <div key={opt.service} data-testid={`quote-card-${opt.service}`} className="bg-white border border-dhl-border p-5 rounded-lg hover:border-dhl-yellow transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-display font-bold text-base text-dhl-text">{SERVICE_LABELS[opt.service] || opt.serviceName}</div>
                      <div className="text-xs text-dhl-muted mt-0.5">{opt.description}</div>
                      <div className="text-[11px] font-bold text-dhl-red mt-2 uppercase tracking-wider">
                        Transit: {opt.transitDays} day{opt.transitDays > 1 ? "s" : ""} · ETA {opt.estimatedDelivery}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-xl font-bold text-dhl-text">{formatCurrency(opt.pricePGK)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {result && (
            <div className="text-xs text-dhl-muted bg-dhl-panel p-3 rounded-md">
              Chargeable weight: <span className="font-bold text-dhl-text">{result.chargeableKg} kg</span> · Volumetric: {result.volumetricKg} kg · Distance factor: {result.distanceFactor}×
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-1.5 block">{label}</Label>
    {children}
  </div>
);

export default Quote;
