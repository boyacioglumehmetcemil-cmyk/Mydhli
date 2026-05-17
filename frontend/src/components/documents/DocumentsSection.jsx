// Documents section for the shipment detail page. Lists every doc attached to
// the shipment, filterable by status, with row-level approve/reject/preview/
// download/delete actions.
//
// This component is intentionally self-contained so any page that knows a
// shipment ref can drop it in (`<DocumentsSection shipmentRef={awb} />`).
import { useEffect, useState, useCallback } from "react";
import {
  UploadCloud, Eye, Download, CheckCircle, XCircle, Trash2,
  Loader2, FileText, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import api, { API_BASE, TOKEN_KEY } from "@/lib/api";
import {
  DOCUMENT_STATUSES, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS,
  formatFileSize,
} from "@/lib/documentTypes";
import DocumentStatusBadge from "./DocumentStatusBadge";
import UploadDocumentModal from "./UploadDocumentModal";
import DocumentsGenerateModal from "./DocumentsGenerateModal";

const FILTER_CHIPS = [
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
  } catch {
    return iso;
  }
};

const DocumentsSection = ({ shipmentRef }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "ALL") params.status = filter;
      const res = await api.get(`/shipments/${encodeURIComponent(shipmentRef)}/documents`, { params });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error("Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }, [shipmentRef, filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (docId, status) => {
    setActingId(docId);
    try {
      await api.put(`/documents/${docId}/status`, { status });
      toast.success(`Marked as ${status.toLowerCase()}`);
      await load();
    } catch {
      toast.error("Status update failed.");
    } finally {
      setActingId(null);
    }
  };

  const softDelete = async (docId) => {
    setActingId(docId);
    try {
      await api.delete(`/documents/${docId}`);
      toast.success("Document removed");
      await load();
    } catch {
      toast.error("Delete failed.");
    } finally {
      setActingId(null);
    }
  };

  // Build a token-aware URL for native <a> download / new-tab preview. We
  // can't use `api` (axios) directly because the browser needs a real URL
  // for window navigation. We append the token via a one-shot pre-signed
  // approach? For the demo we just open via fetch+blob.
  const fetchBlobAndOpen = async (path, disposition = "inline") => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (disposition === "download") {
        const a = document.createElement("a");
        a.href = url;
        // Extract filename from path tail — backend sets Content-Disposition
        // but we override with our own anchor download attribute for fallback.
        a.download = "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      // Revoke after a tick so the new tab/anchor can resolve it first.
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      toast.error("Unable to open file.");
    }
  };

  return (
    <section data-testid="documents-section" className="mt-10 bg-white border border-dhl-border rounded-lg">
      {/* Header */}
      <div className="px-5 py-4 border-b border-dhl-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-dhl-text">Documents</h2>
          <p className="text-xs text-dhl-muted mt-0.5">
            <span data-testid="documents-count" className="font-bold text-dhl-text">{total}</span> attached to this shipment
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            data-testid="documents-generate-button"
            onClick={() => setGenerateOpen(true)}
            variant="outline"
            className="h-11 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white rounded-md font-bold uppercase tracking-wider text-xs px-4 inline-flex items-center gap-2 bg-transparent"
          >
            <Sparkles className="w-4 h-4" />
            Generate
          </Button>
          <Button
            data-testid="documents-upload-button"
            onClick={() => setUploadOpen(true)}
            className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-md font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5 inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload document
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-5 py-3 border-b border-dhl-border flex flex-wrap gap-2" data-testid="documents-filter-chips">
        {FILTER_CHIPS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              data-testid={`documents-filter-${f.key.toLowerCase()}`}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center px-3 h-8 text-[11px] font-bold uppercase tracking-wider rounded-full border-2 transition-colors ${
                active
                  ? "bg-dhl-yellow text-dhl-ink border-dhl-ink"
                  : "bg-white text-dhl-muted border-dhl-border hover:border-dhl-ink"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-16 text-center" data-testid="documents-loading">
          <Loader2 className="w-7 h-7 text-dhl-yellow mx-auto mb-2 animate-spin" />
          <p className="text-xs text-dhl-muted">Loading documents…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 px-6 text-center" data-testid="documents-empty">
          <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-dhl-border flex items-center justify-center rounded-lg">
            <FileText className="w-8 h-8 text-dhl-muted" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-base font-bold text-dhl-text mb-1">No documents yet</h3>
          <p className="text-xs text-dhl-muted">Upload your first document to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto" data-testid="documents-table">
          <table className="w-full text-sm">
            <thead className="bg-dhl-panel border-b border-dhl-border">
              <tr>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Type</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">File</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Size</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Uploaded by</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => {
                const Icon = DOCUMENT_TYPE_ICONS[d.document_type] || FileText;
                const isPdf = d.mime_type === "application/pdf";
                const acting = actingId === d.document_id;
                return (
                  <tr
                    key={d.document_id}
                    data-testid={`document-row-${d.document_id}`}
                    className="border-b border-dhl-border last:border-b-0 hover:bg-dhl-yellow/5"
                  >
                    <td className="px-5 py-3">
                      <div className="inline-flex items-center gap-2">
                        <Icon className="w-4 h-4 text-dhl-red" />
                        <span className="text-xs font-bold text-dhl-text">
                          {DOCUMENT_TYPE_LABELS[d.document_type] || d.document_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-dhl-text truncate max-w-[260px]">{d.file_name}</div>
                      {d.page_count != null && (
                        <div className="text-[10px] text-dhl-muted">{d.page_count} page{d.page_count === 1 ? "" : "s"}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-dhl-muted font-mono">{formatFileSize(d.file_size_bytes)}</td>
                    <td className="px-5 py-3">
                      <DocumentStatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs text-dhl-text">{d.uploaded_by_email}</div>
                      <div className="text-[10px] text-dhl-muted">{formatDate(d.uploaded_at)}</div>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {isPdf && (
                          <button
                            type="button"
                            data-testid={`doc-preview-${d.document_id}`}
                            onClick={() => fetchBlobAndOpen(`/documents/${d.document_id}/preview`, "inline")}
                            className="p-1.5 text-dhl-muted hover:text-dhl-red rounded-md hover:bg-dhl-yellow/20"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          data-testid={`doc-download-${d.document_id}`}
                          onClick={() => fetchBlobAndOpen(`/documents/${d.document_id}/download`, "download")}
                          className="p-1.5 text-dhl-muted hover:text-dhl-red rounded-md hover:bg-dhl-yellow/20"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {d.status !== "APPROVED" && (
                          <button
                            type="button"
                            disabled={acting}
                            data-testid={`doc-approve-${d.document_id}`}
                            onClick={() => updateStatus(d.document_id, "APPROVED")}
                            className="p-1.5 text-green-700 hover:text-green-900 rounded-md hover:bg-green-100 disabled:opacity-40"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {d.status !== "REJECTED" && (
                          <button
                            type="button"
                            disabled={acting}
                            data-testid={`doc-reject-${d.document_id}`}
                            onClick={() => updateStatus(d.document_id, "REJECTED")}
                            className="p-1.5 text-dhl-red hover:text-dhl-red-dark rounded-md hover:bg-red-50 disabled:opacity-40"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={acting}
                          data-testid={`doc-delete-${d.document_id}`}
                          onClick={() => softDelete(d.document_id)}
                          className="p-1.5 text-dhl-muted hover:text-dhl-red rounded-md hover:bg-dhl-yellow/20 disabled:opacity-40"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {uploadOpen && (
        <UploadDocumentModal
          shipmentRef={shipmentRef}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => load()}
        />
      )}

      <DocumentsGenerateModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        shipmentRef={shipmentRef}
        onGenerated={() => load()}
      />
    </section>
  );
};

export default DocumentsSection;
