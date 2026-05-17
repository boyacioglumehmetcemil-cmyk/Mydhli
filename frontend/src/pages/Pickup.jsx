import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Check, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

const WINDOWS = ["09:00-12:00", "12:00-15:00", "15:00-18:00"];

const Pickup = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [pkgCount, setPkgCount] = useState(1);
  const [weight, setWeight] = useState(2);
  const [date, setDate] = useState("");
  const [win, setWin] = useState(WINDOWS[0]);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.get("/addresses").then(r => {
      setAddresses(r.data);
      const def = r.data.find(a => a.isDefaultSender) || r.data[0];
      if (def) setSelectedAddr(def);
    });
    // Default date = 2 days from now
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setDate(d.toISOString().slice(0, 10));
  }, []);

  const submit = async () => {
    if (!selectedAddr) return toast.error("Pick a pickup address");
    setCreating(true);
    try {
      const res = await api.post("/pickups", {
        addressSnapshot: {
          name: selectedAddr.name, company: selectedAddr.company,
          address: selectedAddr.address, city: selectedAddr.city,
          country: selectedAddr.country, postalCode: selectedAddr.postalCode,
          phone: selectedAddr.phone,
        },
        packageCount: pkgCount,
        totalWeightKg: weight,
        scheduledDate: date,
        scheduledWindow: win,
        specialInstructions: notes,
      });
      setSuccess(res.data);
    } catch (err) {
      toast.error("Could not schedule pickup");
    } finally {
      setCreating(false);
    }
  };

  if (success) {
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${success.confirmationNumber}\nDTSTART:${success.scheduledDate.replace(/-/g, "")}T${success.scheduledWindow.split("-")[0].replace(":", "")}00\nDTEND:${success.scheduledDate.replace(/-/g, "")}T${success.scheduledWindow.split("-")[1].replace(":", "")}00\nSUMMARY:DHL Pickup ${success.confirmationNumber}\nLOCATION:${success.addressSnapshot.address} ${success.addressSnapshot.city}\nEND:VEVENT\nEND:VCALENDAR`;
    const icsHref = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    return (
      <div className="max-w-2xl mx-auto" data-testid="pickup-success">
        <div className="bg-white border-2 border-green-500 p-10 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-green-700 mb-2">Pickup Scheduled</div>
          <h1 className="font-display text-3xl font-black text-dhl-text mb-3">Booked.</h1>
          <div className="font-mono text-2xl font-bold text-dhl-red mb-4" data-testid="pickup-conf">{success.confirmationNumber}</div>
          <div className="text-sm text-dhl-text bg-dhl-panel p-4 mb-6 text-left">
            <div><b>Date:</b> {success.scheduledDate}</div>
            <div><b>Window:</b> {success.scheduledWindow}</div>
            <div><b>Address:</b> {success.addressSnapshot.address}, {success.addressSnapshot.city}</div>
            <div><b>Packages:</b> {success.packageCount} · {success.totalWeightKg} kg</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={icsHref} download="dhl-pickup.ics" data-testid="pickup-ics" className="inline-flex items-center justify-center h-11 bg-dhl-ink text-white hover:bg-dhl-red font-bold uppercase tracking-wider text-xs px-5">
              Add to Calendar
            </a>
            <Button onClick={() => navigate("/dashboard/pickups")} className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5">
              View All Pickups
            </Button>
            <Button variant="ghost" onClick={() => setSuccess(null)} className="font-bold uppercase tracking-wider text-xs">Schedule Another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto" data-testid="pickup-page">
      <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter mb-2">
        Schedule Pre-carriage
      </h1>
      <p className="text-sm text-dhl-muted mb-7">Request a pre-carriage pickup from your warehouse for the next shipment leg.</p>

      <div className="bg-white border border-dhl-border p-6 lg:p-8 space-y-7">
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-2 block">1. Pickup Address</Label>
          <div className="grid sm:grid-cols-2 gap-3">
            {addresses.map(a => (
              <button key={a.id} type="button" onClick={() => setSelectedAddr(a)} data-testid={`pickup-addr-${a.id}`} className={`text-left p-4 border-2 ${selectedAddr?.id === a.id ? "border-dhl-yellow bg-dhl-yellow/10" : "border-dhl-border bg-white hover:border-dhl-ink"}`}>
                <div className="text-xs font-bold uppercase tracking-wider text-dhl-red">{a.label}</div>
                <div className="font-bold text-dhl-text mt-1">{a.name}</div>
                <div className="text-xs text-dhl-muted">{a.address}, {a.city}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-2 block">2. Number of Packages</Label>
            <Input type="number" min="1" value={pkgCount} onChange={e => setPkgCount(Number(e.target.value))} data-testid="pickup-count" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-2 block">Total Weight (kg)</Label>
            <Input type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(Number(e.target.value))} data-testid="pickup-weight" />
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-2 block">3. Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} data-testid="pickup-date" />
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-2 block">4. Time Window</Label>
          <div className="grid sm:grid-cols-3 gap-2">
            {WINDOWS.map(w => (
              <button key={w} type="button" onClick={() => setWin(w)} data-testid={`pickup-win-${w}`} className={`p-3 border-2 text-sm font-bold ${win === w ? "border-dhl-yellow bg-dhl-yellow/10" : "border-dhl-border bg-white hover:border-dhl-ink"}`}>
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-2 block">5. Special Instructions (optional)</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="pickup-notes" placeholder="e.g. Use rear loading dock, call upon arrival" />
        </div>

        <div className="flex justify-end pt-5 border-t border-dhl-border">
          <Button onClick={submit} disabled={creating || !selectedAddr} data-testid="pickup-submit" className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-sm px-7 border-2 border-dhl-ink disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm Pre-carriage <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pickup;
