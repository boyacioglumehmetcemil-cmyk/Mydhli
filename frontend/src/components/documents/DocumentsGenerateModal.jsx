/**
 * DocumentsGenerateModal — Phase 1b UI surface for the docxtpl + LibreOffice
 * forwarding-document factory endpoint.
 *
 * Workflow
 * --------
 *  1. On mount we fetch `/api/document-templates` to learn which document
 *     types are available (so adding a new template on the backend does
 *     not require a frontend release).
 *  2. The user picks a subset (or "All") and submits.
 *  3. We POST `/api/shipments/{ref}/generate-documents` and report the
 *     summary (generated / skipped / errors) back to the parent so it can
 *     refresh its document list.
 */
import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import api from "@/lib/api";

const DocumentsGenerateModal = ({ open, onOpenChange, shipmentRef, onGenerated }) => {
  const [templates, setTemplates] = useState([]);
  const [picked, setPicked] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [overwrite, setOverwrite] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/document-templates")
      .then((r) => {
        setTemplates(r.data);
        // default-select all
        setPicked(Object.fromEntries(r.data.map((t) => [t.type, true])));
      })
      .catch(() => toast.error("Couldn't load templates"))
      .finally(() => setLoading(false));
  }, [open]);

  const selectedCount = useMemo(
    () => Object.values(picked).filter(Boolean).length,
    [picked]
  );
  const allOn = templates.length > 0 && selectedCount === templates.length;

  const toggleAll = () =>
    setPicked(
      Object.fromEntries(templates.map((t) => [t.type, !allOn]))
    );

  const submit = async () => {
    const types = templates
      .filter((t) => picked[t.type])
      .map((t) => t.type);
    if (types.length === 0) {
      toast.error("Pick at least one document");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(
        `/shipments/${shipmentRef}/generate-documents`,
        { document_types: types, overwrite }
      );
      const { generated = [], skipped = [], errors = [] } = res.data;
      if (errors.length) {
        toast.warning(
          `Generated ${generated.length}, ${errors.length} failed`,
          { description: errors[0]?.error?.slice(0, 80) }
        );
      } else if (skipped.length && !generated.length) {
        toast.info(`Nothing to do — ${skipped.length} already exist`, {
          description: "Tick 'Overwrite existing' to regenerate.",
        });
      } else {
        toast.success(
          `Generated ${generated.length} document${generated.length === 1 ? "" : "s"}`,
          {
            description: skipped.length
              ? `${skipped.length} skipped (already existed)`
              : undefined,
          }
        );
      }
      onGenerated?.(res.data);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Couldn't generate documents"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" data-testid="docs-generate-modal">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-dhl-yellow" />
            Generate documents
          </DialogTitle>
          <DialogDescription>
            Auto-fill House BL, MBL, AWB, Commercial Invoice and the rest of
            the standard freight-forwarding paperwork for{" "}
            <span className="font-mono font-bold text-dhl-ink">
              {shipmentRef}
            </span>{" "}
            from this shipment's booking data.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-dhl-yellow" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-dhl-border pb-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-dhl-muted">
                Pick documents
              </span>
              <button
                type="button"
                onClick={toggleAll}
                data-testid="docs-generate-toggle-all"
                className="text-xs font-bold uppercase tracking-wider text-dhl-red hover:underline"
              >
                {allOn ? "Clear all" : "Select all"}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {templates.map((t) => (
                <label
                  key={t.type}
                  data-testid={`docs-generate-row-${t.type}`}
                  className={`flex items-start gap-3 p-2.5 border cursor-pointer transition-colors ${
                    picked[t.type]
                      ? "border-dhl-ink bg-dhl-yellow/10"
                      : "border-dhl-border bg-white hover:border-dhl-ink"
                  } ${!t.exists ? "opacity-60" : ""}`}
                >
                  <Checkbox
                    checked={!!picked[t.type]}
                    disabled={!t.exists}
                    onCheckedChange={() =>
                      setPicked((p) => ({ ...p, [t.type]: !p[t.type] }))
                    }
                    data-testid={`docs-generate-cb-${t.type}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-dhl-text leading-tight">
                      {t.label}
                    </div>
                    <div className="text-[10px] text-dhl-muted mt-0.5 font-mono">
                      {t.type}
                    </div>
                    {!t.exists && (
                      <div className="text-[10px] text-dhl-red mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> template missing
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-2 mt-3 text-xs text-dhl-muted cursor-pointer">
              <Checkbox
                checked={overwrite}
                onCheckedChange={(v) => setOverwrite(!!v)}
                data-testid="docs-generate-overwrite"
              />
              Overwrite existing documents of the same type (default: skip)
            </label>
          </>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || loading || selectedCount === 0}
            data-testid="docs-generate-submit"
            className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5 h-11"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Generate {selectedCount} document{selectedCount === 1 ? "" : "s"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentsGenerateModal;
