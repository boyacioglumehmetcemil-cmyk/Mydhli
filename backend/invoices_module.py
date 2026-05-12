"""Invoices, Reports, Customs documentation."""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from io import BytesIO
import uuid
import random
import logging
from collections import defaultdict, Counter

from labels_module import render_invoice, render_customs_doc, render_report

logger = logging.getLogger(__name__)


# ============ MODELS ============
class InvoiceLineItem(BaseModel):
    shipmentAwb: str
    description: str
    costPGK: float


class InvoiceOut(BaseModel):
    invoiceNumber: str
    issueDate: str
    dueDate: str
    status: str
    subtotalPGK: float
    taxPGK: float
    totalPGK: float
    lineItems: List[InvoiceLineItem]
    paidDate: Optional[str] = None
    paymentReference: Optional[str] = None


class CustomsItem(BaseModel):
    description: str
    hsCode: str
    quantity: int
    unitValue: float
    weightKg: float
    countryOfOrigin: str


class CustomsParty(BaseModel):
    name: str
    company: str = ""
    address: str
    city: str
    country: str
    postalCode: str = ""


class CustomsDocIn(BaseModel):
    shipmentAwb: Optional[str] = None
    docType: str  # COMMERCIAL_INVOICE | PACKING_LIST | EXPORT_DECLARATION
    exporter: CustomsParty
    importer: CustomsParty
    items: List[CustomsItem]
    currency: str = "USD"
    signedBy: str


class CustomsDocOut(BaseModel):
    id: str
    shipmentAwb: Optional[str]
    docType: str
    exporter: dict
    importer: dict
    items: List[CustomsItem]
    currency: str
    totalValueUSD: float
    signedBy: str
    signatureDate: str
    createdAt: str


# ============ ROUTER ============
def build_router(db, get_current_user_dep):
    router = APIRouter(prefix="/api")

    # ---- INVOICES ----
    @router.get("/invoices")
    async def list_invoices(
        user: dict = Depends(get_current_user_dep),
        status: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        pageSize: int = Query(20, ge=1, le=100),
    ):
        """
        Paginated, auth-scoped invoice list.

        DHL Mapping: Invoicing — Internal (DHL XML Services does not cover
        billing). This is the SaaS layer on top of DHL operations.
        """
        q = {"userId": user["id"]}
        if status:
            q["status"] = status.upper()
        total = await db.invoices.count_documents(q)
        skip = (page - 1) * pageSize
        rows = await db.invoices.find(q, {"_id": 0}).sort("issueDate", -1).skip(skip).limit(pageSize).to_list(length=pageSize)
        return {"items": rows, "total": total, "page": page, "pageSize": pageSize}

    @router.get("/invoices/{number}")
    async def invoice_detail(number: str, user: dict = Depends(get_current_user_dep)):
        doc = await db.invoices.find_one({"invoiceNumber": number, "userId": user["id"]}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return doc

    @router.get("/invoices/{number}/pdf")
    async def invoice_pdf(number: str, user: dict = Depends(get_current_user_dep)):
        doc = await db.invoices.find_one({"invoiceNumber": number, "userId": user["id"]}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Invoice not found")
        pdf_bytes = render_invoice(doc, user)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{number}.pdf"'},
        )

    @router.post("/invoices/{number}/pay")
    async def pay_invoice(number: str, user: dict = Depends(get_current_user_dep)):
        doc = await db.invoices.find_one({"invoiceNumber": number, "userId": user["id"]})
        if not doc:
            raise HTTPException(status_code=404, detail="Invoice not found")
        if doc["status"] == "PAID":
            raise HTTPException(status_code=400, detail="Invoice already paid")
        ref = "PAY" + "".join(str(random.randint(0, 9)) for _ in range(10))
        now = datetime.now(timezone.utc).isoformat()
        await db.invoices.update_one(
            {"invoiceNumber": number, "userId": user["id"]},
            {"$set": {"status": "PAID", "paidDate": now, "paymentReference": ref}},
        )
        # Also create a payment record for traceability
        await db.payments.insert_one({
            "id": str(uuid.uuid4()),
            "userId": user["id"],
            "amountPGK": doc["totalPGK"],
            "currency": "PGK",
            "method": "account",
            "last4": "0000",
            "status": "SUCCESS",
            "referenceNumber": ref,
            "createdAt": now,
            "linkedInvoiceNumber": number,
        })
        updated = await db.invoices.find_one({"invoiceNumber": number, "userId": user["id"]}, {"_id": 0})
        return updated

    # ---- REPORTS ----
    @router.get("/reports/overview")
    async def reports_overview(user: dict = Depends(get_current_user_dep)):
        """
        Aggregated analytics for the customer dashboard.

        DHL Mapping: Internal — aggregations over `shipments` + `invoices`
        collections (DHL XML Services has no analytics surface).
        """
        user_id = user["id"]
        # Pull all shipments (capped 500 for safety)
        shipments = await db.shipments.find(
            {"userId": user_id}, {"_id": 0}
        ).to_list(length=500)

        # Monthly spend last 6 months
        now = datetime.now(timezone.utc)
        months = []
        for i in range(5, -1, -1):
            d = (now - timedelta(days=30 * i))
            months.append({"key": d.strftime("%Y-%m"), "label": d.strftime("%b %Y"), "totalPGK": 0.0})
        m_map = {m["key"]: m for m in months}
        for s in shipments:
            try:
                created = datetime.fromisoformat(s["createdAt"].replace("Z", "+00:00")) if isinstance(s["createdAt"], str) else s["createdAt"]
            except Exception:
                continue
            key = created.strftime("%Y-%m")
            if key in m_map:
                m_map[key]["totalPGK"] += s.get("costPGK", 0)
        monthly_spend = [{"month": m["label"], "totalPGK": round(m["totalPGK"], 2)} for m in months]

        # By service
        by_service = defaultdict(lambda: {"count": 0, "totalPGK": 0.0})
        for s in shipments:
            svc = s.get("service", "OTHER")
            by_service[svc]["count"] += 1
            by_service[svc]["totalPGK"] += s.get("costPGK", 0)
        by_service_list = [
            {"service": k, "count": v["count"], "totalPGK": round(v["totalPGK"], 2)}
            for k, v in by_service.items()
        ]

        # By status
        status_counts = Counter(s.get("status", "PENDING") for s in shipments)
        by_status = [{"status": st, "count": n} for st, n in status_counts.items()]

        # Top destinations
        dest_agg = defaultdict(lambda: {"count": 0, "totalPGK": 0.0, "country": ""})
        for s in shipments:
            d = s.get("destination", {})
            key = d.get("city", "Unknown")
            dest_agg[key]["count"] += 1
            dest_agg[key]["totalPGK"] += s.get("costPGK", 0)
            dest_agg[key]["country"] = d.get("country", "")
        top_destinations = sorted(
            [{"city": k, "country": v["country"], "count": v["count"], "totalPGK": round(v["totalPGK"], 2)} for k, v in dest_agg.items()],
            key=lambda x: x["count"], reverse=True,
        )[:5]

        # Volume over last 30 days
        days = []
        for i in range(29, -1, -1):
            d = (now - timedelta(days=i)).date()
            days.append({"date": d.isoformat(), "count": 0})
        d_map = {d["date"]: d for d in days}
        for s in shipments:
            try:
                created = datetime.fromisoformat(s["createdAt"].replace("Z", "+00:00")) if isinstance(s["createdAt"], str) else s["createdAt"]
            except Exception:
                continue
            key = created.date().isoformat()
            if key in d_map:
                d_map[key]["count"] += 1
        volume_over_time = days

        return {
            "monthlySpend": monthly_spend,
            "shipmentsByService": by_service_list,
            "shipmentsByStatus": by_status,
            "topDestinations": top_destinations,
            "dailyVolume": volume_over_time,
        }

    @router.get("/reports/pdf")
    async def report_pdf(user: dict = Depends(get_current_user_dep)):
        # Reuse the overview computation
        overview = await reports_overview(user)
        pdf_bytes = render_report(overview, user)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": 'inline; filename="account-report.pdf"'},
        )

    # ---- CUSTOMS ----
    @router.get("/customs", response_model=List[CustomsDocOut])
    async def list_customs(user: dict = Depends(get_current_user_dep)):
        """
        List user's customs documents.

        DHL Mapping: Customs documentation (related to Shipment Validation
        `Dutiable` block, DHL XML Services Guide §5). The list endpoint
        itself is our internal storage convenience.
        """
        cursor = db.customs_documents.find({"userId": user["id"]}, {"_id": 0}).sort("createdAt", -1)
        return await cursor.to_list(length=200)

    @router.post("/customs", response_model=CustomsDocOut, status_code=201)
    async def create_customs(payload: CustomsDocIn, user: dict = Depends(get_current_user_dep)):
        """
        Generate a customs document (commercial invoice / packing list / export decl).

        DHL Mapping: Customs documentation (related to Shipment Validation
        `Dutiable` block, DHL XML Services Guide §5). DHL's XML accepts these
        as a Dutiable sub-document on the shipment; we model them as a
        standalone object for the UI workflow.
        """
        if payload.docType not in ("COMMERCIAL_INVOICE", "PACKING_LIST", "EXPORT_DECLARATION"):
            raise HTTPException(status_code=400, detail="Invalid docType")
        total = sum(it.quantity * it.unitValue for it in payload.items)
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": str(uuid.uuid4()),
            "userId": user["id"],
            "shipmentAwb": payload.shipmentAwb,
            "docType": payload.docType,
            "exporter": payload.exporter.model_dump(),
            "importer": payload.importer.model_dump(),
            "items": [i.model_dump() for i in payload.items],
            "currency": payload.currency,
            "totalValueUSD": round(total, 2),
            "signedBy": payload.signedBy,
            "signatureDate": now,
            "createdAt": now,
        }
        await db.customs_documents.insert_one(doc)
        return {k: v for k, v in doc.items() if k != "_id"}

    @router.get("/customs/{doc_id}/pdf")
    async def customs_pdf(doc_id: str, user: dict = Depends(get_current_user_dep)):
        doc = await db.customs_documents.find_one({"id": doc_id, "userId": user["id"]}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        pdf_bytes = render_customs_doc(doc)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="customs-{doc_id[:8]}.pdf"'},
        )

    return router


# ============ SEED ============
async def seed_invoices(db, user: dict):
    """Seed 8 invoices (4 PAID, 3 UNPAID, 1 OVERDUE) referencing existing shipments."""
    user_id = user["id"]
    existing = await db.invoices.count_documents({"userId": user_id})
    if existing >= 8:
        return
    if existing > 0:
        await db.invoices.delete_many({"userId": user_id})

    # Grab shipments to use as line items
    shipments = await db.shipments.find({"userId": user_id}, {"_id": 0}).to_list(length=50)
    if not shipments:
        return

    random.seed(303)
    now = datetime.now(timezone.utc)
    invoices = []
    statuses = ["PAID", "PAID", "PAID", "PAID", "UNPAID", "UNPAID", "UNPAID", "OVERDUE"]
    for i, st in enumerate(statuses):
        # Pick 2-4 shipments for line items
        sample = random.sample(shipments, k=min(len(shipments), random.randint(2, 4)))
        line_items = [
            {"shipmentAwb": s["awb"],
             "description": f"{s['service'].replace('_', ' ')} · {s['origin']['code']}→{s['destination']['code']}",
             "costPGK": s["costPGK"]}
            for s in sample
        ]
        subtotal = round(sum(li["costPGK"] for li in line_items), 2)
        tax = round(subtotal * 0.10, 2)
        total = round(subtotal + tax, 2)
        # Dates
        if st == "OVERDUE":
            issue = now - timedelta(days=45)
            due = now - timedelta(days=15)
        elif st == "UNPAID":
            issue = now - timedelta(days=random.randint(5, 20))
            due = issue + timedelta(days=30)
        else:  # PAID
            issue = now - timedelta(days=random.randint(30, 150))
            due = issue + timedelta(days=30)
        inv = {
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "invoiceNumber": "INV" + "".join(str(random.randint(0, 9)) for _ in range(8)),
            "issueDate": issue.isoformat(),
            "dueDate": due.isoformat(),
            "status": st,
            "subtotalPGK": subtotal,
            "taxPGK": tax,
            "totalPGK": total,
            "lineItems": line_items,
            "paidDate": (issue + timedelta(days=random.randint(2, 25))).isoformat() if st == "PAID" else None,
            "paymentReference": ("PAY" + "".join(str(random.randint(0, 9)) for _ in range(10))) if st == "PAID" else None,
        }
        invoices.append(inv)

    await db.invoices.insert_many(invoices)
    logger.info(f"[SEED] Inserted {len(invoices)} invoices for {user['email']}")
