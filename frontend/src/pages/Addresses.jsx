import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, BookUser, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Parties directory (Shipper / Consignee / Notify Party).
//
// Backwards-compat:
//  - Existing seed records use boolean flags isDefaultSender / isDefaultReceiver.
//  - We derive a "role" tag for the UI from those flags so the seeded data still
//    looks like a proper B2B forwarding party list.
//  - A new explicit `role` field can be set when creating/editing a party.
// ─────────────────────────────────────────────────────────────────────────────

const ROLES = [
  { key: "SHIPPER", label: "Shipper", tone: "shipper" },
  { key: "CONSIGNEE", label: "Consignee", tone: "consignee" },
  { key: "NOTIFY", label: "Notify Party", tone: "notify" },
];

const TONE_CLS = {
  shipper: "bg-dhl-yellow text-dhl-ink",
  consignee: "bg-dhl-ink text-dhl-yellow",
  notify: "bg-stone-200 text-dhl-text",
};

const blank = {
  label: "",
  name: "",
  company: "",
  address: "",
  city: "",
  country: "PG",
  postalCode: "",
  phone: "",
  email: "",
  role: "SHIPPER",
  isDefaultSender: false,
  isDefaultReceiver: false,
};

const deriveRole = (a) => {
  if (a.role) return a.role;
  if (a.isDefaultSender) return "SHIPPER";
  if (a.isDefaultReceiver) return "CONSIGNEE";
  return "NOTIFY";
};

const Addresses = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/addresses")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get("/locations/countries").then((r) => setCountries(r.data));
  }, []);

  const countryFor = (code) => countries.find((c) => c.code === code) || { flag: "🏳️", name: code };

  const enriched = useMemo(
    () => items.map((a) => ({ ...a, _role: deriveRole(a) })),
    [items]
  );

  const counts = useMemo(() => {
    return {
      ALL: enriched.length,
      SHIPPER: enriched.filter((a) => a._role === "SHIPPER").length,
      CONSIGNEE: enriched.filter((a) => a._role === "CONSIGNEE").length,
      NOTIFY: enriched.filter((a) => a._role === "NOTIFY").length,
    };
  }, [enriched]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return enriched
      .filter((a) => tab === "ALL" || a._role === tab)
      .filter((a) => {
        if (!needle) return true;
        const hay = `${a.label} ${a.name} ${a.company} ${a.city} ${a.country}`.toLowerCase();
        return hay.includes(needle);
      });
  }, [enriched, tab, q]);

  const openCreate = () => setModal({ mode: "create", data: { ...blank } });
  const openEdit = (a) => setModal({ mode: "edit", data: { ...a, role: a._role || deriveRole(a) } });

  const save = async () => {
    const d = modal.data;
    if (!d.label || !d.name || !d.address || !d.city || !d.country) {
      toast.error("Please fill all required fields");
      return;
    }
    // Map role → legacy flags so backend keeps working.
    const payload = {
      ...d,
      isDefaultSender: d.role === "SHIPPER",
      isDefaultReceiver: d.role === "CONSIGNEE",
    };
    try {
      if (modal.mode === "create") {
        await api.post("/addresses", payload);
        toast.success("Party added");
      } else {
        await api.put(`/addresses/${d.id}`, payload);
        toast.success("Party updated");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this party from your directory?")) return;
    await api.delete(`/addresses/${id}`);
    toast.success("Removed");
    load();
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid="addresses-page">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1
            data-testid="parties-title"
            className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter"
          >
            Parties
          </h1>
          <p className="text-sm text-dhl-muted mt-2">
            Your shipper, consignee and notify-party directory — autofill any
            booking or HBL in a single click.
          </p>
        </div>
        <Button
          onClick={openCreate}
          data-testid="add-party"
          className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs px-6 border-2 border-dhl-ink"
        >
          <Plus className="mr-2 w-4 h-4" /> Add Party
        </Button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <div className="flex gap-1 bg-dhl-panel p-1 inline-flex w-fit">
          {[
            { key: "ALL", label: "All" },
            { key: "SHIPPER", label: "Shippers" },
            { key: "CONSIGNEE", label: "Consignees" },
            { key: "NOTIFY", label: "Notify Parties" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`parties-tab-${t.key.toLowerCase()}`}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                tab === t.key
                  ? "bg-white text-dhl-ink"
                  : "text-dhl-muted hover:text-dhl-text"
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 ${
                  tab === t.key ? "bg-dhl-ink text-white" : "bg-white text-dhl-muted"
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dhl-muted pointer-events-none" />
          <Input
            data-testid="parties-search"
            placeholder="Search company, city, country…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-10 bg-white border-dhl-border focus-visible:ring-dhl-yellow focus-visible:border-dhl-yellow rounded-sm"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-7 h-7 text-dhl-yellow mx-auto animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="bg-white border border-dhl-border p-16 text-center"
          data-testid="parties-empty"
        >
          <BookUser className="w-12 h-12 mx-auto text-dhl-muted mb-4" />
          <h3 className="font-display text-xl font-bold text-dhl-text mb-2">
            No parties yet
          </h3>
          <p className="text-sm text-dhl-muted mb-5">
            Add your first shipper, consignee or notify party to start booking
            faster.
          </p>
          <Button
            onClick={openCreate}
            className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink"
          >
            <Plus className="mr-2 w-4 h-4" /> Add Party
          </Button>
        </div>
      ) : (
        <div
          className="bg-white border border-dhl-border overflow-x-auto"
          data-testid="parties-table"
        >
          <table className="w-full text-sm">
            <thead className="bg-dhl-panel border-b border-dhl-border">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                  Company / Contact
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                  Address
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                  Country
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                  Phone
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const role = ROLES.find((r) => r.key === a._role) || ROLES[2];
                const country = countryFor(a.country);
                return (
                  <tr
                    key={a.id}
                    data-testid={`party-row-${a.id}`}
                    className="border-b last:border-b-0 border-dhl-border hover:bg-dhl-panel/50 transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <span
                        data-testid={`party-role-${a.id}`}
                        className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-1 ${TONE_CLS[role.tone]}`}
                      >
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-dhl-text leading-tight">
                        {a.company || a.name}
                      </div>
                      {a.company && (
                        <div className="text-xs text-dhl-muted mt-0.5">{a.name}</div>
                      )}
                      <div className="text-[10px] uppercase tracking-wider text-dhl-red font-bold mt-1">
                        {a.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-dhl-muted max-w-xs">
                      <div className="text-dhl-text">{a.address}</div>
                      <div>
                        {a.city}
                        {a.postalCode ? `, ${a.postalCode}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex items-center gap-2 text-xs text-dhl-text">
                        <span className="text-base leading-none">{country.flag}</span>
                        <span className="font-bold">{a.country}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-dhl-muted whitespace-nowrap">
                      {a.phone || "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(a)}
                        data-testid={`party-edit-${a.id}`}
                        className="p-2 text-dhl-muted hover:text-dhl-ink"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        data-testid={`party-delete-${a.id}`}
                        className="p-2 text-dhl-muted hover:text-dhl-red"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      <Dialog open={!!modal} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {modal?.mode === "create" ? "Add Party" : "Edit Party"}
            </DialogTitle>
          </DialogHeader>
          {modal && (
            <div className="grid sm:grid-cols-2 gap-3">
              <F label="Role *">
                <Select
                  value={modal.data.role}
                  onValueChange={(v) =>
                    setModal({ ...modal, data: { ...modal.data, role: v } })
                  }
                >
                  <SelectTrigger data-testid="party-form-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.key} value={r.key}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Reference Label *">
                <Input
                  value={modal.data.label}
                  data-testid="party-form-label"
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, label: e.target.value },
                    })
                  }
                  placeholder="e.g. Sydney Warehouse"
                />
              </F>
              <F label="Company">
                <Input
                  value={modal.data.company}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, company: e.target.value },
                    })
                  }
                />
              </F>
              <F label="Contact Name *">
                <Input
                  value={modal.data.name}
                  data-testid="party-form-name"
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, name: e.target.value },
                    })
                  }
                />
              </F>
              <F label="Address *" full>
                <Input
                  value={modal.data.address}
                  data-testid="party-form-address"
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, address: e.target.value },
                    })
                  }
                />
              </F>
              <F label="City *">
                <Input
                  value={modal.data.city}
                  data-testid="party-form-city"
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, city: e.target.value },
                    })
                  }
                />
              </F>
              <F label="Postal Code">
                <Input
                  value={modal.data.postalCode}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, postalCode: e.target.value },
                    })
                  }
                />
              </F>
              <F label="Country *">
                <Select
                  value={modal.data.country}
                  onValueChange={(v) =>
                    setModal({ ...modal, data: { ...modal.data, country: v } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Phone">
                <Input
                  value={modal.data.phone}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, phone: e.target.value },
                    })
                  }
                />
              </F>
              <F label="Email">
                <Input
                  value={modal.data.email}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, email: e.target.value },
                    })
                  }
                />
              </F>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              data-testid="party-form-save"
              className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink"
            >
              Save Party
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const F = ({ label, full, children }) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-1.5 block">
      {label}
    </Label>
    {children}
  </div>
);

export default Addresses;
