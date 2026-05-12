import { useState } from "react";
import { FileText, Receipt, FileDown, FileSignature, FileSpreadsheet, FileBadge2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { API_BASE, TOKEN_KEY } from "@/lib/api";

const DOCS = [
  {
    slug: "airwaybill",
    label: "Air Waybill",
    description: "Standard shipping waybill",
    icon: FileText,
    testId: "doc-tile-airwaybill",
  },
  {
    slug: "proforma",
    label: "Proforma Invoice",
    description: "Pre-shipment estimated invoice",
    icon: FileSpreadsheet,
    testId: "doc-tile-proforma",
  },
  {
    slug: "commercial",
    label: "Commercial Invoice",
    description: "Customs declaration invoice",
    icon: FileBadge2,
    testId: "doc-tile-commercial",
  },
  {
    slug: "tax",
    label: "Tax Invoice",
    description: "Invoice with GST/VAT line items",
    icon: Receipt,
    testId: "doc-tile-tax",
  },
  {
    slug: "inbound",
    label: "Inbound Invoice",
    description: "Receiver-side invoice",
    icon: FileDown,
    testId: "doc-tile-inbound",
  },
  {
    slug: "declaration",
    label: "Shipment Declaration",
    description: "Shipper's export declaration",
    icon: FileSignature,
    testId: "doc-tile-declaration",
  },
];

/**
 * "Shipment Documents" — 6 auto-populated PDFs from the existing shipment data.
 * Downloads each via authenticated fetch → blob → object URL (the JWT can't ride
 * a plain window.open).
 */
const ShipmentDocuments = ({ awb }) => {
  const [busy, setBusy] = useState(null); // currently-downloading slug, or null

  const downloadDoc = async (slug, niceLabel) => {
    if (busy) return;
    setBusy(slug);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const url = `${API_BASE}/shipments/${encodeURIComponent(awb)}/documents/${slug}.pdf`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `${awb}_${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Free the object URL after a tick so the browser has time to start the save.
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
      toast.success(`${niceLabel} downloaded`);
    } catch (e) {
      toast.error(`Couldn't download ${niceLabel}`, { description: String(e?.message || e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      id="shipment-documents"
      data-testid="shipment-documents-section"
      className="bg-white border border-dhl-border p-5"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-base font-black uppercase tracking-wider text-dhl-text">
          Shipment Documents
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
          6 PDFs · auto-populated
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DOCS.map((d) => {
          const Icon = d.icon;
          const isBusy = busy === d.slug;
          return (
            <button
              type="button"
              key={d.slug}
              onClick={() => downloadDoc(d.slug, d.label)}
              disabled={isBusy}
              data-testid={d.testId}
              className="group text-left p-4 border border-dhl-border bg-white hover:bg-dhl-yellow/10 hover:border-dhl-ink hover:shadow-sm transition-all duration-[200ms] ease-out disabled:opacity-60 disabled:cursor-wait"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 flex items-center justify-center border border-dhl-border bg-dhl-panel group-hover:bg-white group-hover:border-dhl-ink transition-colors">
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 text-dhl-text animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-dhl-text" strokeWidth={1.75} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-dhl-text leading-tight">
                    {d.label}
                  </div>
                  <div className="text-xs text-dhl-muted mt-1 leading-snug">
                    {d.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ShipmentDocuments;
