"""Forwarding Document Generator — Phase 1b.

Renders the 9 master docxtpl forwarding templates into PDFs for a given
shipment and registers the resulting files in the `documents` MongoDB
collection so they show up automatically in the existing Documents UI.

Distinct from `document_generator.py` (the older reportlab-based PDF
factory used by the parcel/SaaS billing layer) and `document_filler.py`
(the one-shot PyMuPDF PII redactor for the 482 seeded PDFs).

Stack
-----
• docxtpl  — render a .docx with Jinja2 placeholders against shipment data.
• soffice  — LibreOffice headless to convert the rendered .docx → .pdf.
• motor    — async MongoDB writes for the documents collection.
"""
from __future__ import annotations

import logging
import shutil
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from docxtpl import DocxTemplate

logger = logging.getLogger(__name__)


# ── Paths ─────────────────────────────────────────────────────────────────
TEMPLATES_DIR = Path(__file__).resolve().parent / "templates" / "forwarding"
UPLOAD_ROOT = Path("/app/uploads/shipment_documents")
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
TMP_DIR = Path("/tmp/dhl_doc_gen")
TMP_DIR.mkdir(parents=True, exist_ok=True)


# ── Document type → template mapping ──────────────────────────────────────
DOC_TYPE_MAP = {
    "HBL":                     "hbl_template.docx",
    "MBL":                     "mbl_template.docx",
    "HAWB":                    "hawb_template.docx",
    "MAWB":                    "mawb_template.docx",
    "COMMERCIAL_INVOICE":      "commercial_invoice_template.docx",
    "PACKING_LIST":            "packing_list_template.docx",
    "BOOKING_CONFIRMATION":    "booking_confirmation_template.docx",
    "ARRIVAL_NOTICE":          "arrival_notice_template.docx",
    "PROOF_OF_DELIVERY":       "proof_of_delivery_template.docx",
}

NICE_FILENAMES = {
    "HBL":                  "House Bill of Lading",
    "MBL":                  "Master Bill of Lading",
    "HAWB":                 "House Air Waybill",
    "MAWB":                 "Master Air Waybill",
    "COMMERCIAL_INVOICE":   "Commercial Invoice",
    "PACKING_LIST":         "Packing List",
    "BOOKING_CONFIRMATION": "Booking Confirmation",
    "ARRIVAL_NOTICE":       "Arrival Notice",
    "PROOF_OF_DELIVERY":    "Proof of Delivery",
}


class GenerateRequest(BaseModel):
    document_types: Optional[List[str]] = None
    all: bool = False
    overwrite: bool = False  # if False and a doc of that type already exists, skip


# ── Helpers ───────────────────────────────────────────────────────────────
def _shape_shipment_for_template(s: dict) -> dict:
    """Flatten a shipment dict into a Jinja2-friendly context."""
    def get_party(role: str) -> dict:
        p = s.get(role) or {}
        if isinstance(p, str):
            p = {"company": p}
        return {
            "company": p.get("company") or p.get("name") or "",
            "name":    p.get("contactName") or p.get("name") or "",
            "address": p.get("address") or "",
            "city":    p.get("city") or "",
            "country": p.get("country") or "",
        }

    origin = s.get("origin") or {}
    dest = s.get("destination") or {}
    if isinstance(origin, str): origin = {"name": origin}
    if isinstance(dest, str):   dest = {"name": dest}

    ocean = s.get("oceanSpecifics") or {}
    air = s.get("airSpecifics") or {}
    freight = s.get("freight") or {}
    cargo = s.get("cargo") or {}
    container = (s.get("containers") or [{}])[0] if s.get("containers") else {}

    today_iso = datetime.now(timezone.utc).strftime("%d %b %Y")

    return {
        "ref_number":            s.get("ref_number") or s.get("awb") or "",
        "bl_number":             ocean.get("hblNumber") or s.get("bl_number") or s.get("ref_number"),
        "master_bl_number":      ocean.get("mblNumber") or "",
        "hawb_number":           air.get("hawb") or "",
        "mawb_number":           air.get("mawb") or "",
        "invoice_number":        s.get("ref_number"),
        "packing_list_number":   s.get("ref_number"),
        "booking_number":        s.get("ref_number"),
        "arrival_notice_number": s.get("ref_number"),
        "pod_number":            s.get("ref_number"),

        "mode":               (s.get("mode") or "OCEAN").upper(),
        "vessel":             ocean.get("vessel") or "—",
        "voyage":             ocean.get("voyageNumber") or "—",
        "flight":             air.get("flightNumber") or "—",
        "etd":                s.get("etd") or s.get("createdAt") or today_iso,
        "eta":                s.get("eta") or today_iso,
        "issue_date":         today_iso,
        "delivery_date":      s.get("deliveredAt") or "—",
        "incoterms":          s.get("incoterms") or "CIF",
        "originals":          "3 / 3",
        "place_of_receipt":   origin.get("name") or origin.get("city") or "",
        "place_of_delivery":  dest.get("name") or dest.get("city") or "",
        "free_storage_until": ocean.get("freeStorageUntil") or "—",

        "pol_name": origin.get("name") or origin.get("city") or "—",
        "pol_code": origin.get("portCode") or origin.get("code") or "",
        "pod_name": dest.get("name") or dest.get("city") or "—",
        "pod_code": dest.get("portCode") or dest.get("code") or "",

        "shipper":      get_party("shipper"),
        "consignee":    get_party("consignee"),
        "notify_party": get_party("notifyParty") or get_party("notify_party"),

        "cargo": {
            "description": cargo.get("description") or s.get("description") or "Consolidated freight",
            "hs_code":     cargo.get("hsCode") or "—",
            "weight_kg":   cargo.get("weightKg") or s.get("weight_kg") or "—",
            "volume_cbm":  cargo.get("volumeCbm") or "—",
        },
        "container": {
            "number": container.get("number") or "—",
            "type":   container.get("type") or "—",
            "seal":   container.get("seal") or "—",
        },
        "freight": {
            "amount":   float(freight.get("amount") or 0),
            "currency": freight.get("currency") or "USD",
            "terms":    freight.get("terms") or "Prepaid",
            "payment":  freight.get("paymentMethod") or "On account",
        },
    }


def _convert_docx_to_pdf(docx_path: Path, out_dir: Path) -> Path:
    """Run LibreOffice headless to convert docx → pdf. Returns final PDF path."""
    out_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        "soffice", "--headless", "--norestore", "--convert-to", "pdf",
        "--outdir", str(out_dir), str(docx_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if proc.returncode != 0:
        raise RuntimeError(f"soffice conversion failed: {proc.stderr.strip()}")
    pdf_path = out_dir / (docx_path.stem + ".pdf")
    if not pdf_path.exists():
        raise RuntimeError(f"soffice produced no pdf at {pdf_path}")
    return pdf_path


async def generate_documents_for_shipment(
    db,
    shipment: dict,
    user: dict,
    requested_types: list[str],
    overwrite: bool = False,
) -> dict:
    """Core generator — returns summary dict."""
    ref = shipment.get("ref_number") or shipment.get("awb")
    if not ref:
        raise HTTPException(400, "Shipment has no ref_number")

    ctx = _shape_shipment_for_template(shipment)
    upload_dir = UPLOAD_ROOT / ref
    upload_dir.mkdir(parents=True, exist_ok=True)

    generated, skipped, errors = [], [], []

    for dtype in requested_types:
        if dtype not in DOC_TYPE_MAP:
            errors.append({"document_type": dtype, "error": "Unknown type"})
            continue
        tpl_path = TEMPLATES_DIR / DOC_TYPE_MAP[dtype]
        if not tpl_path.exists():
            errors.append({"document_type": dtype,
                           "error": f"Template missing: {tpl_path.name}"})
            continue

        if not overwrite:
            existing = await db.documents.find_one({
                "shipment_ref": ref,
                "document_type": dtype,
                "is_deleted": {"$ne": True},
            }, {"_id": 0, "document_id": 1, "document_type": 1})
            if existing:
                skipped.append({"document_type": dtype, "reason": "exists",
                                "document_id": existing["document_id"]})
                continue

        # 1) render docx
        doc_id = str(uuid.uuid4())
        tmp_docx = TMP_DIR / f"{doc_id}.docx"
        try:
            tpl = DocxTemplate(str(tpl_path))
            tpl.render({"shipment": ctx})
            tpl.save(str(tmp_docx))
        except Exception as e:
            errors.append({"document_type": dtype, "error": f"render: {e}"})
            continue

        # 2) docx → pdf
        try:
            pdf_path = _convert_docx_to_pdf(tmp_docx, upload_dir)
        except Exception as e:
            errors.append({"document_type": dtype, "error": str(e)})
            try: tmp_docx.unlink()
            except Exception: pass
            continue

        # rename pdf to <doc_id>.pdf
        final_pdf = upload_dir / f"{doc_id}.pdf"
        try:
            shutil.move(str(pdf_path), str(final_pdf))
        except Exception:
            final_pdf = pdf_path

        nice = NICE_FILENAMES.get(dtype, dtype.title())
        record = {
            "document_id":             doc_id,
            "shipment_ref":            ref,
            "document_type":           dtype,
            "file_name":               f"{nice} — {ref}.pdf",
            "stored_file_name":        final_pdf.name,
            "file_path":               str(final_pdf),
            "file_size_bytes":         final_pdf.stat().st_size,
            "mime_type":               "application/pdf",
            "page_count":              1,
            "status":                  "PENDING_REVIEW",
            "uploaded_by_user_id":     user.get("id"),
            "uploaded_by_email":       user.get("email"),
            "uploaded_at":             datetime.now(timezone.utc).isoformat(),
            "reviewed_by_user_id":     None,
            "reviewed_by_email":       None,
            "reviewed_at":             None,
            "review_note":             None,
            "tags":                    ["auto_generated"],
            "is_deleted":              False,
            "is_demo_seed":            False,
            "generated_from_template": DOC_TYPE_MAP[dtype],
            "created_at":              datetime.now(timezone.utc).isoformat(),
            "updated_at":              datetime.now(timezone.utc).isoformat(),
        }
        await db.documents.insert_one(record)
        record.pop("_id", None)
        generated.append({
            "document_id":   doc_id,
            "document_type": dtype,
            "file_path":     str(final_pdf),
            "file_name":     record["file_name"],
        })

        try: tmp_docx.unlink()
        except Exception: pass

    return {"generated": generated, "skipped": skipped, "errors": errors}


# ── Router factory ────────────────────────────────────────────────────────
def build_forwarding_docgen_router(db, get_current_user_dep):
    router = APIRouter(prefix="/api")

    @router.post("/shipments/{ref}/generate-documents")
    async def generate(
        ref: str,
        payload: GenerateRequest = Body(default_factory=GenerateRequest),
        user: dict = Depends(get_current_user_dep),
    ):
        shipment = await db.shipments.find_one(
            {"$or": [{"ref_number": ref}, {"awb": ref}], "userId": user["id"]},
            {"_id": 0},
        )
        if not shipment:
            raise HTTPException(404, "Shipment not found")

        if payload.all or not payload.document_types:
            types = list(DOC_TYPE_MAP.keys())
        else:
            types = [t.upper() for t in payload.document_types]

        result = await generate_documents_for_shipment(
            db, shipment, user, types, overwrite=payload.overwrite,
        )
        logger.info(
            f"[DOC-GEN] shipment={ref} generated={len(result['generated'])} "
            f"skipped={len(result['skipped'])} errors={len(result['errors'])}"
        )
        return result

    @router.get("/document-templates")
    async def list_templates():
        """List available master templates so the UI can build the
        'pick which docs to generate' checklist dynamically."""
        return [
            {
                "type": t,
                "label": NICE_FILENAMES[t],
                "template": DOC_TYPE_MAP[t],
                "exists": (TEMPLATES_DIR / DOC_TYPE_MAP[t]).exists(),
            }
            for t in DOC_TYPE_MAP.keys()
        ]

    return router
