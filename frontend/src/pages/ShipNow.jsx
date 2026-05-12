import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Loader2, Package, Truck, FileText, CreditCard, MapPin, User, FileCheck } from "lucide-react";
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
import { formatPGK, SERVICE_LABELS } from "@/lib/shipmentUtils";

const STEPS = [
  { key: "sender", label: "Sender", icon: User },
  { key: "receiver", label: "Receiver", icon: MapPin },
  { key: "package", label: "Package", icon: Package },
  { key: "service", label: "Service", icon: Truck },
  { key: "customs", label: "Customs", icon: FileText },
  { key: "confirm", label: "Confirm & Pay", icon: CreditCard },
];

const DRAFT_KEY = "dhl_ship_draft_v1";

const blankParty = {
  name: "", company: "", address: "", city: "", country: "PG",
  postalCode: "", phone: "", email: "",
};

const ShipNow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state: incomingState } = useLocation();

  const [step, setStep] = useState(0);
  const [countries, setCountries] = useState([]);
  const [originCities, setOriginCities] = useState([]);
  const [destCities, setDestCities] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [quotes, setQuotes] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);

  const [sender, setSender] = useState(() => ({
    ...blankParty,
    name: user ? `${user.firstName} ${user.lastName}` : "",
    company: user?.companyName || "",
    phone: user?.phone || "",
    email: user?.email || "",
  }));
  const [receiver, setReceiver] = useState(blankParty);
  const [pkg, setPkg] = useState({
    pieces: 1, weightKg: 2.0,
    l: 30, w: 20, h: 15, description: "Commercial documents",
    declaredValueUSD: 100, packageType: "PARCEL",
  });
  const [service, setService] = useState("");
  const [customs, setCustoms] = useState({ reason: "sale", incoterm: "DAP", items: [] });
  const [payment, setPayment] = useState({ method: "account" });
  const [agree, setAgree] = useState(false);

  // Load reference data
  useEffect(() => {
    api.get("/locations/countries").then(r => setCountries(r.data)).catch(() => {});
    api.get("/addresses").then(r => setAddresses(r.data)).catch(() => {});
    // Restore draft / incoming state
    if (incomingState?.fromQuote) {
      // Pre-fill from quote page
      const { sender: s, receiver: r, package: p, service: sv } = incomingState;
      if (s) setSender({ ...sender, ...s });
      if (r) setReceiver({ ...receiver, ...r });
      if (p) setPkg({ ...pkg, ...p });
      if (sv) setService(sv);
    } else {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (draft) {
          draft.sender && setSender(draft.sender);
          draft.receiver && setReceiver(draft.receiver);
          draft.pkg && setPkg(draft.pkg);
          draft.service && setService(draft.service);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ sender, receiver, pkg, service }));
  }, [sender, receiver, pkg, service]);

  useEffect(() => {
    if (sender.country) api.get(`/locations/cities?country=${sender.country}`).then(r => setOriginCities(r.data)).catch(() => {});
  }, [sender.country]);

  useEffect(() => {
    if (receiver.country) api.get(`/locations/cities?country=${receiver.country}`).then(r => setDestCities(r.data)).catch(() => {});
  }, [receiver.country]);

  const isInternational = sender.country !== receiver.country;

  // Visible steps (skip customs if domestic)
  const visibleSteps = useMemo(
    () => STEPS.filter(s => s.key !== "customs" || isInternational),
    [isInternational],
  );

  // Fetch quotes when entering service step
  useEffect(() => {
    if (visibleSteps[step]?.key === "service" && sender.city && receiver.city) {
      setQuoteLoading(true);
      api.post("/quotes", {
        originCountry: sender.country, originCity: sender.city,
        destinationCountry: receiver.country, destinationCity: receiver.city,
        weightKg: pkg.weightKg, length: pkg.l, width: pkg.w, height: pkg.h,
        declaredValueUSD: pkg.declaredValueUSD,
      }).then(r => setQuotes(r.data)).catch(() => toast.error("Couldn't fetch quotes")).finally(() => setQuoteLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const selectedQuote = quotes?.options?.find(o => o.service === service);

  const canNext = () => {
    const cur = visibleSteps[step].key;
    if (cur === "sender") return sender.name && sender.address && sender.city && sender.country;
    if (cur === "receiver") return receiver.name && receiver.address && receiver.city && receiver.country;
    if (cur === "package") return pkg.pieces > 0 && pkg.weightKg > 0;
    if (cur === "service") return !!service;
    if (cur === "customs") return true; // optional
    if (cur === "confirm") return agree;
    return false;
  };

  const next = () => setStep(s => Math.min(visibleSteps.length - 1, s + 1));
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
      const body = {
        sender, receiver,
        package: {
          pieces: pkg.pieces,
          weightKg: pkg.weightKg,
          dimensions: { l: pkg.l, w: pkg.w, h: pkg.h },
          description: pkg.description,
          declaredValueUSD: pkg.declaredValueUSD,
        },
        service,
        paymentMethod: payment.method,
        costPGK: selectedQuote?.pricePGK || 0,
      };
      const res = await api.post("/shipments", body);
      localStorage.removeItem(DRAFT_KEY);
      setSuccess(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not create shipment");
    } finally {
      setCreating(false);
    }
  };

  const BACKEND = process.env.REACT_APP_BACKEND_URL;

  if (success) {
    return (
      <div className="max-w-3xl mx-auto" data-testid="shipnow-success">
        <div className="bg-white border-2 border-green-500 p-10 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-green-700 mb-2">Shipment Created</div>
          <h1 className="font-display text-3xl font-black text-dhl-text mb-3">Your AWB is ready.</h1>
          <div className="font-mono text-2xl font-bold text-dhl-red mb-1" data-testid="success-awb">{success.awb}</div>
          <p className="text-sm text-dhl-muted mb-8">
            Sender: {success.sender.city} → Receiver: {success.receiver.city} · {SERVICE_LABELS[success.service]}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              data-testid="success-view-shipment"
              onClick={() => navigate(`/dashboard/shipments/${success.awb}`)}
              className="h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-sm px-6 border-2 border-dhl-ink"
            >
              View Shipment <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              data-testid="success-print-label"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("dhl_auth_token");
                  const url = `${BACKEND}/api/shipments/${success.awb}/label.pdf`;
                  const res = await fetch(url, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  const blob = await res.blob();
                  const obj = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = obj;
                  a.download = `${success.awb}_label.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  setTimeout(() => URL.revokeObjectURL(obj), 1000);
                  toast.success("Label downloaded");
                } catch (e) {
                  toast.error("Could not download label", { description: String(e?.message || e) });
                }
              }}
              variant="outline"
              className="h-12 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white font-bold uppercase tracking-wider text-sm px-6 rounded-none"
            >
              <FileText className="mr-2 w-4 h-4" />
              Print Label (PDF)
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSuccess(null);
                setStep(0);
                setReceiver(blankParty);
              }}
              className="h-12 font-bold uppercase tracking-wider text-xs"
            >
              Ship Another
            </Button>
          </div>

          {/* More documents — compact 4-tile row */}
          <div className="mt-8 border-t border-dhl-border pt-6 text-left">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-dhl-muted">
                More documents
              </div>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/shipments/${success.awb}`)}
                data-testid="success-all-docs-link"
                className="text-[11px] font-semibold text-[#0EA5B7] hover:text-[#0B8C9C] transition-colors"
              >
                All 12 documents available in Shipment Details →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { slug: "airwaybill", label: "Air Waybill", Icon: FileText },
                { slug: "proforma", label: "Proforma", Icon: FileText },
                { slug: "commercial", label: "Commercial", Icon: FileText },
                { slug: "receipt", label: "Receipt", Icon: FileText },
              ].map((d) => (
                <button
                  type="button"
                  key={d.slug}
                  data-testid={`success-doc-${d.slug}`}
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("dhl_auth_token");
                      const url = `${BACKEND}/api/shipments/${success.awb}/documents/${d.slug}.pdf`;
                      const res = await fetch(url, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      const blob = await res.blob();
                      const obj = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = obj;
                      a.download = `${success.awb}_${d.slug}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      setTimeout(() => URL.revokeObjectURL(obj), 1000);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 border border-dhl-border bg-white hover:bg-dhl-yellow/10 hover:border-dhl-ink transition-colors text-left"
                >
                  <d.Icon className="w-3.5 h-3.5 text-dhl-text shrink-0" />
                  <span className="text-[12px] font-semibold text-dhl-text">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const curKey = visibleSteps[step].key;

  return (
    <div className="max-w-5xl mx-auto" data-testid="shipnow-page">
      <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter mb-2">
        Ship Now
      </h1>
      <p className="text-sm text-dhl-muted mb-7">
        Create a shipment in 5 steps. We'll auto-fetch live rates before you confirm.
      </p>

      {/* Progress */}
      <div className="mb-8 bg-white border border-dhl-border p-4 lg:p-5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {visibleSteps.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.key} className="flex items-center gap-2 shrink-0" data-testid={`step-indicator-${s.key}`}>
                <div className={`w-9 h-9 flex items-center justify-center transition-colors ${
                  done ? "bg-green-500 text-white" : active ? "bg-dhl-yellow text-dhl-ink border-2 border-dhl-ink" : "bg-dhl-panel text-dhl-muted border border-dhl-border"
                }`}>
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider hidden lg:block ${active ? "text-dhl-text" : "text-dhl-muted"}`}>{s.label}</div>
                {i < visibleSteps.length - 1 && <div className={`w-6 lg:w-12 h-px ${done ? "bg-green-500" : "bg-dhl-border"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-dhl-border p-6 lg:p-8" data-testid={`step-${curKey}`}>
        {/* SENDER */}
        {curKey === "sender" && (
          <>
            <h2 className="font-display text-2xl font-black text-dhl-text mb-1">Where's it shipping from?</h2>
            <p className="text-sm text-dhl-muted mb-5">Defaults to your account. Pick from your address book to autofill.</p>
            {addresses.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2" data-testid="sender-addressbook">
                <span className="text-xs font-bold uppercase tracking-wider text-dhl-muted self-center mr-1">Address Book:</span>
                {addresses.map(a => (
                  <button key={a.id} type="button" onClick={() => fillFromAddress(a, "sender")} className="text-xs px-3 py-1.5 bg-dhl-panel border border-dhl-border hover:border-dhl-yellow">
                    {a.label}{a.isDefaultSender && <span className="ml-1 text-dhl-red">·default</span>}
                  </button>
                ))}
              </div>
            )}
            <PartyForm party={sender} setParty={setSender} cities={originCities} countries={countries} prefix="sender" />
          </>
        )}

        {/* RECEIVER */}
        {curKey === "receiver" && (
          <>
            <h2 className="font-display text-2xl font-black text-dhl-text mb-1">Who's receiving it?</h2>
            <p className="text-sm text-dhl-muted mb-5">Enter consignee details below.</p>
            {addresses.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2" data-testid="receiver-addressbook">
                <span className="text-xs font-bold uppercase tracking-wider text-dhl-muted self-center mr-1">Address Book:</span>
                {addresses.map(a => (
                  <button key={a.id} type="button" onClick={() => fillFromAddress(a, "receiver")} className="text-xs px-3 py-1.5 bg-dhl-panel border border-dhl-border hover:border-dhl-yellow">
                    {a.label}{a.isDefaultReceiver && <span className="ml-1 text-dhl-red">·default</span>}
                  </button>
                ))}
              </div>
            )}
            <PartyForm party={receiver} setParty={setReceiver} cities={destCities} countries={countries} prefix="receiver" />
          </>
        )}

        {/* PACKAGE */}
        {curKey === "package" && (
          <>
            <h2 className="font-display text-2xl font-black text-dhl-text mb-1">Package details</h2>
            <p className="text-sm text-dhl-muted mb-5">Total weight, dimensions and contents.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Pieces"><Input type="number" min="1" value={pkg.pieces} data-testid="pkg-pieces" onChange={e => setPkg({ ...pkg, pieces: Number(e.target.value) })} /></Field>
              <Field label="Total Weight (kg)"><Input type="number" min="0.1" step="0.1" value={pkg.weightKg} data-testid="pkg-weight" onChange={e => setPkg({ ...pkg, weightKg: Number(e.target.value) })} /></Field>
              <Field label="Package Type">
                <Select value={pkg.packageType} onValueChange={v => setPkg({ ...pkg, packageType: v })}>
                  <SelectTrigger data-testid="pkg-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="PARCEL">Parcel</SelectItem>
                    <SelectItem value="PALLET">Pallet</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Length (cm)"><Input type="number" value={pkg.l} data-testid="pkg-l" onChange={e => setPkg({ ...pkg, l: Number(e.target.value) })} /></Field>
              <Field label="Width (cm)"><Input type="number" value={pkg.w} data-testid="pkg-w" onChange={e => setPkg({ ...pkg, w: Number(e.target.value) })} /></Field>
              <Field label="Height (cm)"><Input type="number" value={pkg.h} data-testid="pkg-h" onChange={e => setPkg({ ...pkg, h: Number(e.target.value) })} /></Field>
              <Field label="Description" full><Input value={pkg.description} data-testid="pkg-desc" onChange={e => setPkg({ ...pkg, description: e.target.value })} /></Field>
              <Field label="Declared Value (USD)"><Input type="number" min="0" value={pkg.declaredValueUSD} data-testid="pkg-value" onChange={e => setPkg({ ...pkg, declaredValueUSD: Number(e.target.value) })} /></Field>
            </div>
          </>
        )}

        {/* SERVICE */}
        {curKey === "service" && (
          <>
            <h2 className="font-display text-2xl font-black text-dhl-text mb-1">Pick your service</h2>
            <p className="text-sm text-dhl-muted mb-5">Live rates calculated for {pkg.weightKg} kg, {sender.city} → {receiver.city}.</p>
            {quoteLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-dhl-yellow mx-auto" /></div>
            ) : (
              <div className="space-y-3" data-testid="service-options">
                {quotes?.options?.map(opt => (
                  <button
                    key={opt.service}
                    type="button"
                    onClick={() => setService(opt.service)}
                    data-testid={`service-option-${opt.service}`}
                    className={`w-full text-left p-5 border-2 transition-all ${
                      service === opt.service ? "border-dhl-yellow bg-dhl-yellow/10" : "border-dhl-border bg-white hover:border-dhl-ink"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-display font-bold text-lg text-dhl-text">{opt.serviceName}</div>
                        <div className="text-xs text-dhl-muted mt-0.5">{opt.description}</div>
                        <div className="text-xs font-bold text-dhl-red mt-2 uppercase tracking-wider">Transit: {opt.transitDays} day{opt.transitDays > 1 ? "s" : ""}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-2xl font-black text-dhl-text">{formatPGK(opt.pricePGK)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-dhl-muted mt-1">All-in incl. fees</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* CUSTOMS */}
        {curKey === "customs" && (
          <>
            <h2 className="font-display text-2xl font-black text-dhl-text mb-1">Customs information</h2>
            <p className="text-sm text-dhl-muted mb-5">International shipments need declaration. We'll generate a Commercial Invoice automatically.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Field label="Reason for Export">
                <Select value={customs.reason} onValueChange={v => setCustoms({ ...customs, reason: v })}>
                  <SelectTrigger data-testid="customs-reason"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="gift">Gift</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Terms of Trade">
                <Select value={customs.incoterm} onValueChange={v => setCustoms({ ...customs, incoterm: v })}>
                  <SelectTrigger data-testid="customs-incoterm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAP">DAP — Delivered at Place</SelectItem>
                    <SelectItem value="DDP">DDP — Delivered Duty Paid</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-xs text-dhl-muted italic">
              For this demo, we'll use the package description and declared value from Step 3. You can author detailed customs docs separately under Customs.
            </p>
          </>
        )}

        {/* CONFIRM */}
        {curKey === "confirm" && (
          <>
            <h2 className="font-display text-2xl font-black text-dhl-text mb-1">Review & pay</h2>
            <p className="text-sm text-dhl-muted mb-5">One last look, then we generate your AWB.</p>
            <div className="grid lg:grid-cols-2 gap-5 mb-6">
              <div className="bg-dhl-panel p-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted mb-2">From</div>
                <div className="font-bold text-dhl-text">{sender.name} · {sender.company}</div>
                <div className="text-sm text-dhl-muted">{sender.address}, {sender.city}, {sender.country}</div>
              </div>
              <div className="bg-dhl-panel p-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted mb-2">To</div>
                <div className="font-bold text-dhl-text">{receiver.name} · {receiver.company}</div>
                <div className="text-sm text-dhl-muted">{receiver.address}, {receiver.city}, {receiver.country}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              <div className="bg-dhl-panel p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Service</div><div className="font-bold text-dhl-text">{SERVICE_LABELS[service] || "—"}</div></div>
              <div className="bg-dhl-panel p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Package</div><div className="font-bold text-dhl-text">{pkg.pieces} pc · {pkg.weightKg} kg</div></div>
              <div className="bg-dhl-panel p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">ETA</div><div className="font-bold text-dhl-text">{selectedQuote?.estimatedDelivery || "—"}</div></div>
              <div className="bg-dhl-ink text-white p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-dhl-yellow">Total Cost</div><div className="font-display text-xl font-black">{selectedQuote ? formatPGK(selectedQuote.pricePGK) : "—"}</div></div>
            </div>
            <div className="mb-5">
              <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-2 block">Payment Method</Label>
              <div className="flex gap-3">
                {["account", "card"].map(m => (
                  <button key={m} type="button" onClick={() => setPayment({ method: m })} data-testid={`pay-${m}`} className={`flex-1 p-3 border-2 text-sm font-bold uppercase tracking-wider ${
                    payment.method === m ? "border-dhl-yellow bg-dhl-yellow/10 text-dhl-ink" : "border-dhl-border bg-white text-dhl-muted"
                  }`}>
                    {m === "account" ? "Pay on Account (Invoice)" : "Pay by Card"}
                  </button>
                ))}
              </div>
              {payment.method === "card" && (
                <div className="mt-3 p-4 bg-dhl-panel border border-dhl-border">
                  <p className="text-xs text-dhl-muted mb-3">
                    Demo cards: <span className="font-mono font-bold text-dhl-text">4111 1111 1111 1111</span> = success,{" "}
                    <span className="font-mono font-bold text-dhl-red">4000 0000 0000 0002</span> = decline. Any future exp date, any 3-digit CVV.
                  </p>
                  <p className="text-xs italic text-dhl-muted">Card form simulated for demo — actual charge happens via the Invoices "Pay Now" flow.</p>
                </div>
              )}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agree} onCheckedChange={v => setAgree(!!v)} data-testid="confirm-tnc" className="border-dhl-border data-[state=checked]:bg-dhl-yellow data-[state=checked]:text-dhl-ink data-[state=checked]:border-dhl-yellow rounded-none mt-1" />
              <span className="text-sm text-dhl-text">I confirm the shipment details are correct and accept DHL's terms of carriage.</span>
            </label>
          </>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-dhl-border">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            data-testid="ship-back"
            className="font-bold uppercase tracking-wider text-xs"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          {step < visibleSteps.length - 1 ? (
            <Button
              onClick={next}
              disabled={!canNext()}
              data-testid="ship-next"
              className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-sm px-6 border-2 border-dhl-ink disabled:opacity-50"
            >
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={!canNext() || creating}
              data-testid="ship-submit"
              className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-sm px-7 border-2 border-dhl-ink disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Shipment <FileCheck className="ml-2 w-4 h-4" /></>}
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
    <Field label="Full Name"><Input value={party.name} data-testid={`${prefix}-name`} onChange={e => setParty({ ...party, name: e.target.value })} /></Field>
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
    <Field label="Postal Code"><Input value={party.postalCode} data-testid={`${prefix}-postal`} onChange={e => setParty({ ...party, postalCode: e.target.value })} /></Field>
    <Field label="Phone"><Input value={party.phone} data-testid={`${prefix}-phone`} onChange={e => setParty({ ...party, phone: e.target.value })} /></Field>
    <Field label="Email"><Input value={party.email} type="email" data-testid={`${prefix}-email`} onChange={e => setParty({ ...party, email: e.target.value })} /></Field>
  </div>
);

export default ShipNow;
