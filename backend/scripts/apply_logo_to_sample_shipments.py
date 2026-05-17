"""Apply the cleaned DHL Global Forwarding logo (transparent PNG) to the
existing PDFs of 5 pitch-priority shipments.

Strategy (PyMuPDF / fitz)
-------------------------
For every page of every PDF we:
1.  Identify the top header band (the top ~14% of the page) — this is where
    the original yellow DHL Express logo sits on every seeded document.
2.  Paint that header band white (covering the old logo + any "DHL Express"
    typography). The page text below the header band is left untouched.
3.  Stamp the new transparent Global Forwarding PNG centred horizontally,
    flush-left with a 22pt margin, vertically centred inside the band.

Idempotent
----------
We tag every relogged PDF with /Producer="DHL-PNG-Relogo-1" so re-running the
script is a no-op for already-processed files.
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

import fitz  # PyMuPDF

sys.path.insert(0, str(Path(__file__).resolve().parent))
from motor.motor_asyncio import AsyncIOMotorClient


# ── Config ────────────────────────────────────────────────────────────────
LOGO_PATH = Path("/app/uploads/dhl_brand_assets/dhl_global_forwarding_clean.png")
SHIPMENT_REFS = [
    "DHL-SWB-001",  # Delivered, premium pitch case
    "DHL-SWB-007",  # Delivered with transit depot stop
    "DHL-SWB-029",  # AT_DEPOT 783 days CRITICAL
    "DHL-SWB-047",  # AT_DEPOT 269 days overdue
    "DHL-SWB-055",  # Delivered, most recent
]
MARKER = "DHL-PNG-Relogo-1"  # producer-tag marker for idempotency
# Header band: top 14% of the page (covers the original DHL Express logo
# block in every seeded shipment template).
HEADER_BAND_FRAC = 0.14
LOGO_LEFT_MARGIN = 22  # pts from left edge of page


# ── Logo metadata ─────────────────────────────────────────────────────────
if not LOGO_PATH.exists():
    raise SystemExit(f"Logo asset not found: {LOGO_PATH}")
LOGO_BYTES = LOGO_PATH.read_bytes()

# Native logo dimensions (px). We'll scale to fit the band height.
import struct, zlib  # noqa: E402
def _png_dims(b: bytes):
    # PNG IHDR: 8-byte signature + length + "IHDR" + width(4) + height(4)
    return struct.unpack(">II", b[16:24])
LOGO_W, LOGO_H = _png_dims(LOGO_BYTES)


# ── Worker ────────────────────────────────────────────────────────────────
def relogo_pdf(pdf_path: Path) -> dict:
    """Returns dict with status: 'done' | 'skipped' | 'missing' | 'error'."""
    if not pdf_path.exists():
        return {"path": str(pdf_path), "status": "missing"}

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        return {"path": str(pdf_path), "status": "error", "error": f"open: {e}"}

    # Idempotency check
    if doc.metadata.get("producer", "").startswith(MARKER):
        doc.close()
        return {"path": str(pdf_path), "status": "skipped_already_done"}

    pages_processed = 0
    try:
        for page in doc:
            rect = page.rect
            band_h = rect.height * HEADER_BAND_FRAC

            # 1) White-out the existing header band
            band = fitz.Rect(0, 0, rect.width, band_h)
            page.draw_rect(band, color=(1, 1, 1), fill=(1, 1, 1), overlay=True,
                           width=0)

            # 2) Compute logo placement
            target_h = band_h * 0.62
            scale = target_h / LOGO_H
            target_w = LOGO_W * scale
            x0 = LOGO_LEFT_MARGIN
            y0 = (band_h - target_h) / 2
            logo_rect = fitz.Rect(x0, y0, x0 + target_w, y0 + target_h)

            page.insert_image(logo_rect, stream=LOGO_BYTES, keep_proportion=True,
                              overlay=True)

            # 3) Tiny "Global Forwarding · Pitch Demo" caption next to logo,
            #    in DHL red. Confirms the relog and keeps doc identifiable.
            cap_x = x0 + target_w + 14
            cap_y = y0 + target_h * 0.55
            page.insert_text(
                fitz.Point(cap_x, cap_y),
                "Global Forwarding",
                fontname="helv",
                fontsize=10,
                color=(0.83, 0.02, 0.07),  # DHL red
            )
            page.insert_text(
                fitz.Point(cap_x, cap_y + 11),
                "Pitch Demo · Generated for DHL PNG",
                fontname="helv",
                fontsize=7,
                color=(0.4, 0.4, 0.4),
            )

            pages_processed += 1
    except Exception as e:
        doc.close()
        return {"path": str(pdf_path), "status": "error", "error": str(e)}

    # Tag the doc so a second run is a no-op
    md = doc.metadata or {}
    md["producer"] = f"{MARKER} ({datetime.now(timezone.utc).isoformat()})"
    doc.set_metadata(md)

    tmp = pdf_path.with_suffix(".relogo.tmp.pdf")
    try:
        doc.save(tmp, garbage=3, deflate=True)
        doc.close()
        os.replace(tmp, pdf_path)
    except Exception as e:
        if tmp.exists():
            try: tmp.unlink()
            except: pass
        return {"path": str(pdf_path), "status": "error", "error": f"save: {e}"}

    return {"path": str(pdf_path), "status": "done", "pages": pages_processed}


# ── Driver ────────────────────────────────────────────────────────────────
async def main():
    cli = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = cli[os.environ["DB_NAME"]]

    print(f"Logo: {LOGO_PATH}  ({LOGO_W}×{LOGO_H} px)")
    print(f"Targets: {', '.join(SHIPMENT_REFS)}")
    print("─" * 70)

    summary = {"done": 0, "skipped": 0, "missing": 0, "error": 0}
    docs_total = 0
    refs_seen = {}

    for ref in SHIPMENT_REFS:
        async for doc_meta in db.documents.find(
            {"shipment_ref": ref}, {"_id": 0, "file_path": 1, "document_type": 1}
        ):
            docs_total += 1
            fp = doc_meta.get("file_path")
            if not fp:
                summary["missing"] += 1
                continue
            result = relogo_pdf(Path(fp))
            status = result["status"]
            if status == "done":
                summary["done"] += 1
            elif status == "skipped_already_done":
                summary["skipped"] += 1
            elif status == "missing":
                summary["missing"] += 1
            else:
                summary["error"] += 1
                print(f"  ! {ref} / {doc_meta.get('document_type')} → {result.get('error')}")
            refs_seen.setdefault(ref, []).append(status)

    print("─" * 70)
    for ref, statuses in refs_seen.items():
        ok = sum(1 for s in statuses if s in ("done", "skipped_already_done"))
        print(f"  {ref}: {ok}/{len(statuses)} OK")
    print("─" * 70)
    print(
        f"TOTAL: {docs_total} pdf | done={summary['done']} "
        f"skipped={summary['skipped']} missing={summary['missing']} "
        f"errors={summary['error']}"
    )


if __name__ == "__main__":
    asyncio.run(main())
