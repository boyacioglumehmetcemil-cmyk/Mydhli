// Customs page — curated slice of the global documents collection showing
// only customs-related document types (CUSTOMS_DECLARATION + filenames marked
// as DHL Customs Documents map to that same enum). Same row layout as
// DocumentsGlobal so the visual rhythm across Documents / Customs / Invoices
// stays consistent.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Stamp, Eye, Download, Loader2, ChevronRight, FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import useTitle from "@/hooks/useTitle";
import api, { API_BASE, TOKEN_KEY } from "@/lib/api";
import { DOCUMENT_TYPE_LABELS, formatFileSize } from "@/lib/documentTypes";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import PageBanner from "@/components/PageBanner";

// All document types we treat as "customs paperwork" for this page.
const CUSTOMS_TYPES = [
  "CUSTOMS_DECLARATION",
  "CERTIFICATE_OF_ORIGIN",
  "IMPORT_EXPORT_PERMIT",
];

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
    });
  } catch { return iso; }
};

const Customs = () => {
  useTitle("Customs · myDHLi");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/documents", { params: { type: CUSTOMS_TYPES.join(","), page_size: 500 } })
      .then((r) => { setItems(r.data.items); setTotal(r.data.total); })
      .catch(() => toast.error("Unable to load customs documents."))
      .finally(() => setLoading(false));
  }, []);

  const openBlob = async (path, disposition = "inline") => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (disposition === "download") {
        const a = document.createElement("a"); a.href = url; a.download = ""; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else { window.open(url, "_blank", "noopener,noreferrer"); }
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch { toast.error("Unable to open file."); }
  };

  const approvedCount = items.filter((d) => d.status === "APPROVED").length;
  const pendingCount  = items.filter((d) => d.status === "PENDING").length;

  return (
    <div className="max-w-7xl mx-auto" data-testid="customs-page">
      <PageBanner title="Customs" icon={Stamp} data-testid="customs-page-banner" />

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-dhl-border rounded-md p-4" data-testid="customs-stat-total">
          <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Total documents</div>
          <div className="font-display text-3xl font-black text-dhl-text mt-1">{total}</div>
        </div>
        <div className="bg-white border border-dhl-border rounded-md p-4" data-testid="customs-stat-approved">
          <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Approved</div>
          <div className="font-display text-3xl font-black text-green-700 mt-1">{approvedCount}</div>
        </div>
        <div className="bg-white border border-dhl-border rounded-md p-4" data-testid="customs-stat-pending">
          <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Pending review</div>
          <div className="font-display text-3xl font-black text-amber-700 mt-1">{pendingCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-dhl-border rounded-lg">
        {loading ? (
          <div className="py-16 text-center" data-testid="customs-loading">
            <Loader2 className="w-7 h-7 text-dhl-yellow mx-auto mb-2 animate-spin" />
            <p className="text-xs text-dhl-muted">Loading customs paperwork…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-6 text-center" data-testid="customs-empty">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-dhl-border flex items-center justify-center rounded-lg">
              <FileCheck className="w-8 h-8 text-dhl-muted" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-base font-bold text-dhl-text mb-1">No customs documents on file</h3>
            <p className="text-xs text-dhl-muted">Customs paperwork will appear here once attached to a shipment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dhl-panel border-b border-dhl-border">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Shipment</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Document type</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">File</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Size</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Uploaded</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.document_id}
                      data-testid={`customs-row-${d.document_id}`}
                      className="border-b border-dhl-border last:border-b-0 hover:bg-dhl-yellow/5">
                    <td className="px-5 py-3">
                      <Link to={`/dashboard/shipments/${d.shipment_ref}`}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-dhl-red hover:underline">
                        {d.shipment_ref}
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="inline-flex items-center gap-2">
                        <Stamp className="w-4 h-4 text-dhl-red" />
                        <span className="text-xs font-bold text-dhl-text">
                          {DOCUMENT_TYPE_LABELS[d.document_type] || d.document_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-dhl-text truncate max-w-[260px]">{d.file_name}</td>
                    <td className="px-5 py-3 text-xs text-dhl-muted font-mono">{formatFileSize(d.file_size_bytes)}</td>
                    <td className="px-5 py-3"><DocumentStatusBadge status={d.status} /></td>
                    <td className="px-5 py-3 text-[10px] text-dhl-muted">{formatDate(d.uploaded_at)}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button onClick={() => openBlob(`/documents/${d.document_id}/preview`, "inline")}
                                data-testid={`customs-preview-${d.document_id}`}
                                className="p-1.5 text-dhl-muted hover:text-dhl-red rounded-md hover:bg-dhl-yellow/20" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openBlob(`/documents/${d.document_id}/download`, "download")}
                                data-testid={`customs-download-${d.document_id}`}
                                className="p-1.5 text-dhl-muted hover:text-dhl-red rounded-md hover:bg-dhl-yellow/20" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customs;
