import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Star, BookUser, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

const blank = {
  label: "", name: "", company: "", address: "", city: "", country: "PG",
  postalCode: "", phone: "", email: "",
  isDefaultSender: false, isDefaultReceiver: false,
};

const Addresses = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [modal, setModal] = useState(null); // {mode: 'create'|'edit', data}
  const [tab, setTab] = useState("ALL");

  const load = () => {
    setLoading(true);
    api.get("/addresses").then(r => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get("/locations/countries").then(r => setCountries(r.data));
  }, []);

  const save = async () => {
    const d = modal.data;
    if (!d.label || !d.name || !d.address || !d.city || !d.country) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (modal.mode === "create") {
        await api.post("/addresses", d);
        toast.success("Address added");
      } else {
        await api.put(`/addresses/${d.id}`, d);
        toast.success("Address updated");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    await api.delete(`/addresses/${id}`);
    toast.success("Deleted");
    load();
  };

  const setDefault = async (id, kind) => {
    await api.put(`/addresses/${id}/default`, { kind });
    toast.success(`Set as default ${kind}`);
    load();
  };

  const filtered = items.filter(a => tab === "ALL" || (tab === "SENDERS" && a.isDefaultSender) || (tab === "RECEIVERS" && a.isDefaultReceiver));

  return (
    <div className="max-w-7xl mx-auto" data-testid="addresses-page">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter">
            Address Book
          </h1>
          <p className="text-sm text-dhl-muted mt-2">Saved senders and receivers — autofill any shipment in one click.</p>
        </div>
        <Button onClick={() => setModal({ mode: "create", data: { ...blank } })} data-testid="add-address" className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs px-6 border-2 border-dhl-ink">
          <Plus className="mr-2 w-4 h-4" /> Add Address
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-dhl-panel p-1 inline-flex">
        {["ALL", "SENDERS", "RECEIVERS"].map(t => (
          <button key={t} onClick={() => setTab(t)} data-testid={`addr-tab-${t.toLowerCase()}`} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${tab === t ? "bg-white text-dhl-ink" : "text-dhl-muted hover:text-dhl-text"}`}>
            {t === "ALL" ? "All" : t === "SENDERS" ? "Default Senders" : "Default Receivers"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-7 h-7 text-dhl-yellow mx-auto animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dhl-border p-16 text-center" data-testid="addresses-empty">
          <BookUser className="w-12 h-12 mx-auto text-dhl-muted mb-4" />
          <h3 className="font-display text-xl font-bold text-dhl-text mb-2">No addresses yet</h3>
          <p className="text-sm text-dhl-muted mb-5">Add your first address to autofill future shipments.</p>
          <Button onClick={() => setModal({ mode: "create", data: { ...blank } })} className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink">
            <Plus className="mr-2 w-4 h-4" /> Add Address
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="addresses-grid">
          {filtered.map(a => (
            <div key={a.id} data-testid={`address-card-${a.id}`} className="bg-white border border-dhl-border p-5 hover:border-dhl-yellow transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-dhl-red">{a.label}</div>
                <div className="flex gap-1">
                  {a.isDefaultSender && <span className="text-[9px] font-bold uppercase tracking-wider bg-dhl-yellow text-dhl-ink px-1.5 py-0.5">Default Sender</span>}
                  {a.isDefaultReceiver && <span className="text-[9px] font-bold uppercase tracking-wider bg-dhl-ink text-dhl-yellow px-1.5 py-0.5">Default Receiver</span>}
                </div>
              </div>
              <div className="font-bold text-dhl-text">{a.name}</div>
              <div className="text-sm text-dhl-muted mb-1">{a.company}</div>
              <div className="text-xs text-dhl-muted">{a.address}</div>
              <div className="text-xs text-dhl-muted">{a.city}, {a.country} {a.postalCode}</div>
              <div className="text-xs text-dhl-muted mt-1">{a.phone}</div>

              <div className="flex items-center gap-1 pt-4 mt-4 border-t border-dhl-border">
                <button onClick={() => setModal({ mode: "edit", data: a })} data-testid={`addr-edit-${a.id}`} className="p-2 text-dhl-muted hover:text-dhl-text" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDefault(a.id, "sender")} data-testid={`addr-default-sender-${a.id}`} className="p-2 text-dhl-muted hover:text-dhl-yellow" title="Set default sender"><Star className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(a.id)} data-testid={`addr-delete-${a.id}`} className="p-2 text-dhl-muted hover:text-dhl-red ml-auto" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={v => !v && setModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{modal?.mode === "create" ? "Add Address" : "Edit Address"}</DialogTitle>
          </DialogHeader>
          {modal && (
            <div className="grid sm:grid-cols-2 gap-3">
              <F label="Label *"><Input value={modal.data.label} data-testid="addr-form-label" onChange={e => setModal({ ...modal, data: { ...modal.data, label: e.target.value } })} placeholder="e.g. Head Office" /></F>
              <F label="Full Name *"><Input value={modal.data.name} data-testid="addr-form-name" onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} /></F>
              <F label="Company"><Input value={modal.data.company} onChange={e => setModal({ ...modal, data: { ...modal.data, company: e.target.value } })} /></F>
              <F label="Country *">
                <Select value={modal.data.country} onValueChange={v => setModal({ ...modal, data: { ...modal.data, country: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="Address *" full><Input value={modal.data.address} data-testid="addr-form-address" onChange={e => setModal({ ...modal, data: { ...modal.data, address: e.target.value } })} /></F>
              <F label="City *"><Input value={modal.data.city} data-testid="addr-form-city" onChange={e => setModal({ ...modal, data: { ...modal.data, city: e.target.value } })} /></F>
              <F label="Postal Code"><Input value={modal.data.postalCode} onChange={e => setModal({ ...modal, data: { ...modal.data, postalCode: e.target.value } })} /></F>
              <F label="Phone"><Input value={modal.data.phone} onChange={e => setModal({ ...modal, data: { ...modal.data, phone: e.target.value } })} /></F>
              <F label="Email"><Input value={modal.data.email} onChange={e => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })} /></F>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} data-testid="addr-form-save" className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const F = ({ label, full, children }) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-1.5 block">{label}</Label>
    {children}
  </div>
);

export default Addresses;
