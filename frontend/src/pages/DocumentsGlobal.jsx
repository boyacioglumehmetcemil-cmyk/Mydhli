// Global documents page — flat list of every Phase 8.3b document attached to
// any shipment the caller owns. Filter chips + a type dropdown reuse the same
// vocabulary as DocumentsSection, just keyed off the global `/api/documents`
// endpoint rather than the per-shipment one.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Eye, Download, Loader2, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import useTitle from "@/hooks/useTitle";
import api, { API_BASE, TOKEN_KEY } from "@/lib/api";
import {
  DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS, DOCUMENT_TYPES,
  formatFileSize,
} from "@/lib/documentTypes";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import PageBanner from "@/components/PageBanner";

const STATUS_CHIPS = [
  { key: "ALL",      label: "All" },
  { key: "PENDING",  label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const DocumentsGlobal = () => {
  useTitle("Documents · myDHLi");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    const params = { page_size: 500 };
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (typeFilter !== "ALL")   params.type   = typeFilter;
    api.get("/documents", { params })
      .then((r) => { setItems(r.data.items); setTotal(r.data.total); })
      .catch(() => toast.error("Unable to load documents."))
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const byType = {};
    items.forEach((d) => { byType[d.document_type] = (byType[d.document_type] || 0) + 1; });
    return byType;
  }, [items]);

  // Native fetch with bearer token so the browser can open the resulting blob.
  const openBlob = async (path, disposition = "inline") => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (disposition === "download") {
        const a = document.createElement("a"); a.href = url; a.download = ""; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error("Unable to open file.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid="documents-global-page">
      <PageBanner title="Documents" icon={FileText} data-testid="documents-page-banner" />

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6" data-testid="documents-filter-row">
        <div className="flex flex-wrap gap-2">
          {STATUS_CHIPS.map((s) => {
            const active = statusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                data-testid={`doc-status-chip-${s.key.toLowerCase()}`}
                className={`inline-flex items-center px-3 h-8 text-[11px] font-bold uppercase tracking-wider rounded-full border-2 transition-colors ${
                  active
                    ? "bg-dhl-yellow text-dhl-ink border-dhl-ink"
                    : "bg-white text-dhl-muted border-dhl-border hover:border-dhl-ink"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <select
          data-testid="doc-type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 px-3 text-xs font-bold uppercase tracking-wider rounded-md border-2 border-dhl-border bg-white text-dhl-text focus:border-dhl-yellow"
        >
          <option value="ALL">All types ({total})</option>
          {DOCUMENT_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value}>{dt.label}</option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div className="bg-white border border-dhl-border rounded-lg">
        {loading ? (
          <div className="py-16 text-center" data-testid="documents-global-loading">
            <Loader2 className="w-7 h-7 text-dhl-yellow mx-auto mb-2 animate-spin" />
            <p className="text-xs text-dhl-muted">Loading documents…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-6 text-center" data-testid="documents-global-empty">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-dhl-border flex items-center justify-center rounded-lg">
              <FileText className="w-8 h-8 text-dhl-muted" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-base font-bold text-dhl-text mb-1">No documents match this filter</h3>
            <p className="text-xs text-dhl-muted">Try adjusting the status or type filter above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dhl-panel border-b border-dhl-border">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Shipment</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Type</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">File</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Size</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Uploaded</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => {
                  const Icon = DOCUMENT_TYPE_ICONS[d.document_type] || FileText;
                  const isPdf = d.mime_type === "application/pdf";
                  return (
                    <tr key={d.document_id}
                        data-testid={`doc-global-row-${d.document_id}`}
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
                          <Icon className="w-4 h-4 text-dhl-red" />
                          <span className="text-xs font-bold text-dhl-text">
                            {DOCUMENT_TYPE_LABELS[d.document_type] || d.document_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-mono text-xs text-dhl-text truncate max-w-[240px]">{d.file_name}</div>
                        {d.page_count != null && (
                          <div className="text-[10px] text-dhl-muted">{d.page_count} page{d.page_count === 1 ? "" : "s"}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-dhl-muted font-mono">{formatFileSize(d.file_size_bytes)}</td>
                      <td className="px-5 py-3"><DocumentStatusBadge status={d.status} /></td>
                      <td className="px-5 py-3 text-[10px] text-dhl-muted">{formatDate(d.uploaded_at)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {isPdf && (
                            <button onClick={() => openBlob(`/documents/${d.document_id}/preview`, "inline")}
                                    data-testid={`doc-global-preview-${d.document_id}`}
                                    className="p-1.5 text-dhl-muted hover:text-dhl-red rounded-md hover:bg-dhl-yellow/20" title="Preview">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => openBlob(`/documents/${d.document_id}/download`, "download")}
                                  data-testid={`doc-global-download-${d.document_id}`}
                                  className="p-1.5 text-dhl-muted hover:text-dhl-red rounded-md hover:bg-dhl-yellow/20" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
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

export default DocumentsGlobal;
