// Invoices page — virtual invoice ledger built on top of the 57 shipments seed.
// We don't keep a separate `invoices` collection any more (it was wiped during
// the orphan cleanup); instead we project every shipment into an invoice row
// using its freight cost + ETD and call its status from the shipment status:
//   DELIVERED → PAID
//   AT_DEPOT  → PENDING
//   anything else → DRAFT
//
// Result: 57 rows + 4 summary tiles. Zero new backend work, fully consistent
// with the seed truth source (master_logbook.json → shipments collection).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Receipt, ChevronRight, Loader2, Truck, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import useTitle from "@/hooks/useTitle";
import api from "@/lib/api";
import PageBanner from "@/components/PageBanner";

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
    });
  } catch { return iso; }
};

const fmtUSD = (n) => {
  if (n == null) return "—";
  return `USD ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// Status pill mapping for the synthetic invoice status.
const STATUS_TONE = {
  PAID:    { bg: "bg-green-100",  text: "text-green-800" },
  PENDING: { bg: "bg-amber-100",  text: "text-amber-800" },
  OVERDUE: { bg: "bg-red-100",    text: "text-dhl-red" },
  DRAFT:   { bg: "bg-stone-200",  text: "text-stone-700" },
};

const Invoices = () => {
  useTitle("Invoices · myDHLi");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/shipments", { params: { page: 1, pageSize: 100 } })
      .then((r) => setShipments(r.data.items || []))
      .catch(() => toast.error("Unable to load invoice data."))
      .finally(() => setLoading(false));
  }, []);

  // ── Build the virtual invoice rows ─────────────────────────────────────
  const rows = useMemo(() => shipments.map((s) => {
    const freightUsd = s.oceanSpecifics?.freightCostUsd ?? 0;
    const issueDate  = s.etd || s.createdAt;
    // Real operational due-date rule:
    //   DELIVERED → due = actualDelivery (buyer paid on pickup)
    //   AT_DEPOT  → due = buyerPickupDeadline (5 business days after final depot)
    //   anything else → fall back to issue + 30 days
    let dueDate = null;
    if (s.status === "DELIVERED") {
      dueDate = s.actualDelivery || s.oceanSpecifics?.atDepotSince || issueDate;
    } else if (s.status === "AT_DEPOT") {
      dueDate = s.oceanSpecifics?.buyerPickupDeadline || null;
    } else if (issueDate) {
      dueDate = new Date(new Date(issueDate).getTime() + 30 * 86400000).toISOString();
    }
    const invoiceStatus =
      s.status === "DELIVERED" ? "PAID" :
      s.status === "AT_DEPOT"  ? (s.oceanSpecifics?.pickupOverdue ? "OVERDUE" : "PENDING") :
      "DRAFT";
    return {
      invoiceNo:   `INV-${s.awb}`,
      shipmentRef: s.awb,
      issueDate,
      dueDate,
      mode:        s.mode || "OCEAN",
      pol:         s.origin?.code || "—",
      pod:         s.destination?.code || "—",
      freightUsd,
      invoiceStatus,
    };
  }), [shipments]);

  const totals = useMemo(() => {
    const t = { total: rows.length, billed: 0, paid: 0, paidCount: 0, outstanding: 0, outstandingCount: 0 };
    rows.forEach((r) => {
      t.billed += r.freightUsd;
      if (r.invoiceStatus === "PAID") {
        t.paid += r.freightUsd; t.paidCount += 1;
      } else if (r.invoiceStatus === "PENDING" || r.invoiceStatus === "OVERDUE") {
        t.outstanding += r.freightUsd; t.outstandingCount += 1;
      }
    });
    return t;
  }, [rows]);

  return (
    <div className="max-w-7xl mx-auto" data-testid="invoices-page">
      <PageBanner title="Invoices" icon={Receipt} data-testid="invoices-page-banner" />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-dhl-border rounded-md p-4" data-testid="inv-stat-total">
          <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Total invoices</div>
          <div className="font-display text-3xl font-black text-dhl-text mt-1">{totals.total}</div>
        </div>
        <div className="bg-white border border-dhl-border rounded-md p-4" data-testid="inv-stat-billed">
          <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Total billed</div>
          <div className="font-display text-2xl font-black text-dhl-text mt-1">{fmtUSD(totals.billed)}</div>
        </div>
        <div className="bg-white border border-dhl-border rounded-md p-4" data-testid="inv-stat-paid">
          <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Paid</div>
          <div className="font-display text-2xl font-black text-green-700 mt-1">{fmtUSD(totals.paid)}</div>
          <div className="text-[10px] text-dhl-muted mt-0.5">{totals.paidCount} shipments</div>
        </div>
        <div className="bg-white border border-dhl-border rounded-md p-4" data-testid="inv-stat-pending">
          <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Outstanding</div>
          <div className="font-display text-2xl font-black text-dhl-red mt-1">{fmtUSD(totals.outstanding)}</div>
          <div className="text-[10px] text-dhl-muted mt-0.5">{totals.outstandingCount} shipments past pickup deadline</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-dhl-border rounded-lg">
        {loading ? (
          <div className="py-16 text-center" data-testid="invoices-loading">
            <Loader2 className="w-7 h-7 text-dhl-yellow mx-auto mb-2 animate-spin" />
            <p className="text-xs text-dhl-muted">Loading invoice ledger…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 px-6 text-center" data-testid="invoices-empty">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-dhl-border flex items-center justify-center rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-dhl-muted" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-base font-bold text-dhl-text mb-1">No invoices yet</h3>
            <p className="text-xs text-dhl-muted">Book a shipment to start generating invoices.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dhl-panel border-b border-dhl-border">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Invoice No</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Shipment</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Issue date</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Due date</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Mode</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Route</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Freight</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const tone = STATUS_TONE[r.invoiceStatus] || STATUS_TONE.DRAFT;
                  return (
                    <tr key={r.invoiceNo}
                        data-testid={`invoice-row-${r.shipmentRef}`}
                        className="border-b border-dhl-border last:border-b-0 hover:bg-dhl-yellow/5">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-dhl-text">{r.invoiceNo}</td>
                      <td className="px-5 py-3">
                        <Link to={`/dashboard/shipments/${r.shipmentRef}`}
                              className="inline-flex items-center gap-1 font-mono text-xs font-bold text-dhl-red hover:underline">
                          {r.shipmentRef}
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-dhl-muted">{fmtDate(r.issueDate)}</td>
                      <td className="px-5 py-3 text-[11px] text-dhl-muted">{fmtDate(r.dueDate)}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-800">
                          {r.mode}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-dhl-text">{r.pol} → {r.pod}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs font-bold text-dhl-text">{fmtUSD(r.freightUsd)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${tone.bg} ${tone.text}`}>
                          {r.invoiceStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/dashboard/shipments/${r.shipmentRef}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-dhl-red hover:underline">
                          <Truck className="w-3.5 h-3.5" />
                          View shipment
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <p className="text-[10px] text-dhl-muted mt-4 italic">
        Invoice PDFs are issued with each shipment's paperwork pack — open the shipment and switch to the Documents tab for the full record.
      </p>
    </div>
  );
};

export default Invoices;
