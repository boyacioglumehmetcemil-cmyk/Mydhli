import { useEffect, useState } from "react";
import { Plus, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/shipmentUtils";
import { downloadAuthedPdf } from "@/lib/downloadPdf";

const DOC_TYPES = {
  COMMERCIAL_INVOICE: "Commercial Invoice",
  PACKING_LIST: "Packing List",
  EXPORT_DECLARATION: "Export Declaration",
};

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const blankItem = { description: "", hsCode: "", quantity: 1, unitValue: 0, weightKg: 0, countryOfOrigin: "PG" };
const blankParty = { name: "", company: "", address: "", city: "", country: "", postalCode: "" };

const Customs = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/customs").then(r => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setForm({
      docType: "COMMERCIAL_INVOICE",
      exporter: { name: `${user?.firstName} ${user?.lastName}`, company: user?.companyName || "", address: "12 Coronation Drive", city: "Port Moresby", country: "PG", postalCode: "121" },
      importer: { ...blankParty },
      items: [{ ...blankItem }],
      currency: "USD",
      signedBy: `${user?.firstName} ${user?.lastName}`,
    });
    setModal(true);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...blankItem }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, key, val) => {
    const next = [...form.items];
    next[i] = { ...next[i], [key]: val };
    setForm({ ...form, items: next });
  };

  const save = async () => {
    if (!form.importer.name || !form.importer.address) {
      toast.error("Importer details required");
      return;
    }
    try {
      const res = await api.post("/customs", form);
      toast.success("Customs document created");
      setModal(false);
      load();
      // Trigger an authenticated download for the just-created customs PDF
      await downloadAuthedPdf({
        path: `/api/customs/${res.data.id}/pdf`,
        filename: `customs-${res.data.id}.pdf`,
        niceLabel: "Customs document",
      });
    } catch (err) {
      toast.error("Could not save");
    }
  };

  const total = form?.items?.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitValue) || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto" data-testid="customs-page">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter">Customs Documents</h1>
          <p className="text-sm text-dhl-muted mt-2">Commercial invoices, packing lists, and export declarations for international shipments.</p>
        </div>
        <Button onClick={openCreate} data-testid="customs-add" className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs px-6 border-2 border-dhl-ink">
          <Plus className="mr-2 w-4 h-4" /> New Document
        </Button>
      </div>

      <div className="bg-white border border-dhl-border">
        {loading ? <div className="py-16 text-center"><Loader2 className="w-7 h-7 text-dhl-yellow animate-spin mx-auto" /></div>
        : items.length === 0 ? (
          <div className="py-16 text-center" data-testid="customs-empty">
            <FileText className="w-12 h-12 mx-auto text-dhl-muted mb-3" />
            <p className="text-dhl-muted mb-4">No customs documents yet.</p>
            <Button onClick={openCreate} className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink">
              Create First Doc
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm" data-testid="customs-table">
            <thead className="bg-dhl-panel border-b border-dhl-border">
              <tr>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Type</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Exporter</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Importer</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Value</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Created</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(d => (
                <tr key={d.id} data-testid={`customs-row-${d.id}`} className="border-b last:border-b-0 border-dhl-border hover:bg-dhl-yellow/5">
                  <td className="px-5 py-3 font-bold">{DOC_TYPES[d.docType] || d.docType}</td>
                  <td className="px-5 py-3">{d.exporter.company || d.exporter.name}</td>
                  <td className="px-5 py-3">{d.importer.company || d.importer.name}</td>
                  <td className="px-5 py-3 text-right font-mono">{d.currency} {d.totalValueUSD.toLocaleString()}</td>
                  <td className="px-5 py-3 text-dhl-muted">{formatDate(d.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        downloadAuthedPdf({
                          path: `/api/customs/${d.id}/pdf`,
                          filename: `customs-${d.shipmentAwb || d.id}.pdf`,
                          niceLabel: "Customs document",
                        })
                      }
                      data-testid={`customs-pdf-${d.id}`}
                      className="text-xs font-bold uppercase tracking-wider text-dhl-red hover:underline"
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={modal} onOpenChange={v => !v && setModal(false)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">New Customs Document</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Document Type</Label>
                <Select value={form.docType} onValueChange={v => setForm({ ...form, docType: v })}>
                  <SelectTrigger data-testid="customs-form-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(DOC_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-red mb-2">Exporter</div>
                  <div className="space-y-2">
                    <Input placeholder="Name" value={form.exporter.name} onChange={e => setForm({ ...form, exporter: { ...form.exporter, name: e.target.value } })} />
                    <Input placeholder="Company" value={form.exporter.company} onChange={e => setForm({ ...form, exporter: { ...form.exporter, company: e.target.value } })} />
                    <Input placeholder="Address" value={form.exporter.address} onChange={e => setForm({ ...form, exporter: { ...form.exporter, address: e.target.value } })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="City" value={form.exporter.city} onChange={e => setForm({ ...form, exporter: { ...form.exporter, city: e.target.value } })} />
                      <Input placeholder="Country" value={form.exporter.country} onChange={e => setForm({ ...form, exporter: { ...form.exporter, country: e.target.value } })} />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-red mb-2">Importer</div>
                  <div className="space-y-2">
                    <Input placeholder="Name" value={form.importer.name} data-testid="customs-imp-name" onChange={e => setForm({ ...form, importer: { ...form.importer, name: e.target.value } })} />
                    <Input placeholder="Company" value={form.importer.company} onChange={e => setForm({ ...form, importer: { ...form.importer, company: e.target.value } })} />
                    <Input placeholder="Address" value={form.importer.address} onChange={e => setForm({ ...form, importer: { ...form.importer, address: e.target.value } })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="City" value={form.importer.city} onChange={e => setForm({ ...form, importer: { ...form.importer, city: e.target.value } })} />
                      <Input placeholder="Country" value={form.importer.country} onChange={e => setForm({ ...form, importer: { ...form.importer, country: e.target.value } })} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-red">Items</div>
                  <button onClick={addItem} data-testid="customs-add-item" className="text-xs font-bold uppercase tracking-wider text-dhl-red hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
                {form.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <Input className="col-span-4" placeholder="Description" value={it.description} onChange={e => updateItem(idx, "description", e.target.value)} />
                    <Input className="col-span-2" placeholder="HS Code" value={it.hsCode} onChange={e => updateItem(idx, "hsCode", e.target.value)} />
                    <Input className="col-span-1" placeholder="Qty" type="number" value={it.quantity} onChange={e => updateItem(idx, "quantity", Number(e.target.value))} />
                    <Input className="col-span-2" placeholder="Unit Value" type="number" value={it.unitValue} onChange={e => updateItem(idx, "unitValue", Number(e.target.value))} />
                    <Input className="col-span-2" placeholder="Origin" value={it.countryOfOrigin} onChange={e => updateItem(idx, "countryOfOrigin", e.target.value)} />
                    <button onClick={() => removeItem(idx)} className="col-span-1 text-dhl-red"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="text-right text-sm font-bold mt-2">
                  Total: <span className="text-dhl-red">{form.currency} {total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Signed By</Label>
                <Input value={form.signedBy} onChange={e => setForm({ ...form, signedBy: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} data-testid="customs-save" className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink">Save & Generate PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customs;
