// Upload modal — single-file MVP. Drag-drop area falls through to a hidden
// <input type="file"> so we get native picker on every platform.
//
// Client-side guards (mime + size) intentionally MIRROR the backend rules in
// documents_module.py — keeping the two in sync prevents misleading "uploaded
// fine then rejected" surprises.
import { useState, useRef } from "react";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, FileCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DOCUMENT_TYPES, DOCUMENT_GROUPS,
  ALLOWED_MIME_TYPES, MAX_FILE_BYTES, formatFileSize,
} from "@/lib/documentTypes";
import api from "@/lib/api";

const UploadDocumentModal = ({ shipmentRef, onClose, onUploaded }) => {
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const accept = ALLOWED_MIME_TYPES.join(",");

  const pickFile = (f) => {
    if (!f) return;
    if (!ALLOWED_MIME_TYPES.includes(f.type)) {
      toast.error(`Unsupported file type "${f.type || "unknown"}". Allowed: PDF, XLS/XLSX, DOC/DOCX, JPEG, PNG.`);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast.error(`File too large (${formatFileSize(f.size)}). Max is 25 MB.`);
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    pickFile(f);
  };

  const handleSubmit = async () => {
    if (!docType) {
      toast.error("Choose a document type.");
      return;
    }
    if (!file) {
      toast.error("Pick a file to upload.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("shipment_ref", shipmentRef);
      fd.append("document_type", docType);
      const res = await api.post("/documents/upload", fd, {
        // Let axios pick the multipart boundary
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Uploaded "${res.data.file_name}"`);
      onUploaded?.(res.data);
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Upload failed.";
      toast.error(typeof msg === "string" ? msg : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && !uploading && onClose?.()}>
      <DialogContent data-testid="upload-doc-modal" className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-dhl-red" />
            Upload document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Shipment ref read-only chip */}
          <div className="bg-dhl-panel border border-dhl-border rounded-md px-3 py-2 text-xs">
            <span className="text-dhl-muted">For shipment </span>
            <span className="font-mono font-bold text-dhl-text">{shipmentRef}</span>
          </div>

          {/* Type picker */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-muted">
              Document type
            </Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger data-testid="upload-doc-type" className="h-11 mt-1 border-2 border-dhl-border focus:border-dhl-yellow rounded-md">
                <SelectValue placeholder="Choose a type…" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-dhl-border max-h-[320px]">
                {DOCUMENT_GROUPS.map((group) => {
                  const itemsInGroup = DOCUMENT_TYPES.filter((d) => d.group === group);
                  if (itemsInGroup.length === 0) return null;
                  return (
                    <SelectGroup key={group}>
                      <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted px-2 pt-2">
                        {group}
                      </SelectLabel>
                      {itemsInGroup.map((d) => (
                        <SelectItem key={d.value} value={d.value} data-testid={`upload-doc-type-${d.value}`}>
                          <span className="inline-flex items-center gap-2">
                            <d.Icon className="w-3.5 h-3.5 text-dhl-muted" />
                            {d.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Drag-drop file */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-dhl-muted">File</Label>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              data-testid="upload-doc-file-input"
              onChange={(e) => pickFile(e.target.files?.[0])}
              className="sr-only"
            />
            {!file ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                data-testid="upload-doc-drop-zone"
                className={`mt-1 w-full rounded-md border-2 border-dashed transition-colors h-32 flex flex-col items-center justify-center gap-1 text-xs ${
                  dragOver
                    ? "border-dhl-yellow bg-dhl-yellow/10 text-dhl-ink"
                    : "border-dhl-border bg-dhl-panel text-dhl-muted hover:border-dhl-ink hover:text-dhl-text"
                }`}
              >
                <UploadCloud className="w-6 h-6" />
                <span className="font-bold">Drag &amp; drop or click to browse</span>
                <span className="opacity-70">PDF / XLS / XLSX / DOC / DOCX / JPG / PNG — max 25 MB</span>
              </button>
            ) : (
              <div
                data-testid="upload-doc-selected-file"
                className="mt-1 flex items-center justify-between gap-3 rounded-md border-2 border-dhl-yellow bg-dhl-yellow/10 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="w-5 h-5 text-dhl-ink shrink-0" />
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold text-dhl-text truncate">{file.name}</div>
                    <div className="text-[10px] text-dhl-muted">
                      {formatFileSize(file.size)} · {file.type || "—"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  data-testid="upload-doc-clear-file"
                  className="text-dhl-muted hover:text-dhl-red"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={uploading} data-testid="upload-doc-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || !file || !docType}
            data-testid="upload-doc-submit"
            className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-md font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDocumentModal;
