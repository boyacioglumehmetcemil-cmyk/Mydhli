import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Simple "coming soon" modal placeholder used by slider CTAs whose target
 * pages aren't built yet.
 */
const ComingSoonModal = ({ open, onClose, title, body }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      data-testid="coming-soon-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className="bg-white max-w-md w-full p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-xl font-black text-dhl-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 hover:bg-dhl-panel rounded-sm transition-colors"
          >
            <X className="w-4 h-4 text-dhl-muted" />
          </button>
        </div>
        <p className="text-sm text-dhl-text leading-[1.65]">
          {body ||
            "This section is part of the live myDHLi platform. Sign in or open an account to access the full feature."}
        </p>
        <div className="text-[10px] text-dhl-muted italic mt-4">Demo build placeholder.</div>
      </div>
    </div>
  );
};

export default ComingSoonModal;
