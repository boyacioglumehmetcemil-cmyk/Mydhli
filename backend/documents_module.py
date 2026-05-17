"""Documents module — Phase 8.3a (backend skeleton).

Owns the `documents` MongoDB collection and exposes the CRUD + upload endpoints
the frontend Documents tab consumes. Real DHL PDF templates are NOT shipped
here — this is the plumbing so once DHL provides the official templates the
frontend can post them straight in.

Storage layout:
    /app/uploads/shipment_documents/{shipment_ref}/{document_id}.{ext}

Auth: every endpoint requires a valid JWT (uses the same dependency the rest of
the app uses). Role-based access is intentionally stubbed (see TODO below); for
this demo any authenticated user can perform every action so reviewers can drive
the full flow with the seed `demo@dhlpng.com` account.
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import List, Literal, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ============ STORAGE ============
UPLOAD_ROOT = Path("/app/uploads/shipment_documents")
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

MAX_FILE_BYTES = 25 * 1024 * 1024  # 25 MB

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
}

# Quick MIME→extension fallback so a missing/bogus filename still gets a usable
# extension on disk. The original filename is preserved separately on the row.
EXT_BY_MIME = {
    "application/pdf": "pdf",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "image/jpeg": "jpg",
    "image/png": "png",
}

# ============ ENUMS ============
DOCUMENT_TYPES = [
    "HBL",
    "MBL",
    "HAWB",
    "MAWB",
    "CMR",
    "COMMERCIAL_INVOICE",
    "PACKING_LIST",
    "PROFORMA_INVOICE",
    "CERTIFICATE_OF_ORIGIN",
    "CUSTOMS_DECLARATION",
    "IMPORT_EXPORT_PERMIT",
    "DELIVERY_ORDER",
    "PROOF_OF_DELIVERY",
    "ARRIVAL_NOTICE",
    "PRE_ALERT",
    "INSURANCE_CERTIFICATE",
    "DGD",
    "FUMIGATION_CERT",
    "PHYTOSANITARY_CERT",
    "QUOTE_RATE_SHEET",
    "BOOKING_CONFIRMATION",
    "OTHER",
]
DOCUMENT_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED"]
DocumentStatusLiteral = Literal["DRAFT", "PENDING", "APPROVED", "REJECTED"]


# ============ PYDANTIC ============
class DocumentOut(BaseModel):
    """Public document representation — _id never leaks."""

    document_id: str
    shipment_ref: str
    document_type: str
    file_name: str
    stored_file_name: str
    file_size_bytes: int
    mime_type: str
    page_count: Optional[int] = None
    status: str
    uploaded_by_user_id: str
    uploaded_by_email: str
    uploaded_at: str
    reviewed_by_user_id: Optional[str] = None
    reviewed_by_email: Optional[str] = None
    reviewed_at: Optional[str] = None
    review_note: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: str
    updated_at: str


class DocumentListResponse(BaseModel):
    items: List[DocumentOut]
    total: int
    shipment_ref: str


class DocumentStatusUpdate(BaseModel):
    status: DocumentStatusLiteral
    review_note: Optional[str] = Field(default=None, max_length=500)


# ============ HELPERS ============
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _serialize(doc: dict) -> dict:
    """Strip Mongo internals so the row can be returned via Pydantic."""
    return {k: v for k, v in doc.items() if k not in ("_id", "file_path", "is_deleted")}


def _pdf_page_count(path: Path) -> Optional[int]:
    """Best-effort PDF page count. Returns None if the file isn't a PDF or
    pypdf can't read it — we don't fail the upload over this."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        return len(reader.pages)
    except Exception as e:
        logger.debug(f"page_count failed for {path}: {e}")
        return None


# ============ FACTORY ============
def build_router(db, get_current_user_dep):
    """Build the Documents APIRouter. Mirrors the factory pattern used by
    shipments / invoices / business modules so server.py wires it in identically.

    TODO (post-MVP): Production needs role-based access. Today every
    authenticated user can list / approve / delete any document. Real model
    would be:
      • customer  → can see + upload documents for their own shipments only
      • operator  → full read/write across all shipments
      • finance   → read-only
    """
    router = APIRouter(prefix="/api", tags=["documents"])

    # ---------- UPLOAD ----------
    @router.post(
        "/documents/upload",
        response_model=DocumentOut,
        status_code=201,
        summary="Upload a document for a shipment",
    )
    async def upload_document(
        file: UploadFile = File(...),
        shipment_ref: str = Form(..., min_length=1, max_length=80),
        document_type: str = Form(...),
        tags: Optional[str] = Form(default=None, description="JSON-encoded list, e.g. '[\"urgent\"]'"),
        current_user: dict = Depends(get_current_user_dep),
    ):
        # ── validate enum ────────────────────────────────────────────────
        if document_type not in DOCUMENT_TYPES:
            raise HTTPException(400, detail=f"Unknown document_type. Allowed: {DOCUMENT_TYPES}")

        # ── validate mime ────────────────────────────────────────────────
        mime = (file.content_type or "").lower()
        if mime not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                400,
                detail=f"Unsupported mime type '{mime}'. Allowed: PDF, XLS/XLSX, DOC/DOCX, JPEG, PNG.",
            )

        # ── read + size guard ────────────────────────────────────────────
        raw = await file.read()
        size = len(raw)
        if size == 0:
            raise HTTPException(400, detail="Uploaded file is empty.")
        if size > MAX_FILE_BYTES:
            raise HTTPException(
                413,
                detail=f"File too large ({size} bytes). Max is {MAX_FILE_BYTES} bytes (25 MB).",
            )

        # ── persist on disk ──────────────────────────────────────────────
        doc_id = str(uuid.uuid4())
        ext = EXT_BY_MIME.get(mime, "bin")
        # Sanitize shipment_ref so we never traverse outside the upload root.
        safe_ref = "".join(c for c in shipment_ref if c.isalnum() or c in "-_.")
        if not safe_ref:
            raise HTTPException(400, detail="Invalid shipment_ref.")
        ship_dir = UPLOAD_ROOT / safe_ref
        ship_dir.mkdir(parents=True, exist_ok=True)
        stored_name = f"{doc_id}.{ext}"
        file_path = ship_dir / stored_name
        try:
            file_path.write_bytes(raw)
        except OSError as e:
            logger.error(f"Failed to write upload {file_path}: {e}")
            raise HTTPException(500, detail="Storage write failed.")

        # ── parse tags ──────────────────────────────────────────────────
        tag_list: List[str] = []
        if tags:
            try:
                import json
                parsed = json.loads(tags)
                if isinstance(parsed, list):
                    tag_list = [str(t)[:40] for t in parsed][:10]
            except Exception:
                # silently ignore — tags is best-effort
                pass

        # ── page count (PDFs only) ──────────────────────────────────────
        pages = _pdf_page_count(file_path) if mime == "application/pdf" else None

        # ── default status ──────────────────────────────────────────────
        # TODO: when role guard lands, operator uploads should land as APPROVED.
        # For now everything uploaded by a logged-in user starts as PENDING so
        # the demo can show the approve/reject flow on the dashboard.
        now = _now_iso()
        record = {
            "document_id": doc_id,
            "shipment_ref": safe_ref,
            "document_type": document_type,
            "file_name": file.filename or stored_name,
            "stored_file_name": stored_name,
            "file_path": str(file_path),  # not exposed via response model
            "file_size_bytes": size,
            "mime_type": mime,
            "page_count": pages,
            "status": "PENDING",
            "uploaded_by_user_id": current_user["id"],
            "uploaded_by_email": current_user["email"],
            "uploaded_at": now,
            "reviewed_by_user_id": None,
            "reviewed_by_email": None,
            "reviewed_at": None,
            "review_note": None,
            "tags": tag_list,
            "is_deleted": False,
            "created_at": now,
            "updated_at": now,
        }
        await db.documents.insert_one(record)
        return _serialize(record)

    # ---------- LIST BY SHIPMENT ----------
    @router.get(
        "/shipments/{shipment_ref}/documents",
        response_model=DocumentListResponse,
        summary="List documents for a shipment",
    )
    async def list_documents_for_shipment(
        shipment_ref: str,
        status: Optional[str] = Query(default=None),
        type: Optional[str] = Query(default=None, alias="type"),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=50, ge=1, le=200),
        current_user: dict = Depends(get_current_user_dep),
    ):
        query: dict = {"shipment_ref": shipment_ref, "is_deleted": False}
        if status:
            if status not in DOCUMENT_STATUSES:
                raise HTTPException(400, detail=f"Unknown status. Allowed: {DOCUMENT_STATUSES}")
            query["status"] = status
        if type:
            if type not in DOCUMENT_TYPES:
                raise HTTPException(400, detail=f"Unknown document_type. Allowed: {DOCUMENT_TYPES}")
            query["document_type"] = type

        total = await db.documents.count_documents(query)
        cursor = (
            db.documents.find(query, {"_id": 0, "file_path": 0, "is_deleted": 0})
            .sort("uploaded_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        items = [doc async for doc in cursor]
        return {"items": items, "total": total, "shipment_ref": shipment_ref}

    # ---------- GET SINGLE ----------
    @router.get(
        "/documents/{document_id}",
        response_model=DocumentOut,
        summary="Get a single document's metadata",
    )
    async def get_document(
        document_id: str,
        current_user: dict = Depends(get_current_user_dep),
    ):
        doc = await db.documents.find_one({"document_id": document_id, "is_deleted": False})
        if not doc:
            raise HTTPException(404, detail="Document not found.")
        return _serialize(doc)

    # ---------- DOWNLOAD ----------
    @router.get(
        "/documents/{document_id}/download",
        summary="Download the raw document bytes",
    )
    async def download_document(
        document_id: str,
        current_user: dict = Depends(get_current_user_dep),
    ):
        doc = await db.documents.find_one({"document_id": document_id, "is_deleted": False})
        if not doc:
            raise HTTPException(404, detail="Document not found.")
        path = Path(doc["file_path"])
        if not path.exists():
            raise HTTPException(410, detail="Stored file no longer exists on disk.")
        return FileResponse(
            path=str(path),
            media_type=doc["mime_type"],
            filename=doc["file_name"],
            headers={"Content-Disposition": f'attachment; filename="{doc["file_name"]}"'},
        )

    # ---------- PREVIEW (PDF only, inline) ----------
    @router.get(
        "/documents/{document_id}/preview",
        summary="Inline preview (PDF only)",
    )
    async def preview_document(
        document_id: str,
        current_user: dict = Depends(get_current_user_dep),
    ):
        doc = await db.documents.find_one({"document_id": document_id, "is_deleted": False})
        if not doc:
            raise HTTPException(404, detail="Document not found.")
        if doc["mime_type"] != "application/pdf":
            raise HTTPException(415, detail="Inline preview is only supported for PDF documents.")
        path = Path(doc["file_path"])
        if not path.exists():
            raise HTTPException(410, detail="Stored file no longer exists on disk.")
        return FileResponse(
            path=str(path),
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{doc["file_name"]}"'},
        )

    # ---------- UPDATE STATUS (approve / reject) ----------
    @router.put(
        "/documents/{document_id}/status",
        response_model=DocumentOut,
        summary="Approve / reject / re-queue a document",
    )
    async def update_status(
        document_id: str,
        payload: DocumentStatusUpdate,
        current_user: dict = Depends(get_current_user_dep),
    ):
        # TODO: only operators should be allowed to APPROVE / REJECT; customers
        # should be limited to DRAFT → PENDING transitions on their own uploads.
        doc = await db.documents.find_one({"document_id": document_id, "is_deleted": False})
        if not doc:
            raise HTTPException(404, detail="Document not found.")

        update = {
            "status": payload.status,
            "updated_at": _now_iso(),
        }
        if payload.status in {"APPROVED", "REJECTED"}:
            update["reviewed_by_user_id"] = current_user["id"]
            update["reviewed_by_email"] = current_user["email"]
            update["reviewed_at"] = _now_iso()
            update["review_note"] = payload.review_note
        else:
            # going back to DRAFT/PENDING clears the review trail
            update["reviewed_by_user_id"] = None
            update["reviewed_by_email"] = None
            update["reviewed_at"] = None
            update["review_note"] = None

        await db.documents.update_one({"document_id": document_id}, {"$set": update})
        updated = await db.documents.find_one({"document_id": document_id})
        return _serialize(updated)

    # ---------- SOFT DELETE ----------
    @router.delete(
        "/documents/{document_id}",
        status_code=204,
        summary="Soft-delete a document",
    )
    async def soft_delete_document(
        document_id: str,
        current_user: dict = Depends(get_current_user_dep),
    ):
        doc = await db.documents.find_one({"document_id": document_id, "is_deleted": False})
        if not doc:
            raise HTTPException(404, detail="Document not found.")
        await db.documents.update_one(
            {"document_id": document_id},
            {
                "$set": {
                    "is_deleted": True,
                    "updated_at": _now_iso(),
                    "deleted_by_user_id": current_user["id"],
                    "deleted_by_email": current_user["email"],
                    "deleted_at": _now_iso(),
                }
            },
        )
        return None

    return router


# ============ AGGREGATE HELPER ============
async def documents_count_for_shipment(db, shipment_ref: str) -> int:
    """Used by other modules (e.g. shipments) to expose a quick badge count
    without duplicating the query shape. is_deleted=true is always excluded."""
    return await db.documents.count_documents(
        {"shipment_ref": shipment_ref, "is_deleted": False}
    )
