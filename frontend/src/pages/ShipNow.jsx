import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Loader2, Package, Truck, FileText, CreditCard, MapPin, User, FileCheck, Plane, Ship, Leaf } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { COUNTRIES } from "@/data/countries";

// Set of valid ISO alpha-2 country codes for the prefill validator.
const VALID_COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

// Phase 8.2 — 5-step wizard: Mode → Origin → Destination → Cargo → Customs → Review
const STEPS = [
  { key: "mode",     label: "Mode",         icon: Truck },
  { key: "sender",   label: "Origin",       icon: User },
  { key: "receiver", label: "Destination",  icon: MapPin },
  { key: "package",  label: "Cargo",        icon: Package },
  { key: "customs",  label: "Customs",      icon: FileText },
  { key: "confirm",  label: "Review",       icon: CreditCard },
];

const MODE_META = {
  AIR:   { icon: Plane, label: "Air freight",   sub: "Time-critical · HAWB tracked",      accent: "bg-dhl-yellow text-dhl-ink"  },
  OCEAN: { icon: Ship,  label: "Ocean freight", sub: "FCL / LCL · weekly sailings",       accent: "bg-dhl-red text-white"       },
  ROAD:  { icon: Truck, label: "Road freight",  sub: "Domestic + cross-border milk-runs", accent: "bg-dhl-ink text-dhl-yellow"  },
};

const INCOTERMS = ["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"];
const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "SGD", "AUD", "JPY", "CNY", "PGK"];
const ULD_TYPES = ["LD3", "LD7", "PMC", "LOOSE"];
const CONTAINER_TYPES = ["20GP", "40GP", "40HC", "20RF", "LCL"];
const TRUCK_TYPES = ["BOX_TRUCK", "FLATBED", "REEFER", "CONTAINER_CHASSIS"];
const DRAFT_KEY = "dhl_ship_draft_v2";

const blankParty = {
  name: "", company: "", address: "", city: "", country: "AU",
  postalCode: "", phone: "", email: "",
};

const ShipNow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state: incomingState } = useLocation();
  const [searchParams] = useSearchParams();

  // Read `?from=XX&to=XX` from the URL once on mount so the dashboard's
  // green "Next" handoff can pre-route the booking. Invalid codes are
  // silently ignored so unrelated query params never break the wizard.
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const fromValid = !!fromParam && VALID_COUNTRY_CODES.has(fromParam.toUpperCase());
  const toValid = !!toParam && VALID_COUNTRY_CODES.has(toParam.toUpperCase());

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(incomingState?.mode || "AIR");
  const [countries, setCountries] = useState([]);
  const [originCities, setOriginCities] = useState([]);
  const [destCities, setDestCities] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);

  const [sender, setSender] = useState(() => ({
    ...blankParty,
    name: user ? `${user.firstName} ${user.lastName}` : "",
    company: user?.companyName || "",
    phone: user?.phone || "",
    email: user?.email || "",
    // If the dashboard handoff supplied a valid `?from=` code, honour it
    // here so the country select renders Germany (etc.) on first paint.
    country: fromValid ? fromParam.toUpperCase() : blankParty.country,
  }));
  const [receiver, setReceiver] = useState(() => ({
    ...blankParty,
    country: toValid ? toParam.toUpperCase() : blankParty.country,
  }));
  const [pkg, setPkg] = useState({
    pieces: 1, weightKg: 25, l: 60, w: 40, h: 30,
    description: "General cargo", declaredValueUSD: 500, cbm: 0,
  });
  const [specifics, setSpecifics] = useState({
    air:   { uldType: "LOOSE",       chargeableWeightKg: 25, awbType: "HAWB" },
    ocean: { containerType: "LCL",   cbm: 1.0, grossWeightKg: 25, bolType: "SEA_WAYBILL" },
    road:  { truckType: "BOX_TRUCK", pallets: 1, crossBorder: false },
  });
  const [customs, setCustoms] = useState({
    commodity: "", hsCode: "", cargoDescription: "",
    incoterm: "DAP", currency: "USD",
    originPort: "", destinationPort: "",
  });
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    api.get("/locations/countries").then(r => setCountries(r.data)).catch(() => {});
    api.get("/addresses").then(r => setAddresses(r.data)).catch(() => {});
    if (incomingState?.fromQuote) {
      const { sender: s, receiver: r, package: p, mode: m } = incomingState;
      if (s) setSender(prev => ({ ...prev, ...s }));
      if (r) setReceiver(prev => ({ ...prev, ...r }));
      if (p) setPkg(prev => ({ ...prev, ...p }));
      if (m) setMode(m);
    } else {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (draft) {
          draft.sender && setSender(draft.sender);
          draft.receiver && setReceiver(draft.receiver);
          draft.pkg && setPkg(draft.pkg);
          draft.mode && setMode(draft.mode);
          draft.specifics && setSpecifics(draft.specifics);
          draft.customs && setCustoms(draft.customs);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ sender, receiver, pkg, mode, specifics, customs }));
  }, [sender, receiver, pkg, mode, specifics, customs]);

  useEffect(() => {
    if (sender.country) api.get(`/locations/cities?country=${sender.country}`).then(r => setOriginCities(r.data)).catch(() => {});
  }, [sender.country]);

  useEffect(() => {
    if (receiver.country) api.get(`/locations/cities?country=${receiver.country}`).then(r => setDestCities(r.data)).catch(() => {});
  }, [receiver.country]);

  const canNext = () => {
    const cur = STEPS[step].key;
    if (cur === "mode") return !!mode;
    if (cur === "sender") return sender.name && sender.address && sender.city && sender.country;
    if (cur === "receiver") return receiver.name && receiver.address && receiver.city && receiver.country;
    if (cur === "package") return pkg.pieces > 0 && pkg.weightKg > 0;
    if (cur === "customs") return true;
    if (cur === "confirm") return agree;
    return false;
  };

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const fillFromAddress = (addr, target) => {
    const obj = {
      name: addr.name, company: addr.company, address: addr.address,
      city: addr.city, country: addr.country, postalCode: addr.postalCode,
      phone: addr.phone, email: addr.email,
    };
    target === "sender" ? setSender(obj) : setReceiver(obj);
  };

  const onSubmit = async () => {
    setCreating(true);
    try {
      const modeKey = mode === "AIR" ? "airSpecifics" :
                      mode === "OCEAN" ? "oceanSpecifics" : "roadSpecifics";
      const body = {
        mode,
        sender, receiver,
        package: {
          pieces: pkg.pieces, weightKg: pkg.weightKg,
          dimensions: { l: pkg.l, w: pkg.w, h: pkg.h },
          description: pkg.description,
          declaredValueUSD: pkg.declaredValueUSD,
        },
        incoterms: customs.incoterm,
        commodity: customs.commodity || null,
        hsCode: customs.hsCode || null,
        cargoDescription: customs.cargoDescription || null,
        originPort: customs.originPort || null,
        destinationPort: customs.destinationPort || null,
        [modeKey]: specifics[mode.toLowerCase()],
      };
      const res = await api.post("/bookings", body);
      localStorage.removeItem(DRAFT_KEY);
      setSuccess(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not create booking");
    } finally {
      setCreating(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto" data-testid="shipnow-success">
        <div className="bg-white border-2 border-dhl-green p-10 text-center rounded-lg">
          <div className="w-20 h-20 bg-dhl-green rounded-full mx-auto mb-6 flex items-center justify-center">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-dhl-green mb-2">Booking confirmed</div>
          <h1 className="font-display text-3xl font-bold text-dhl-text mb-3">Your booking is ready.</h1>
          <div className="font-mono text-2xl font-bold text-dhl-red mb-1" data-testid="success-booking-ref">{success.bookingReference || success.awb}</div>
          {success.bookingReference && (
            <div className="font-mono text-sm text-dhl-muted mb-1" data-testid="success-awb">AWB: {success.awb}</div>
          )}
          <p className="text-sm text-dhl-muted mb-2">
            {success.mode} · {success.sender.city} → {success.receiver.city}
          </p>
          {success.co2EstimateKg != null && (
            <p className="inline-flex items-center gap-1.5 text-xs text-dhl-green font-bold mb-6">
              <Leaf className="w-3.5 h-3.5" /> {success.co2EstimateKg} kg CO₂e estimated
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-3">
            <Button data-testid="success-view-shipment"
              onClick={() => navigate(`/dashboard/shipments/${success.awb}`)}
              className="h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-md font-bold text-sm px-6 border-2 border-dhl-ink">
              View booking <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="ghost"
              onClick={() => { setSuccess(null); setStep(0); setReceiver(blankParty); }}
              className="h-12 font-bold text-xs">
              Book another shipment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const curKey = STEPS[step].key;
  const ModeIcon = MODE_META[mode].icon;

  return (
    <div className="max-w-5xl mx-auto" data-testid="shipnow-page">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-dhl-red mb-2">myDHLi</div>
      <h1 className="font-display text-3xl lg:text-4xl font-bold text-dhl-text leading-tight tracking-tight mb-2">
        Book a freight shipment
      </h1>
      <p className="text-sm text-dhl-muted mb-7">
        Choose a mode, fill in the route and cargo, review your CO₂ estimate, and confirm.
      </p>

      {/* Progress */}
      <div className="mb-8 bg-white border border-dhl-border p-4 lg:p-5 rounded-lg">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.key} className="flex items-center gap-2 shrink-0" data-testid={`step-indicator-${s.key}`}>
                <div className={`w-9 h-9 flex items-center justify-center transition-colors rounded-md ${
                  done ? "bg-dhl-green text-white" : active ? "bg-dhl-yellow text-dhl-ink border-2 border-dhl-ink" : "bg-dhl-panel text-dhl-muted border border-dhl-border"
                }`}>
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider hidden lg:block ${active ? "text-dhl-text" : "text-dhl-muted"}`}>{s.label}</div>
                {i < STEPS.length - 1 && <div className={`w-6 lg:w-12 h-px ${done ? "bg-dhl-green" : "bg-dhl-border"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-dhl-border p-6 lg:p-8 rounded-lg" data-testid={`step-${curKey}`}>
        {curKey === "mode" && (
          <>
            <h2 className="font-display text-2xl font-bold text-dhl-text mb-1">Pick the freight mode</h2>
            <p className="text-sm text-dhl-muted mb-5">Air, ocean or road. We'll tailor the rest of the form to your choice.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(MODE_META).map(([key, m]) => {
                const Icon = m.icon;
                const active = mode === key;
                return (
                  <button type="button" key={key} data-testid={`mode-card-${key.toLowerCase()}`}
                    onClick={() => setMode(key)}
                    className={`text-left p-5 border-2 transition-all rounded-lg ${
                      active ? "border-dhl-ink shadow-[6px_6px_0px_0px_#FFCC00]" : "border-dhl-border hover:border-dhl-ink"
                    }`}>
                    <div className={`w-11 h-11 ${m.accent} rounded-md flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="font-display text-lg font-bold text-dhl-text">{m.label}</div>
                    <div className="text-xs text-dhl-muted mt-1">{m.sub}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {curKey === "sender" && (
          <div data-testid={fromValid ? "ship-from-prefilled" : undefined}>
            <h2 className="font-display text-2xl font-bold text-dhl-text mb-1">Where's it shipping from?</h2>
            <p className="text-sm text-dhl-muted mb-5">Pick from your address book to autofill.</p>
            {addresses.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2" data-testid="sender-addressbook">
                <span className="text-xs font-bold uppercase tracking-wider text-dhl-muted self-center mr-1">Address book:</span>
                {addresses.map(a => (
                  <button key={a.id} type="button" onClick={() => fillFromAddress(a, "sender")} className="text-xs px-3 py-1.5 bg-dhl-panel border border-dhl-border hover:border-dhl-yellow rounded-md">
                    {a.label}{a.isDefaultSender && <span className="ml-1 text-dhl-red">·default</span>}
                  </button>
                ))}
              </div>
            )}
            <PartyForm party={sender} setParty={setSender} cities={originCities} countries={countries} prefix="sender" />
          </div>
        )}

        {curKey === "receiver" && (
          <>
            <h2 className="font-display text-2xl font-bold text-dhl-text mb-1">Who's receiving it?</h2>
            <p className="text-sm text-dhl-muted mb-5">Enter consignee details below.</p>
            {addresses.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2" data-testid="receiver-addressbook">
                <span className="text-xs font-bold uppercase tracking-wider text-dhl-muted self-center mr-1">Address book:</span>
                {addresses.map(a => (
                  <button key={a.id} type="button" onClick={() => fillFromAddress(a, "receiver")} className="text-xs px-3 py-1.5 bg-dhl-panel border border-dhl-border hover:border-dhl-yellow rounded-md">
                    {a.label}{a.isDefaultReceiver && <span className="ml-1 text-dhl-red">·default</span>}
                  </button>
                ))}
              </div>
            )}
            <PartyForm party={receiver} setParty={setReceiver} cities={destCities} countries={countries} prefix="receiver" />
          </>
        )}

        {curKey === "package" && (
          <>
            <h2 className="font-display text-2xl font-bold text-dhl-text mb-1">Cargo details · <span className="text-dhl-red">{MODE_META[mode].label}</span></h2>
            <p className="text-sm text-dhl-muted mb-5">Pieces, weight and mode-specific equipment.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <Field label="Pieces"><Input type="number" min="1" value={pkg.pieces} data-testid="pkg-pieces" onChange={e => setPkg({ ...pkg, pieces: Number(e.target.value) })} /></Field>
              <Field label="Total weight (kg)"><Input type="number" min="0.1" step="0.1" value={pkg.weightKg} data-testid="pkg-weight" onChange={e => setPkg({ ...pkg, weightKg: Number(e.target.value) })} /></Field>
              <Field label="Volume (CBM)"><Input type="number" min="0" step="0.1" value={pkg.cbm} data-testid="pkg-cbm" onChange={e => setPkg({ ...pkg, cbm: Number(e.target.value) })} /></Field>
              <Field label="Length (cm)"><Input type="number" value={pkg.l} data-testid="pkg-l" onChange={e => setPkg({ ...pkg, l: Number(e.target.value) })} /></Field>
              <Field label="Width (cm)"><Input type="number" value={pkg.w} data-testid="pkg-w" onChange={e => setPkg({ ...pkg, w: Number(e.target.value) })} /></Field>
              <Field label="Height (cm)"><Input type="number" value={pkg.h} data-testid="pkg-h" onChange={e => setPkg({ ...pkg, h: Number(e.target.value) })} /></Field>
              <Field label="Description" full><Input value={pkg.description} data-testid="pkg-desc" onChange={e => setPkg({ ...pkg, description: e.target.value })} /></Field>
              <Field label="Declared value"><Input type="number" min="0" value={pkg.declaredValueUSD} data-testid="pkg-value" onChange={e => setPkg({ ...pkg, declaredValueUSD: Number(e.target.value) })} /></Field>
            </div>

            <div className="border-t border-dhl-border pt-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-red mb-3">{mode} equipment</div>
              {mode === "AIR" && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="ULD type">
                    <Select value={specifics.air.uldType} onValueChange={v => setSpecifics({ ...specifics, air: { ...specifics.air, uldType: v }})}>
                      <SelectTrigger data-testid="air-uld"><SelectValue /></SelectTrigger>
                      <SelectContent>{ULD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Chargeable weight (kg)"><Input type="number" value={specifics.air.chargeableWeightKg} data-testid="air-chargeable" onChange={e => setSpecifics({ ...specifics, air: { ...specifics.air, chargeableWeightKg: Number(e.target.value) }})} /></Field>
                  <Field label="AWB type">
                    <Select value={specifics.air.awbType} onValueChange={v => setSpecifics({ ...specifics, air: { ...specifics.air, awbType: v }})}>
                      <SelectTrigger data-testid="air-awb-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HAWB">HAWB · House AWB</SelectItem>
                        <SelectItem value="MAWB">MAWB · Master AWB</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
              {mode === "OCEAN" && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Container type">
                    <Select value={specifics.ocean.containerType} onValueChange={v => setSpecifics({ ...specifics, ocean: { ...specifics.ocean, containerType: v }})}>
                      <SelectTrigger data-testid="ocean-container"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTAINER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="CBM"><Input type="number" step="0.1" value={specifics.ocean.cbm} data-testid="ocean-cbm" onChange={e => setSpecifics({ ...specifics, ocean: { ...specifics.ocean, cbm: Number(e.target.value) }})} /></Field>
                  <Field label="Gross weight (kg)"><Input type="number" value={specifics.ocean.grossWeightKg} data-testid="ocean-gross" onChange={e => setSpecifics({ ...specifics, ocean: { ...specifics.ocean, grossWeightKg: Number(e.target.value) }})} /></Field>
                  <Field label="Bill of lading">
                    <Select value={specifics.ocean.bolType} onValueChange={v => setSpecifics({ ...specifics, ocean: { ...specifics.ocean, bolType: v }})}>
                      <SelectTrigger data-testid="ocean-bol"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HBL">HBL · House BL</SelectItem>
                        <SelectItem value="MBL">MBL · Master BL</SelectItem>
                        <SelectItem value="SEA_WAYBILL">Sea waybill</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
              {mode === "ROAD" && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Truck type">
                    <Select value={specifics.road.truckType} onValueChange={v => setSpecifics({ ...specifics, road: { ...specifics.road, truckType: v }})}>
                      <SelectTrigger data-testid="road-truck"><SelectValue /></SelectTrigger>
                      <SelectContent>{TRUCK_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Pallets"><Input type="number" min="1" value={specifics.road.pallets} data-testid="road-pallets" onChange={e => setSpecifics({ ...specifics, road: { ...specifics.road, pallets: Number(e.target.value) }})} /></Field>
                  <Field label="Cross-border">
                    <Select value={String(specifics.road.crossBorder)} onValueChange={v => setSpecifics({ ...specifics, road: { ...specifics.road, crossBorder: v === "true" }})}>
                      <SelectTrigger data-testid="road-crossborder"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </div>
          </>
        )}

        {curKey === "customs" && (
          <>
            <h2 className="font-display text-2xl font-bold text-dhl-text mb-1">Customs & commercial</h2>
            <p className="text-sm text-dhl-muted mb-5">Optional for the demo, but completing this generates richer documents.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Field label="Incoterm">
                <Select value={customs.incoterm} onValueChange={v => setCustoms({ ...customs, incoterm: v })}>
                  <SelectTrigger data-testid="customs-incoterm"><SelectValue /></SelectTrigger>
                  <SelectContent>{INCOTERMS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Currency">
                <Select value={customs.currency} onValueChange={v => setCustoms({ ...customs, currency: v })}>
                  <SelectTrigger data-testid="customs-currency"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Commodity"><Input value={customs.commodity} data-testid="customs-commodity" onChange={e => setCustoms({ ...customs, commodity: e.target.value })} placeholder="e.g. Electronics — laptops" /></Field>
              <Field label="HS code"><Input value={customs.hsCode} data-testid="customs-hscode" onChange={e => setCustoms({ ...customs, hsCode: e.target.value })} placeholder="e.g. 847130" /></Field>
              <Field label="Origin port"><Input value={customs.originPort} data-testid="customs-origin-port" onChange={e => setCustoms({ ...customs, originPort: e.target.value.toUpperCase() })} placeholder={mode === "AIR" ? "SYD" : "AUSYD"} /></Field>
              <Field label="Destination port"><Input value={customs.destinationPort} data-testid="customs-dest-port" onChange={e => setCustoms({ ...customs, destinationPort: e.target.value.toUpperCase() })} placeholder={mode === "AIR" ? "SIN" : "SGSIN"} /></Field>
              <Field label="Cargo description" full><Input value={customs.cargoDescription} data-testid="customs-cargo-desc" onChange={e => setCustoms({ ...customs, cargoDescription: e.target.value })} placeholder="Detailed cargo description for customs" /></Field>
            </div>
          </>
        )}

        {curKey === "confirm" && (
          <>
            <h2 className="font-display text-2xl font-bold text-dhl-text mb-1">Review & confirm</h2>
            <p className="text-sm text-dhl-muted mb-5">One last look, then we generate your booking reference and AWB.</p>
            <div className="grid lg:grid-cols-2 gap-5 mb-6">
              <div className="bg-dhl-panel p-5 rounded-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted mb-2">From</div>
                <div className="font-bold text-dhl-text">{sender.name} · {sender.company}</div>
                <div className="text-sm text-dhl-muted">{sender.address}, {sender.city}, {sender.country}</div>
              </div>
              <div className="bg-dhl-panel p-5 rounded-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted mb-2">To</div>
                <div className="font-bold text-dhl-text">{receiver.name} · {receiver.company}</div>
                <div className="text-sm text-dhl-muted">{receiver.address}, {receiver.city}, {receiver.country}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-6">
              <div className="bg-dhl-panel p-4 rounded-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Mode</div>
                <div className="flex items-center gap-1.5 font-bold text-dhl-text mt-1">
                  <ModeIcon className="w-4 h-4 text-dhl-red" />
                  {MODE_META[mode].label}
                </div>
              </div>
              <div className="bg-dhl-panel p-4 rounded-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Cargo</div>
                <div className="font-bold text-dhl-text mt-1">{pkg.pieces} pc · {pkg.weightKg} kg</div>
              </div>
              <div className="bg-dhl-panel p-4 rounded-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Incoterm</div>
                <div className="font-bold text-dhl-text mt-1">{customs.incoterm}</div>
              </div>
              <div className="bg-dhl-ink text-white p-4 rounded-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-yellow">Currency</div>
                <div className="font-display text-xl font-bold mt-1">{customs.currency}</div>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agree} onCheckedChange={v => setAgree(!!v)} data-testid="confirm-tnc"
                className="border-dhl-border data-[state=checked]:bg-dhl-yellow data-[state=checked]:text-dhl-ink data-[state=checked]:border-dhl-yellow rounded-md mt-1" />
              <span className="text-sm text-dhl-text">I confirm the booking details are correct and accept DHL Global Forwarding's terms of carriage.</span>
            </label>
          </>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-dhl-border">
          <Button variant="ghost" onClick={back} disabled={step === 0} data-testid="ship-back" className="font-bold text-xs">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canNext()} data-testid="ship-next"
              className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-md font-bold text-sm px-6 border-2 border-dhl-ink disabled:opacity-50">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={onSubmit} disabled={!canNext() || creating} data-testid="ship-submit"
              className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-md font-bold text-sm px-7 border-2 border-dhl-ink disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm booking <FileCheck className="ml-2 w-4 h-4" /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, full, children }) => (
  <div className={full ? "sm:col-span-2 lg:col-span-3" : ""}>
    <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-1.5 block">{label}</Label>
    {children}
  </div>
);

const PartyForm = ({ party, setParty, cities, countries, prefix }) => (
  <div className="grid sm:grid-cols-2 gap-4">
    <Field label="Full name"><Input value={party.name} data-testid={`${prefix}-name`} onChange={e => setParty({ ...party, name: e.target.value })} /></Field>
    <Field label="Company"><Input value={party.company} data-testid={`${prefix}-company`} onChange={e => setParty({ ...party, company: e.target.value })} /></Field>
    <Field label="Address" full><Input value={party.address} data-testid={`${prefix}-address`} onChange={e => setParty({ ...party, address: e.target.value })} /></Field>
    <Field label="Country">
      <Select value={party.country} onValueChange={v => setParty({ ...party, country: v, city: "" })}>
        <SelectTrigger data-testid={`${prefix}-country`}><SelectValue placeholder="Select country" /></SelectTrigger>
        <SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
    <Field label="City">
      <Select value={party.city} onValueChange={v => setParty({ ...party, city: v })}>
        <SelectTrigger data-testid={`${prefix}-city`}><SelectValue placeholder="Select city" /></SelectTrigger>
        <SelectContent>{cities.map(c => <SelectItem key={c.code} value={c.city}>{c.city} ({c.code})</SelectItem>)}</SelectContent>
      </Select>
    </Field>
    <Field label="Postal code"><Input value={party.postalCode} data-testid={`${prefix}-postal`} onChange={e => setParty({ ...party, postalCode: e.target.value })} /></Field>
    <Field label="Phone"><Input value={party.phone} data-testid={`${prefix}-phone`} onChange={e => setParty({ ...party, phone: e.target.value })} /></Field>
    <Field label="Email"><Input value={party.email} type="email" data-testid={`${prefix}-email`} onChange={e => setParty({ ...party, email: e.target.value })} /></Field>
  </div>
);

export default ShipNow;
