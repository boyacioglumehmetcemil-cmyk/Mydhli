import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { formatPGK, SERVICE_LABELS } from "@/lib/shipmentUtils";

const Quote = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [originCities, setOriginCities] = useState([]);
  const [destCities, setDestCities] = useState([]);
  const [form, setForm] = useState({
    originCountry: "PG", originCity: "Port Moresby",
    destinationCountry: "AU", destinationCity: "Sydney",
    weightKg: 5, length: 30, width: 20, height: 15, declaredValueUSD: 250,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/locations/countries").then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.originCountry) api.get(`/locations/cities?country=${form.originCountry}`).then(r => setOriginCities(r.data));
  }, [form.originCountry]);

  useEffect(() => {
    if (form.destinationCountry) api.get(`/locations/cities?country=${form.destinationCountry}`).then(r => setDestCities(r.data));
  }, [form.destinationCountry]);

  // Debounced quote fetch
  useEffect(() => {
    if (!form.originCity || !form.destinationCity || !form.weightKg) return;
    const t = setTimeout(() => {
      setLoading(true);
      api.post("/quotes", form).then(r => setResult(r.data)).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [form]);

  const applyQuote = (opt) => {
    navigate("/dashboard/ship", {
      state: {
        fromQuote: true,
        sender: { country: form.originCountry, city: form.originCity },
        receiver: { country: form.destinationCountry, city: form.destinationCity },
        package: { weightKg: form.weightKg, l: form.length, w: form.width, h: form.height, declaredValueUSD: form.declaredValueUSD },
        service: opt.service,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto" data-testid="quote-page">
      <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter mb-2">
        Get a Quote
      </h1>
      <p className="text-sm text-dhl-muted mb-7">Live rates between 220+ countries. No account or sign-up required to estimate.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: form */}
        <div className="bg-white border border-dhl-border p-6 space-y-5">
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

          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-red">Package</div>
          <Field label={`Weight: ${form.weightKg} kg`}>
            <input type="range" min="0.5" max="50" step="0.5" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: Number(e.target.value) })} className="w-full" data-testid="quote-weight" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="L (cm)"><Input type="number" value={form.length} data-testid="quote-l" onChange={e => setForm({ ...form, length: Number(e.target.value) })} /></Field>
            <Field label="W (cm)"><Input type="number" value={form.width} data-testid="quote-w" onChange={e => setForm({ ...form, width: Number(e.target.value) })} /></Field>
            <Field label="H (cm)"><Input type="number" value={form.height} data-testid="quote-h" onChange={e => setForm({ ...form, height: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Declared Value (USD)"><Input type="number" value={form.declaredValueUSD} data-testid="quote-value" onChange={e => setForm({ ...form, declaredValueUSD: Number(e.target.value) })} /></Field>
        </div>

        {/* Right: results */}
        <div className="space-y-4" data-testid="quote-results">
          <div className="bg-dhl-ink text-white p-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-yellow">Live Estimate</div>
              <div className="font-display text-xl font-black">
                {result ? `${form.originCity} → ${form.destinationCity}` : "Pick a route"}
              </div>
            </div>
            {loading && <Loader2 className="w-5 h-5 animate-spin text-dhl-yellow" />}
          </div>

          {result?.options?.map(opt => (
            <div key={opt.service} data-testid={`quote-card-${opt.service}`} className="bg-white border border-dhl-border p-5 hover:border-dhl-yellow transition-colors">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="font-display font-bold text-lg text-dhl-text">{opt.serviceName}</div>
                  <div className="text-xs text-dhl-muted mt-0.5">{opt.description}</div>
                  <div className="text-xs font-bold text-dhl-red mt-2 uppercase tracking-wider">Transit: {opt.transitDays} day{opt.transitDays > 1 ? "s" : ""} · ETA {opt.estimatedDelivery}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-black text-dhl-text">{formatPGK(opt.pricePGK)}</div>
                </div>
              </div>
              <Button
                onClick={() => applyQuote(opt)}
                data-testid={`use-quote-${opt.service}`}
                className="w-full h-10 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink"
              >
                Use This Quote — Ship Now <ArrowRight className="ml-2 w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          {result && (
            <div className="text-xs text-dhl-muted bg-dhl-panel p-4">
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
