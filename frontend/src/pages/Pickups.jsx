import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { formatDate } from "@/lib/shipmentUtils";

const statusTone = {
  SCHEDULED: { bg: "bg-dhl-yellow/30", text: "text-dhl-ink", border: "border-dhl-yellow", dot: "bg-dhl-yellow" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-900", border: "border-green-600", dot: "bg-green-600" },
  CANCELLED: { bg: "bg-red-100", text: "text-dhl-red", border: "border-dhl-red", dot: "bg-dhl-red" },
};

const Pickups = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get("/pickups").then(r => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this pickup?")) return;
    await api.delete(`/pickups/${id}`);
    toast.success("Pickup cancelled");
    load();
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid="pickups-page">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter">My Pickups</h1>
          <p className="text-sm text-dhl-muted mt-2">Scheduled courier collections.</p>
        </div>
        <Button onClick={() => navigate("/dashboard/pickup")} data-testid="schedule-pickup-btn" className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs px-6 border-2 border-dhl-ink">
          <Plus className="mr-2 w-4 h-4" /> Schedule Pickup
        </Button>
      </div>

      <div className="bg-white border border-dhl-border">
        {loading ? (
          <div className="py-16 text-center"><Loader2 className="w-7 h-7 text-dhl-yellow animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center" data-testid="pickups-empty">
            <CalendarClock className="w-12 h-12 mx-auto text-dhl-muted mb-4" />
            <h3 className="font-display text-xl font-bold text-dhl-text mb-2">No pickups scheduled</h3>
            <p className="text-sm text-dhl-muted mb-5">Book a courier to collect your first shipment.</p>
            <Button onClick={() => navigate("/dashboard/pickup")} className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink">
              Schedule Now
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto" data-testid="pickups-table">
            <table className="w-full text-sm">
              <thead className="bg-dhl-panel border-b border-dhl-border">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Confirmation</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Address</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Packages</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Date</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Window</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => {
                  const t = statusTone[p.status] || statusTone.SCHEDULED;
                  return (
                    <tr key={p.id} data-testid={`pickup-row-${p.confirmationNumber}`} className="border-b border-dhl-border last:border-b-0">
                      <td className="px-5 py-3 font-mono font-bold">{p.confirmationNumber}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{p.addressSnapshot.name}</div>
                        <div className="text-xs text-dhl-muted">{p.addressSnapshot.address}, {p.addressSnapshot.city}</div>
                      </td>
                      <td className="px-5 py-3">{p.packageCount} pc · {p.totalWeightKg} kg</td>
                      <td className="px-5 py-3 text-dhl-muted">{p.scheduledDate}</td>
                      <td className="px-5 py-3 font-mono">{p.scheduledWindow}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${t.bg} ${t.text} ${t.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {p.status === "SCHEDULED" && (
                          <button onClick={() => cancel(p.id)} data-testid={`pickup-cancel-${p.id}`} className="text-xs font-bold uppercase tracking-wider text-dhl-red hover:underline">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pickups;
