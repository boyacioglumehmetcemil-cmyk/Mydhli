"""Shipments module for DHL Express PNG Demo.
- Pydantic models for shipments, addresses, events, packages
- Public tracking endpoint (privacy-scrubbed)
- Auth-required list/detail endpoints (full PII)
- Seed function — populates 25 mock shipments for the demo user on first boot
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from io import BytesIO
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import random
import uuid
import logging

logger = logging.getLogger(__name__)

# ============ STATIC DATA ============
ORIGINS_PNG = [
    {"city": "Port Moresby", "country": "PG", "code": "POM"},
    {"city": "Lae", "country": "PG", "code": "LAE"},
    {"city": "Mt Hagen", "country": "PG", "code": "HGU"},
    {"city": "Madang", "country": "PG", "code": "MAG"},
    {"city": "Goroka", "country": "PG", "code": "GKA"},
]

DESTINATIONS_INTL = [
    {"city": "Sydney", "country": "AU", "code": "SYD"},
    {"city": "Singapore", "country": "SG", "code": "SIN"},
    {"city": "Hong Kong", "country": "HK", "code": "HKG"},
    {"city": "Auckland", "country": "NZ", "code": "AKL"},
    {"city": "Tokyo", "country": "JP", "code": "NRT"},
    {"city": "Los Angeles", "country": "US", "code": "LAX"},
    {"city": "London", "country": "UK", "code": "LHR"},
    {"city": "Dubai", "country": "AE", "code": "DXB"},
]

# Hub city for in-transit events (between origin and destination)
HUBS_BY_DEST = {
    "SYD": [{"city": "Brisbane", "country": "AU", "code": "BNE"}],
    "AKL": [{"city": "Brisbane", "country": "AU", "code": "BNE"}],
    "SIN": [{"city": "Singapore", "country": "SG", "code": "SIN"}],
    "HKG": [{"city": "Singapore", "country": "SG", "code": "SIN"}],
    "NRT": [{"city": "Hong Kong", "country": "HK", "code": "HKG"}],
    "LAX": [{"city": "Sydney", "country": "AU", "code": "SYD"}, {"city": "Los Angeles", "country": "US", "code": "LAX"}],
    "LHR": [{"city": "Singapore", "country": "SG", "code": "SIN"}, {"city": "Dubai", "country": "AE", "code": "DXB"}],
    "DXB": [{"city": "Singapore", "country": "SG", "code": "SIN"}],
}

EVENT_DEFINITIONS = {
    "OC": "Shipment information received",
    "PU": "Shipment picked up",
    "AF": "Departed facility in {city}",
    "AR": "Arrived at facility in {city}",
    "WC": "With delivery courier",
    "OK": "Delivered — signed by {initial}",
    "HP": "On hold — awaiting customs clearance",
    "MS": "Exception — address verification needed",
}

SERVICE_TYPES = ["EXPRESS_WORLDWIDE", "EXPRESS_12_00", "ECONOMY_SELECT"]
SERVICE_DAYS_ETA = {
    "EXPRESS_12_00": (1, 2),
    "EXPRESS_WORLDWIDE": (2, 4),
    "ECONOMY_SELECT": (4, 7),
}

SENDER_COMPANIES = [
    ("Niugini Trading Co", "Lukas Wapi"),
    ("Pacific Coast Imports", "Mary Tau"),
    ("Highland Coffee Exports", "Joseph Kila"),
    ("Coral Reef Logistics", "Anna Bua"),
    ("Sepik River Trading", "Peter Namus"),
    ("PNG Mining Supplies", "Grace Toua"),
    ("Madang Marine Co", "Daniel Kava"),
    ("Goroka Foods Ltd", "Sarah Bauni"),
]

RECEIVER_COMPANIES_BY_DEST = {
    "SYD": [("Bondi Logistics Pty", "James Hayes"), ("Harbour Bridge Imports", "Olivia Chen")],
    "SIN": [("Marina Bay Distribution", "Wei Lin Tan"), ("Asia Pacific Holdings", "Rajesh Kumar")],
    "HKG": [("Kowloon Trading HK", "Chen Ka-Ming"), ("Victoria Peak Imports", "Sophie Wong")],
    "AKL": [("Kiwi Express NZ", "Liam O'Brien"), ("Southern Cross Trading", "Emma Tane")],
    "NRT": [("Tokyo Pacific KK", "Hiro Tanaka"), ("Shibuya Imports Co", "Yuki Sato")],
    "LAX": [("Pacific Coast LLC", "Michael Rivera"), ("West Coast Distribution", "Jennifer Park")],
    "LHR": [("Thames Imports Ltd", "Oliver Smith"), ("Greenwich Trading Co", "Charlotte Davies")],
    "DXB": [("Gulf Trade FZE", "Ahmed Al-Rashid"), ("Emirates Logistics", "Fatima Hassan")],
}

PACKAGE_DESCRIPTIONS = [
    "Coffee bean samples (commercial)",
    "Machinery spare parts",
    "Legal documents",
    "Marine equipment components",
    "Electronic components",
    "Textile samples",
    "Mineral specimens (declared)",
    "Pharmaceutical sample kit",
    "Engineering drawings (sealed)",
    "Industrial fasteners",
    "Medical device components",
    "Apparel order (sample)",
]


# ============ MODELS ============
class AddressModel(BaseModel):
    name: str
    company: str
    address: str
    city: str
    country: str
    phone: str
    email: str
    postalCode: str


class AddressPublicModel(BaseModel):
    """Privacy-scrubbed for public tracking — only city + country."""
    city: str
    country: str


class PackageDimensions(BaseModel):
    l: float
    w: float
    h: float


class PackageModel(BaseModel):
    pieces: int
    weightKg: float
    dimensions: PackageDimensions
    description: str
    declaredValueUSD: float


class LocationCode(BaseModel):
    city: str
    country: str
    code: str


class ShipmentEvent(BaseModel):
    timestamp: datetime
    status: str
    location: str
    description: str
    code: str


class Shipment(BaseModel):
    """Full shipment with PII — only returned to authenticated owners."""
    awb: str
    userId: Optional[str]
    sender: AddressModel
    receiver: AddressModel
    package: PackageModel
    service: str
    status: str
    origin: LocationCode
    destination: LocationCode
    events: List[ShipmentEvent]
    estimatedDelivery: datetime
    actualDelivery: Optional[datetime]
    costPGK: float
    createdAt: datetime
    updatedAt: datetime


class ShipmentPublic(BaseModel):
    """Privacy-scrubbed for public tracking — no PII."""
    awb: str
    sender: AddressPublicModel
    receiver: AddressPublicModel
    package: dict  # only pieces + weightKg
    service: str
    status: str
    origin: LocationCode
    destination: LocationCode
    events: List[ShipmentEvent]
    estimatedDelivery: datetime
    actualDelivery: Optional[datetime]


class ShipmentSummary(BaseModel):
    """Lighter shape for list views."""
    awb: str
    status: str
    service: str
    origin: LocationCode
    destination: LocationCode
    receiverName: str
    receiverCity: str
    costPGK: float
    createdAt: datetime
    estimatedDelivery: datetime
    eventsCount: int


class ShipmentListResponse(BaseModel):
    items: List[ShipmentSummary]
    total: int
    page: int
    pageSize: int


class ShipmentCreate(BaseModel):
    sender: AddressModel
    receiver: AddressModel
    package: PackageModel
    service: str
    paymentMethod: str = "account"
    costPGK: float = Field(default=0, ge=0)


# ============ HELPERS ============
def _normalize_shipment(doc: dict) -> dict:
    """Strip Mongo _id, convert ISO strings back to datetimes."""
    if doc is None:
        return None
    doc = {k: v for k, v in doc.items() if k != "_id"}
    for key in ("createdAt", "updatedAt", "estimatedDelivery", "actualDelivery"):
        if isinstance(doc.get(key), str):
            doc[key] = datetime.fromisoformat(doc[key])
    for ev in doc.get("events", []):
        if isinstance(ev.get("timestamp"), str):
            ev["timestamp"] = datetime.fromisoformat(ev["timestamp"])
    return doc


def _scrub_for_public(doc: dict) -> dict:
    """Remove PII from a shipment doc for unauthenticated tracking."""
    scrubbed = dict(doc)
    scrubbed["sender"] = {
        "city": doc["sender"]["city"],
        "country": doc["sender"]["country"],
    }
    scrubbed["receiver"] = {
        "city": doc["receiver"]["city"],
        "country": doc["receiver"]["country"],
    }
    pkg = doc.get("package", {})
    scrubbed["package"] = {
        "pieces": pkg.get("pieces"),
        "weightKg": pkg.get("weightKg"),
    }
    scrubbed.pop("userId", None)
    scrubbed.pop("costPGK", None)
    return scrubbed


def _to_summary(doc: dict) -> ShipmentSummary:
    return ShipmentSummary(
        awb=doc["awb"],
        status=doc["status"],
        service=doc["service"],
        origin=LocationCode(**doc["origin"]),
        destination=LocationCode(**doc["destination"]),
        receiverName=doc["receiver"]["name"],
        receiverCity=doc["receiver"]["city"],
        costPGK=doc["costPGK"],
        createdAt=doc["createdAt"],
        estimatedDelivery=doc["estimatedDelivery"],
        eventsCount=len(doc.get("events", [])),
    )


# ============ ROUTER ============
def build_router(db, get_current_user_dep):
    """Build the shipments APIRouter.
    db: motor AsyncIOMotorDatabase instance
    get_current_user_dep: FastAPI Depends() callable returning current user dict
    """
    router = APIRouter(prefix="/api")

    @router.get("/track/{awb}", response_model=ShipmentPublic)
    async def public_track(awb: str):
        """
        Public, PII-scrubbed tracking view by Air Waybill number.

        DHL Mapping: Tracking Service (DHL XML Services Guide §3 introduction
        + §1 service list). On production switch, this adapter calls the live
        Tracking endpoint and returns the same scrubbed shape to the UI.
        """
        doc = await db.shipments.find_one({"awb": awb.upper()})
        if not doc:
            raise HTTPException(status_code=404, detail="No shipment found for this AWB")
        normalized = _normalize_shipment(doc)
        scrubbed = _scrub_for_public(normalized)
        return ShipmentPublic(**scrubbed)

    @router.get("/shipments", response_model=ShipmentListResponse)
    async def list_shipments(
        current_user: dict = Depends(get_current_user_dep),
        status: Optional[str] = Query(None),
        search: Optional[str] = Query(None),
        dateFrom: Optional[str] = Query(None),
        dateTo: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        pageSize: int = Query(20, ge=1, le=100),
    ):
        """
        Auth-scoped shipment list with pagination/filters.

        DHL Mapping: Internal (not part of the DHL XML Services Guide).
        Backed by Mongo `shipments` collection. The DHL Tracking Service
        operates per-AWB; this list view is our SaaS-side dashboard layer.
        """
        query: dict = {"userId": current_user["id"]}
        if status:
            query["status"] = status.upper()
        if search:
            s = search.strip()
            query["$or"] = [
                {"awb": {"$regex": s, "$options": "i"}},
                {"receiver.name": {"$regex": s, "$options": "i"}},
                {"destination.city": {"$regex": s, "$options": "i"}},
            ]
        if dateFrom or dateTo:
            date_q: dict = {}
            if dateFrom:
                date_q["$gte"] = dateFrom  # ISO string compare works
            if dateTo:
                date_q["$lte"] = dateTo
            query["createdAt"] = date_q

        total = await db.shipments.count_documents(query)
        skip = (page - 1) * pageSize
        cursor = db.shipments.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(pageSize)
        rows = await cursor.to_list(length=pageSize)
        items = [_to_summary(_normalize_shipment(r)) for r in rows]
        return ShipmentListResponse(items=items, total=total, page=page, pageSize=pageSize)

    @router.get("/shipments/{awb}", response_model=Shipment)
    async def shipment_detail(
        awb: str,
        current_user: dict = Depends(get_current_user_dep),
    ):
        """
        Auth-scoped, PII-complete shipment detail for the owner.

        DHL Mapping: Internal owner view. The DHL XML Tracking response only
        carries the public (scrubbed) shape; this endpoint exposes the full
        sender/receiver/package fields stored alongside it in our DB.
        """
        doc = await db.shipments.find_one(
            {"awb": awb.upper(), "userId": current_user["id"]},
            {"_id": 0},
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Shipment not found")
        normalized = _normalize_shipment(doc)
        return Shipment(**normalized)

    @router.post("/shipments", response_model=Shipment, status_code=201)
    async def create_shipment(
        payload: ShipmentCreate,
        current_user: dict = Depends(get_current_user_dep),
    ):
        """
        Validate a new shipment and persist it with a generated AWB.

        DHL Mapping: Shipment Validation Service (DHL XML Services Guide §5).
        Generates AWB + initial `OC` ("Shipment information received") event.
        On production switch, this handler becomes the adapter that posts
        the equivalent ShipmentValidation request to DHL and stores the
        returned AWB / events in our DB.
        """
        # Validate service
        if payload.service not in ("EXPRESS_WORLDWIDE", "EXPRESS_12_00", "ECONOMY_SELECT"):
            raise HTTPException(status_code=400, detail="Invalid service code")

        # Resolve origin/destination location codes
        from business_module import CITIES
        def _resolve_loc(country: str, city: str):
            for c in CITIES.get(country.upper(), []):
                if c["city"].lower() == city.lower():
                    return {"city": c["city"], "country": country.upper(), "code": c["code"]}
            return {"city": city, "country": country.upper(), "code": city[:3].upper()}

        origin = _resolve_loc(payload.sender.country, payload.sender.city)
        destination = _resolve_loc(payload.receiver.country, payload.receiver.city)

        # Generate unique AWB
        for _ in range(8):
            awb = "DHL" + "".join(str(random.randint(0, 9)) for _ in range(10))
            existing = await db.shipments.find_one({"awb": awb})
            if not existing:
                break

        # ETA per service (rough)
        eta_days = {"EXPRESS_12_00": 1, "EXPRESS_WORLDWIDE": 3, "ECONOMY_SELECT": 6}[payload.service]
        now = datetime.now(timezone.utc)
        eta = now + timedelta(days=eta_days)

        events = [{
            "timestamp": now.isoformat(),
            "status": "OC",
            "location": f"{origin['city']}, {origin['country']}",
            "description": "Shipment information received",
            "code": "OC",
        }]

        doc = {
            "awb": awb,
            "userId": current_user["id"],
            "sender": payload.sender.model_dump(),
            "receiver": payload.receiver.model_dump(),
            "package": payload.package.model_dump(),
            "service": payload.service,
            "status": "PENDING",
            "origin": origin,
            "destination": destination,
            "events": events,
            "estimatedDelivery": eta.isoformat(),
            "actualDelivery": None,
            "costPGK": payload.costPGK or 150.0,
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        }
        await db.shipments.insert_one(doc)
        return Shipment(**_normalize_shipment(doc))

    @router.get("/shipments/{awb}/label.pdf")
    async def shipment_label(
        awb: str,
        request: Request,
        current_user: dict = Depends(get_current_user_dep),
    ):
        """
        Render the shipping label PDF (with AWB barcode + tracking QR).

        DHL Mapping: Shipment Validation Service — Label Image (DHL XML
        Services Guide §7). DHL returns the label as a base64 image; we
        render it server-side via ReportLab for the demo.
        """
        doc = await db.shipments.find_one(
            {"awb": awb.upper(), "userId": current_user["id"]},
            {"_id": 0},
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Shipment not found")
        from labels_module import render_shipping_label
        track_url = f"{request.base_url}track/{awb.upper()}".replace("/api/", "/")
        pdf_bytes = render_shipping_label(doc, track_url)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="label-{awb.upper()}.pdf"'},
        )

    # ============ SHIPMENT DOCUMENTS (additive) ============
    async def _load_shipment_for_user(awb: str, user_id: str) -> dict:
        doc = await db.shipments.find_one(
            {"awb": awb.upper(), "userId": user_id},
            {"_id": 0},
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Shipment not found")
        return doc

    async def _load_user(user_id: str) -> dict:
        u = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        return u or {}

    async def _latest_customs(awb: str, user_id: str) -> Optional[dict]:
        return await db.customs_documents.find_one(
            {"shipmentAwb": awb.upper(), "userId": user_id},
            {"_id": 0},
            sort=[("createdAt", -1)],
        )

    def _stream_pdf(pdf_bytes: bytes, awb: str, slug: str) -> StreamingResponse:
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{awb}_{slug}.pdf"'},
        )

    @router.get("/shipments/{awb}/documents/airwaybill.pdf")
    async def doc_airwaybill(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Air Waybill PDF for a shipment.

        DHL Mapping: Shipment Validation Service — Label Image (§7) — Air
        Waybill format. Our own A4 layout — not a pixel-replica of any
        carrier's printed AWB form.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_air_waybill
        return _stream_pdf(generate_air_waybill(shipment, user, customs_doc), awb.upper(), "airwaybill")

    @router.get("/shipments/{awb}/documents/proforma.pdf")
    async def doc_proforma(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Proforma Invoice PDF (pre-shipment estimated values).

        DHL Mapping: Internal — supports §6 Customs declaration workflow.
        Layout mirrors the client's template (PROFORMA INVOICE PNG.docx):
        Sender/Receiver side-by-side, Shipment Details KV, Line Items in
        PGK with TOTAL DECLARED VALUE, Declaration, signature block.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_proforma_invoice
        return _stream_pdf(
            generate_proforma_invoice(shipment, user, customs_doc),
            awb.upper(), "proforma",
        )

    @router.get("/shipments/{awb}/documents/commercial.pdf")
    async def doc_commercial(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Commercial Invoice PDF (customs declaration invoice).

        DHL Mapping: §6 Non-Document Customs Requirement supporting paperwork.
        Pulls the latest matching customs declaration if one exists; falls
        back to the shipment's package data otherwise.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_commercial_invoice
        return _stream_pdf(
            generate_commercial_invoice(shipment, user, customs_doc),
            awb.upper(), "commercial",
        )

    @router.get("/shipments/{awb}/documents/tax.pdf")
    async def doc_tax(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Tax Invoice PDF (freight + 10% GST).

        DHL Mapping: Internal billing layer (not part of DHL XML).
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_tax_invoice
        return _stream_pdf(generate_tax_invoice(shipment, user), awb.upper(), "tax")

    @router.get("/shipments/{awb}/documents/inbound.pdf")
    async def doc_inbound(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Inbound Invoice PDF (receiver-side duties + clearance).

        DHL Mapping: Internal billing layer (not part of DHL XML).
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_inbound_invoice
        return _stream_pdf(generate_inbound_invoice(shipment, user), awb.upper(), "inbound")

    @router.get("/shipments/{awb}/documents/declaration.pdf")
    async def doc_declaration(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Shipment Declaration PDF (shipper's export declaration).

        DHL Mapping: §5 Shipment Validation `Dutiable` block — Shipper's
        export declaration. Uses the latest customs declaration on file
        if present.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_shipment_declaration
        return _stream_pdf(
            generate_shipment_declaration(shipment, user, customs_doc),
            awb.upper(), "declaration",
        )

    # ---- Documents 7-12 (additive) ----
    @router.get("/shipments/{awb}/documents/pod.pdf")
    async def doc_pod(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Proof of Delivery PDF.

        DHL Mapping: Tracking Service (§3) — post-delivery confirmation form.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_pod
        return _stream_pdf(generate_pod(shipment, user), awb.upper(), "pod")

    @router.get("/shipments/{awb}/documents/certificate-of-origin.pdf")
    async def doc_cof(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Certificate of Origin PDF.

        DHL Mapping: §6 Customs supporting paperwork — Certificate of Origin.
        Exporter declares the goods are products of a stated country.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_certificate_of_origin
        return _stream_pdf(
            generate_certificate_of_origin(shipment, user, customs_doc),
            awb.upper(), "certificate-of-origin",
        )

    @router.get("/shipments/{awb}/documents/loa.pdf")
    async def doc_loa(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Letter of Authorization PDF.

        DHL Mapping: §6 Customs supporting paperwork — broker authorization.
        Customer authorizes DHL to act on customs declarations.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_letter_of_authorization
        return _stream_pdf(generate_letter_of_authorization(shipment, user), awb.upper(), "loa")

    @router.get("/shipments/{awb}/documents/packing-list.pdf")
    async def doc_packing_list(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Packing List PDF (itemized with weights and dimensions).

        DHL Mapping: §6 Customs supporting paperwork — Packing List.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_packing_list
        return _stream_pdf(
            generate_packing_list(shipment, user, customs_doc),
            awb.upper(), "packing-list",
        )

    @router.get("/shipments/{awb}/documents/receipt.pdf")
    async def doc_receipt(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Shipment Receipt PDF (booking receipt slip).

        DHL Mapping: Internal — receipt issued at booking. Not a DHL XML
        operation, but a customer-facing artifact.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_shipment_receipt
        return _stream_pdf(generate_shipment_receipt(shipment, user), awb.upper(), "receipt")

    @router.get("/shipments/{awb}/documents/payment-confirmation.pdf")
    async def doc_payment_confirmation(awb: str, current_user: dict = Depends(get_current_user_dep)):
        """
        Render the Payment Confirmation PDF (proof of payment).

        DHL Mapping: Internal billing — receipt for a payment processed via
        the /api/payments/charge endpoint or recorded by the back-office.
        """
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        payment = await db.payments.find_one(
            {"awb": awb.upper(), "userId": current_user["id"]},
            {"_id": 0},
            sort=[("paidAt", -1)],
        )
        from document_generator import generate_payment_confirmation
        return _stream_pdf(
            generate_payment_confirmation(shipment, user, payment),
            awb.upper(), "payment-confirmation",
        )

    return router


# ============ SEED ============
def _gen_events_for_status(status: str, origin: dict, dest: dict, created_at: datetime,
                            eta: datetime, recipient_initial: str) -> List[dict]:
    """Generate a realistic event chain for a given status."""
    hubs = HUBS_BY_DEST.get(dest["code"], [{"city": dest["city"], "country": dest["country"], "code": dest["code"]}])
    total_duration = (eta - created_at).total_seconds()
    events: List[dict] = []

    def _add(code: str, location_city: str, location_country: str, fraction: float, extra: dict = None):
        ts = created_at + timedelta(seconds=total_duration * fraction)
        desc = EVENT_DEFINITIONS[code].format(city=location_city, initial=recipient_initial)
        ev = {
            "timestamp": ts.isoformat(),
            "status": code,
            "location": f"{location_city}, {location_country}",
            "description": desc,
            "code": code,
        }
        events.append(ev)

    # OC always first
    _add("OC", origin["city"], origin["country"], 0.02)

    if status == "PENDING":
        return events

    # PU
    _add("PU", origin["city"], origin["country"], 0.12)

    if status == "PICKED_UP":
        # 30% chance also has AF (departure)
        if random.random() < 0.5:
            _add("AF", origin["city"], origin["country"], 0.22)
        return events

    # AF (departed origin)
    _add("AF", origin["city"], origin["country"], 0.22)

    if status == "ON_HOLD":
        # Arrive at first hub, then HP
        first_hub = hubs[0]
        _add("AR", first_hub["city"], first_hub["country"], 0.42)
        _add("HP", first_hub["city"], first_hub["country"], 0.5)
        return events

    if status == "EXCEPTION":
        # Got to first hub, then exception
        first_hub = hubs[0]
        _add("AR", first_hub["city"], first_hub["country"], 0.4)
        _add("MS", first_hub["city"], first_hub["country"], 0.5)
        return events

    # In transit / OFD / DELIVERED — go through hubs
    fraction = 0.35
    for hub in hubs:
        _add("AR", hub["city"], hub["country"], fraction)
        fraction += 0.1
        _add("AF", hub["city"], hub["country"], fraction)
        fraction += 0.1

    # Arrive at destination
    _add("AR", dest["city"], dest["country"], 0.78)

    if status == "IN_TRANSIT":
        return events

    # OUT_FOR_DELIVERY
    _add("WC", dest["city"], dest["country"], 0.92)

    if status == "OUT_FOR_DELIVERY":
        return events

    # DELIVERED
    _add("OK", dest["city"], dest["country"], 1.0)
    return events


async def seed_shipments(db, demo_user_id: str):
    """Seed 25 shipments for the demo user if the collection is empty (filtered to demo user)."""
    existing = await db.shipments.count_documents({"userId": demo_user_id})
    if existing >= 25:
        logger.info(f"[SEED] Shipments already seeded ({existing} for demo user). Skipping.")
        return

    if existing > 0:
        # Clear partial seed
        await db.shipments.delete_many({"userId": demo_user_id})

    random.seed(42)  # deterministic

    # Status mix: 5 DELIVERED, 8 IN_TRANSIT, 4 OUT_FOR_DELIVERY, 3 PICKED_UP, 2 PENDING, 2 ON_HOLD, 1 EXCEPTION
    status_plan = (
        ["DELIVERED"] * 5
        + ["IN_TRANSIT"] * 8
        + ["OUT_FOR_DELIVERY"] * 4
        + ["PICKED_UP"] * 3
        + ["PENDING"] * 2
        + ["ON_HOLD"] * 2
        + ["EXCEPTION"] * 1
    )

    # Reserve guaranteed-demoable AWB for index 5 (first IN_TRANSIT after the 5 DELIVERED)
    # That maps to status_plan[5] = "IN_TRANSIT" ✓
    fixed_awbs = {5: "DHL1234567890"}
    now = datetime.now(timezone.utc)
    docs = []

    for i, st in enumerate(status_plan):
        # Pick origin & destination
        origin = ORIGINS_PNG[i % len(ORIGINS_PNG)]
        dest = DESTINATIONS_INTL[i % len(DESTINATIONS_INTL)]
        # Special-case index 5: ensure POM -> SYD
        if i == 5:
            origin = ORIGINS_PNG[0]  # Port Moresby
            dest = DESTINATIONS_INTL[0]  # Sydney

        service = random.choice(SERVICE_TYPES)
        eta_min, eta_max = SERVICE_DAYS_ETA[service]

        # createdAt spread across last 90 days
        # Newer for in-progress, older for delivered
        if st == "DELIVERED":
            days_ago = random.randint(15, 80)
        elif st in ("IN_TRANSIT", "OUT_FOR_DELIVERY"):
            days_ago = random.randint(1, 5)
        elif st == "PICKED_UP":
            days_ago = random.randint(0, 2)
        elif st == "PENDING":
            days_ago = 0
        elif st == "ON_HOLD":
            days_ago = random.randint(2, 8)
        else:  # EXCEPTION
            days_ago = random.randint(1, 6)

        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        eta_days = random.randint(eta_min, eta_max)
        eta = created_at + timedelta(days=eta_days, hours=random.randint(0, 12))

        if st == "DELIVERED":
            actual_delivery = eta + timedelta(hours=random.randint(-12, 12))
        else:
            actual_delivery = None

        sender_company, sender_name = SENDER_COMPANIES[i % len(SENDER_COMPANIES)]
        recv_options = RECEIVER_COMPANIES_BY_DEST.get(dest["code"], [("International Imports", "Alex Roy")])
        recv_company, recv_name = recv_options[i % len(recv_options)]

        awb = fixed_awbs.get(i) or f"DHL{random.randint(1000000000, 9999999999)}"

        sender_addr = {
            "name": sender_name,
            "company": sender_company,
            "address": f"{random.randint(1, 199)} Coronation Drive",
            "city": origin["city"],
            "country": origin["country"],
            "phone": f"+675 {random.randint(7000, 8999)} {random.randint(0, 9999):04d}",
            "email": f"{sender_name.split()[0].lower()}@{sender_company.lower().replace(' ', '').replace(',', '')[:14]}.com.pg",
            "postalCode": str(random.randint(100, 999)),
        }

        receiver_addr = {
            "name": recv_name,
            "company": recv_company,
            "address": f"{random.randint(10, 999)} {random.choice(['Main', 'King', 'Queen', 'Market', 'Park'])} Street",
            "city": dest["city"],
            "country": dest["country"],
            "phone": f"+{random.randint(1, 99)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}",
            "email": f"{recv_name.split()[0].lower()}@{recv_company.lower().replace(' ', '').replace(',', '')[:14]}.com",
            "postalCode": str(random.randint(1000, 99999)),
        }

        pieces = random.randint(1, 6)
        weight_per_piece = round(random.uniform(0.5, 12.0), 2)
        total_weight = round(pieces * weight_per_piece, 2)

        package = {
            "pieces": pieces,
            "weightKg": total_weight,
            "dimensions": {
                "l": round(random.uniform(15, 60), 1),
                "w": round(random.uniform(10, 45), 1),
                "h": round(random.uniform(8, 35), 1),
            },
            "description": PACKAGE_DESCRIPTIONS[i % len(PACKAGE_DESCRIPTIONS)],
            "declaredValueUSD": round(random.uniform(50, 4500), 2),
        }

        # Cost roughly proportional to weight, service, and destination tier
        base_cost = total_weight * (8 if service == "ECONOMY_SELECT" else 15 if service == "EXPRESS_WORLDWIDE" else 22)
        dest_multiplier = {"SYD": 1.0, "AKL": 1.1, "SIN": 1.3, "HKG": 1.4, "NRT": 1.6, "DXB": 1.8, "LAX": 2.1, "LHR": 2.4}.get(dest["code"], 1.5)
        cost_pgk = round(base_cost * dest_multiplier + random.uniform(40, 200), 2)
        cost_pgk = max(50.0, min(2500.0, cost_pgk))

        events = _gen_events_for_status(
            st, origin, dest, created_at, eta, recv_name.split()[0][0]
        )

        doc = {
            "awb": awb,
            "userId": demo_user_id,
            "sender": sender_addr,
            "receiver": receiver_addr,
            "package": package,
            "service": service,
            "status": st,
            "origin": origin,
            "destination": dest,
            "events": events,
            "estimatedDelivery": eta.isoformat(),
            "actualDelivery": actual_delivery.isoformat() if actual_delivery else None,
            "costPGK": cost_pgk,
            "createdAt": created_at.isoformat(),
            "updatedAt": created_at.isoformat(),
        }
        docs.append(doc)

    await db.shipments.insert_many(docs)
    # Indexes
    try:
        await db.shipments.create_index("awb", unique=True)
        await db.shipments.create_index([("userId", 1), ("createdAt", -1)])
    except Exception as e:
        logger.debug(f"Shipment index: {e}")

    logger.info(f"[SEED] Inserted 25 demo shipments for user {demo_user_id}. Guaranteed AWB: DHL1234567890")


# ============ SECONDARY SEED — shipper@dhlpng.com (Daniel Kavu) ============
SHIPPER_AWBS = [
    "DHL5520010001", "DHL5520010002", "DHL5520010003",
    "DHL5520010004", "DHL5520010005", "DHL5520010006",
]


async def seed_shipper_shipments(db, shipper_user_id: str):
    """Seed 6 shipments for the shipper demo user (Daniel Kavu / Highlands
    Mining Supplies (PNG) Ltd). All originate from Port Moresby and ship to
    a varied mix of international destinations.

    Status mix: 2 DELIVERED, 2 IN_TRANSIT, 1 PICKED_UP, 1 PENDING.
    """
    existing = await db.shipments.count_documents({"userId": shipper_user_id})
    if existing >= 6:
        logger.info(f"[SEED] Shipper shipments already seeded ({existing}). Skipping.")
        return
    if existing > 0:
        await db.shipments.delete_many({"userId": shipper_user_id})

    rng = random.Random(2026)

    plan = [
        # (status, dest_code, dest_city, dest_country, receiver_company, receiver_name, service)
        ("DELIVERED",  "SYD", "Sydney",     "AU", "Pacific Heavy Equipment Pty Ltd", "Maya Pereira",  "EXPRESS_WORLDWIDE"),
        ("DELIVERED",  "BNE", "Brisbane",   "AU", "Coral Sea Industrial Ltd",        "Felix Tan",     "EXPRESS_WORLDWIDE"),
        ("IN_TRANSIT", "SIN", "Singapore",  "SG", "Anchor Trading Co",               "Hadi Rahman",   "EXPRESS_12_00"),
        ("IN_TRANSIT", "AKL", "Auckland",   "NZ", "Southern Cross Procurement Ltd",  "Jordan Hale",   "EXPRESS_WORLDWIDE"),
        ("PICKED_UP",  "NRT", "Tokyo",      "JP", "Hanazono Commerce KK",            "Riku Sasaki",   "ECONOMY_SELECT"),
        ("PENDING",    "HKG", "Hong Kong",  "HK", "Victoria Harbour Imports Ltd",    "Ling Chow",     "EXPRESS_12_00"),
    ]
    origin = {"city": "Port Moresby", "country": "PG", "code": "POM"}
    sender_company = "Highlands Mining Supplies (PNG) Ltd"
    sender_name = "Daniel Kavu"

    descriptions = [
        "Hydraulic spare parts",
        "Industrial conveyor belting",
        "Sealed bearing assemblies",
        "Diamond core drilling consumables",
        "Replacement filters and hoses",
        "Calibrated measuring instruments",
    ]

    now = datetime.now(timezone.utc)
    docs = []

    for i, (st, dcode, dcity, dctry, rcomp, rname, service) in enumerate(plan):
        eta_min, eta_max = SERVICE_DAYS_ETA[service]

        if st == "DELIVERED":
            days_ago = rng.randint(15, 50)
        elif st == "IN_TRANSIT":
            days_ago = rng.randint(2, 6)
        elif st == "PICKED_UP":
            days_ago = rng.randint(0, 2)
        else:  # PENDING
            days_ago = 0

        created_at = now - timedelta(days=days_ago, hours=rng.randint(0, 23), minutes=rng.randint(0, 59))
        eta_days = rng.randint(eta_min, eta_max)
        eta = created_at + timedelta(days=eta_days, hours=rng.randint(0, 12))
        actual_delivery = eta + timedelta(hours=rng.randint(-12, 12)) if st == "DELIVERED" else None

        dest = {"city": dcity, "country": dctry, "code": dcode}

        sender_addr = {
            "name": sender_name,
            "company": sender_company,
            "address": f"{rng.randint(11, 199)} Sir Hubert Murray Highway",
            "city": origin["city"],
            "country": origin["country"],
            "phone": "+675 7345 1100",
            "email": "daniel.kavu@highlandsmining.com.pg",
            "postalCode": "121",
        }
        receiver_addr = {
            "name": rname,
            "company": rcomp,
            "address": f"{rng.randint(20, 880)} {rng.choice(['Industrial', 'Wharf', 'Harbour', 'Trade', 'Market'])} Road",
            "city": dest["city"],
            "country": dest["country"],
            "phone": f"+{rng.randint(60, 85)} {rng.randint(2000, 9999)} {rng.randint(1000, 9999)}",
            "email": f"{rname.split()[0].lower()}@{rcomp.lower().replace(' ', '').replace(',', '').replace('.', '')[:14]}.com",
            "postalCode": str(rng.randint(1000, 99999)),
        }
        pieces = rng.randint(1, 5)
        weight_per_piece = round(rng.uniform(0.8, 9.5), 2)
        total_weight = round(pieces * weight_per_piece, 2)

        package = {
            "pieces": pieces,
            "weightKg": total_weight,
            "dimensions": {
                "l": round(rng.uniform(20, 70), 1),
                "w": round(rng.uniform(15, 50), 1),
                "h": round(rng.uniform(10, 40), 1),
            },
            "description": descriptions[i],
            "declaredValueUSD": round(rng.uniform(80, 1900), 2),
        }

        base_cost = total_weight * (8 if service == "ECONOMY_SELECT" else 15 if service == "EXPRESS_WORLDWIDE" else 22)
        dest_mult = {"SYD": 1.0, "BNE": 1.0, "AKL": 1.1, "SIN": 1.3, "HKG": 1.4, "NRT": 1.6}.get(dcode, 1.2)
        cost_pgk = round(base_cost * dest_mult + rng.uniform(40, 150), 2)
        cost_pgk = max(200.0, min(1800.0, cost_pgk))

        events = _gen_events_for_status(st, origin, dest, created_at, eta, rname.split()[0][0])

        docs.append({
            "awb": SHIPPER_AWBS[i],
            "userId": shipper_user_id,
            "sender": sender_addr,
            "receiver": receiver_addr,
            "package": package,
            "service": service,
            "status": st,
            "origin": origin,
            "destination": dest,
            "events": events,
            "estimatedDelivery": eta.isoformat(),
            "actualDelivery": actual_delivery.isoformat() if actual_delivery else None,
            "costPGK": cost_pgk,
            "createdAt": created_at.isoformat(),
            "updatedAt": created_at.isoformat(),
        })

    await db.shipments.insert_many(docs)
    logger.info(
        f"[SEED] Inserted 6 shipper shipments for user {shipper_user_id}. "
        f"AWBs {SHIPPER_AWBS[0]}..{SHIPPER_AWBS[-1]}"
    )
