"""Document filler / anonymization pipeline — Phase 1 (Phase 8.3b).

Given the 57-shipment evidence pack at `/app/uploads/dhl_57_shipments/`, this
module walks every shipment folder, copies each `.pdf` into the seeded shipment
storage path, and replaces a fixed set of PII strings using PyMuPDF redactions.

We do NOT regenerate the PDFs from scratch — the source pack already ships
beautifully laid-out DHL-branded documents (one docx + one pdf per asset). The
seed step just lifts the PDF copies into Mongo-aware storage while applying the
anonymization rules captured in `seed/anonymization_map.json`.

If/when the user wants brand-new shipments generated from scratch (Phase 1b),
this same module is the place to add a `docxtpl`-based filler. Today's caller
only uses `anonymize_pdf`."""
from __future__ import annotations

import json
import logging
import shutil
from pathlib import Path
from typing import Iterable, Optional, Tuple

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

# Replacements are applied LONGEST-MATCH-FIRST so "Mr. Wei Liang Tan, Procurement Director"
# is captured before the bare "Mr. Wei Liang Tan". Order matters.
DEFAULT_REPLACEMENTS: list[Tuple[str, str]] = [
    # ── Full title-prefixed person strings (most specific first) ─────────
    ("Mr. Jürgen Hoffmann, Export Operations Manager",   "Export Operations Manager"),
    ("Mr. Wei Liang Tan, Procurement Director",          "Procurement Director"),
    ("Mr. Wei Liang Tan, Procurement",                   "Procurement Director"),
    # ── Bare person names ────────────────────────────────────────────────
    ("Mr. Rajiv Menon",                                  "DHL Ocean Operations"),
    ("Mr. Jürgen Hoffmann",                              "Export Operations Manager"),
    ("Ms. Andrea Schäfer",                               "International Logistics Coordinator"),
    ("Mr. Wei Liang Tan",                                "Procurement Director"),
    ("Mr. Marcus Lee",                                   "Procurement Manager"),
    # Note: the project owner's personal name has been redacted from this
    # mapping. Only present in 00_MASTER/EMERGENT_HANDOVER.md (now anonymised
    # to "DHL PNG Forwarder Operations"); 0 occurrences in shipment PDFs.
    # ── Personal-handle emails → role mailboxes ──────────────────────────
    ("wl.tan@marinepower.sg",                            "procurement@marinepower.sg"),
    ("m.lee@pacificheavy.sg",                            "procurement@pacificheavy.sg"),
]


def anonymize_pdf(src_path: Path, dst_path: Path,
                  replacements: Optional[Iterable[Tuple[str, str]]] = None) -> dict:
    """Open the source PDF, redact every occurrence of each `(needle, repl)`
    pair and write the result to `dst_path`. Returns a stats dict per PDF
    so the caller can audit "X replacements applied on Y pages".

    Uses PyMuPDF's redact-annotation flow:
      1. search_for(needle)               → list of bounding rects
      2. add_redact_annot(rect, text=repl) → registers the replacement
      3. apply_redactions()                → bakes the change into the page

    Note: the replacement text inherits font from the redaction annotation
    (Helvetica by default). For the demo we accept the slight font mismatch
    — the documents stay readable and DHL-branded; only the PII strings
    change appearance fractionally.
    """
    pairs = list(replacements) if replacements is not None else DEFAULT_REPLACEMENTS
    dst_path.parent.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(src_path))
    stats = {"pages": doc.page_count, "replacements_by_term": {}, "total_hits": 0}

    # Pass-per-pair: longest match first, with `apply_redactions()` between
    # each pair so subsequent shorter needles can't re-match the area the
    # previous pair just covered. This avoids duplicates like
    # "Procurement DirectorProcurement Director" when a shorter substring is
    # a prefix of a longer one.
    for needle, repl in pairs:
        any_hit = False
        for page in doc:
            hits = page.search_for(needle, quads=False)
            if not hits:
                continue
            stats["replacements_by_term"][needle] = stats["replacements_by_term"].get(needle, 0) + len(hits)
            stats["total_hits"] += len(hits)
            any_hit = True
            for rect in hits:
                page.add_redact_annot(
                    rect,
                    text=repl,
                    fontname="helv",
                    fontsize=max(7.5, rect.height * 0.75),
                    align=fitz.TEXT_ALIGN_LEFT,
                    fill=(1, 1, 1),   # white fill — matches the white doc bg
                    text_color=(0, 0, 0),
                )
        if any_hit:
            for page in doc:
                page.apply_redactions()

    # If there were no PII hits, skip the redact-apply work and just copy the
    # file — preserves the original PDF stream perfectly (smaller, faster).
    if stats["total_hits"] == 0:
        doc.close()
        shutil.copy2(src_path, dst_path)
        return stats

    # `garbage=4` cleans up orphan objects; `deflate=True` compresses streams.
    doc.save(str(dst_path), garbage=4, deflate=True, clean=True)
    doc.close()
    return stats


def load_anonymization_map() -> dict:
    """Read the audit map from disk. Used by tests + seed reporting."""
    path = Path(__file__).parent / "seed" / "anonymization_map.json"
    return json.loads(path.read_text())


# Filename → DocumentType enum mapping. Mirrors the 57-shipment pack convention.
DOC_TYPE_FROM_FILENAME = {
    "01_Commercial_Invoice":     "COMMERCIAL_INVOICE",
    "02_Packing_List":           "PACKING_LIST",
    "03_Bill_of_Lading":         "HBL",
    "04_Booking_Confirmation":   "BOOKING_CONFIRMATION",
    "05_DHL_Shipping_Form":      "DHL_SHIPPING_FORM",
    "06_DHL_Customs_Document":   "CUSTOMS_DECLARATION",
    "07_Arrival_Notice":         "ARRIVAL_NOTICE",
    "08_Proof_of_Delivery":      "PROOF_OF_DELIVERY",
    "08_Warehouse_Receipt":      "WAREHOUSE_RECEIPT",
    "09_Pending_Action_Note":    "PENDING_ACTION_NOTE",
}


def doc_type_from_filename(filename: str) -> Optional[str]:
    """Maps `DHL-SWB-001_03_Bill_of_Lading.pdf` → `HBL`."""
    stem = Path(filename).stem
    # Strip the SWB prefix: "DHL-SWB-001_03_Bill_of_Lading" → "03_Bill_of_Lading"
    parts = stem.split("_", 1)
    if len(parts) != 2:
        return None
    tail = parts[1]
    return DOC_TYPE_FROM_FILENAME.get(tail)
