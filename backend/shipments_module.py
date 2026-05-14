"""Shipments + Bookings module for DHL Global Forwarding PNG Demo.

Phase 8.2 — multi-mode (AIR / OCEAN / ROAD) freight forwarding.

What this module owns:
- Shipment / Booking Pydantic models (backwards-compatible; new fields optional)
- Public tracking endpoint (multi-format reference lookup — auto-detect)
- Auth-scoped list / detail / create endpoints (full PII)
- Multi-mode quote endpoint
- 12 PDF document endpoints (phase 8.1)
- Seed function — populates 25 mock shipments for the demo user

Phase 8.2 additions are ADDITIVE: all new fields are Optional and existing
Phase 8.1 (and earlier) seeded shipments continue to work — they default to
mode="AIR" so the UI can still render them.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from io import BytesIO
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Any
from datetime import datetime, timezone, timedelta
import re
import random
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

HUBS_BY_DEST = {
    "SYD": [{"city": "Brisbane", "country": "AU", "code": "BNE"}],
    "AKL": [{"city": "Brisbane", "country": "AU", "code": "BNE"}],
    "SIN": [{"city": "Singapore", "country": "SG", "code": "SIN"}],
    "HKG": [{"city": "Singapore", "country": "SG", "code": "SIN"}],
    "NRT": [{"city": "Hong Kong", "country": "HK", "code": "HKG"}],
    "LAX": [{"city": "Sydney", "country": "AU", "code": "SYD"}, {"city": "Los Angeles", "country": "US", "code": "LAX"}],
    "LHR": [{"city": "Singapore", "country": "SG", "code": "SIN"}, {"city": "Dubai", "country": "AE", "code": "DXB"}],
    "DXB": [{"city": "Singapore", "country": "SG", "code": "SIN"}],
    # Ocean / road sub-routes
    "BNE": [{"city": "Cairns", "country": "AU", "code": "CNS"}],
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

# Phase 8.2 — Modes + mode-specific picks
MODES = ("AIR", "OCEAN", "ROAD")
INCOTERMS_ALL = ("EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP")

# Mode → transit-day floor → CO2 factor (kg per kg freight, very rough mock)
MODE_PROFILE = {
    "AIR":   {"min_days": 1, "max_days": 4,  "co2_per_kg": 1.10, "label": "Air Freight"},
    "OCEAN": {"min_days": 18, "max_days": 32, "co2_per_kg": 0.018, "label": "Ocean Freight"},
    "ROAD":  {"min_days": 2, "max_days": 6,  "co2_per_kg": 0.090, "label": "Road Freight"},
}

ULD_TYPES = ("LD3", "LD7", "PMC", "LOOSE")
CONTAINER_TYPES = ("20GP", "40GP", "40HC", "20RF", "LCL")
TRUCK_TYPES = ("BOX_TRUCK", "FLATBED", "REEFER", "CONTAINER_CHASSIS")

# Service-code → mode map (for legacy seed)
LEGACY_SERVICE_MODE = {
    "EXPRESS_12_00": "AIR",
    "EXPRESS_WORLDWIDE": "AIR",
    "ECONOMY_SELECT": "OCEAN",
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

COMMODITIES_BY_MODE = {
    "AIR": [
        ("Electronics — laptops", "847130"),
        ("Pharmaceuticals — vaccine kit", "300290"),
        ("Spare parts — aviation", "880330"),
        ("Sample kits — engineering", "902300"),
        ("Coffee — green beans (sample)", "090111"),
    ],
    "OCEAN": [
        ("Coffee — green beans (bulk)", "090111"),
        ("Mineral concentrate — copper", "260300"),
        ("Industrial machinery", "847990"),
        ("Apparel — knitted garments", "611030"),
        ("Frozen seafood — prawns (reefer)", "030617"),
    ],
    "ROAD": [
        ("Drilling consumables", "820719"),
        ("Building materials — pre-fab", "940690"),
        ("Mining spares — domestic", "843143"),
        ("Cold-chain produce — domestic", "070200"),
    ],
}


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


# Phase 8.2 — Mode-specific dictionaries kept as `dict` to stay schema-flexible
# for the demo without forcing strict shape on existing seeded records.
class Shipment(BaseModel):
    """Full shipment with PII — only returned to authenticated owners."""
    awb: str
    userId: Optional[str] = None
    sender: AddressModel
    receiver: AddressModel
    package: PackageModel
    service: str
    status: str
    origin: LocationCode
    destination: LocationCode
    events: List[ShipmentEvent]
    estimatedDelivery: datetime
    actualDelivery: Optional[datetime] = None
    costPGK: float
    createdAt: datetime
    updatedAt: datetime

    # ---- Phase 8.2 (all optional, backwards-compatible) ----
    mode: Optional[Literal["AIR", "OCEAN", "ROAD"]] = "AIR"
    bookingReference: Optional[str] = None
    incoterms: Optional[str] = None
    commodity: Optional[str] = None
    hsCode: Optional[str] = None
    cargoDescription: Optional[str] = None
    originPort: Optional[str] = None
    destinationPort: Optional[str] = None
    etd: Optional[datetime] = None
    eta: Optional[datetime] = None
    airSpecifics: Optional[dict] = None
    oceanSpecifics: Optional[dict] = None
    roadSpecifics: Optional[dict] = None
    co2EstimateKg: Optional[float] = None


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
    actualDelivery: Optional[datetime] = None

    # Phase 8.2 — public-safe fields (no commercial $$)
    mode: Optional[Literal["AIR", "OCEAN", "ROAD"]] = "AIR"
    bookingReference: Optional[str] = None
    originPort: Optional[str] = None
    destinationPort: Optional[str] = None
    etd: Optional[datetime] = None
    eta: Optional[datetime] = None
    airSpecifics: Optional[dict] = None
    oceanSpecifics: Optional[dict] = None
    roadSpecifics: Optional[dict] = None


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

    # Phase 8.2
    mode: Optional[Literal["AIR", "OCEAN", "ROAD"]] = "AIR"
    bookingReference: Optional[str] = None
    etd: Optional[datetime] = None
    eta: Optional[datetime] = None
    originPort: Optional[str] = None
    destinationPort: Optional[str] = None


class ShipmentListResponse(BaseModel):
    items: List[ShipmentSummary]
    total: int
    page: int
    pageSize: int


class ShipmentCreate(BaseModel):
    """Legacy parcel-style payload (Phase 8.0). Kept working for backward compat."""
    sender: AddressModel
    receiver: AddressModel
    package: PackageModel
    service: str
    paymentMethod: str = "account"
    costPGK: float = Field(default=0, ge=0)


# Phase 8.2 — new freight booking payload
class BookingCreate(BaseModel):
    """Multi-mode freight booking payload."""
    mode: Literal["AIR", "OCEAN", "ROAD"]
    sender: AddressModel
    receiver: AddressModel
    package: PackageModel
    service: Optional[str] = None  # legacy enum (auto-mapped if absent)
    originPort: Optional[str] = None
    destinationPort: Optional[str] = None
    incoterms: Optional[str] = None
    commodity: Optional[str] = None
    hsCode: Optional[str] = None
    cargoDescription: Optional[str] = None
    airSpecifics: Optional[dict] = None
    oceanSpecifics: Optional[dict] = None
    roadSpecifics: Optional[dict] = None
    paymentMethod: str = "account"
    costPGK: float = Field(default=0, ge=0)


class MultiModeQuoteRequest(BaseModel):
    originCountry: str
    originCity: str
    destinationCountry: str
    destinationCity: str
    weightKg: float = Field(..., gt=0)
    cbm: Optional[float] = Field(default=None, ge=0)
    commodity: Optional[str] = None


class ModeQuote(BaseModel):
    mode: Literal["AIR", "OCEAN", "ROAD"]
    label: str
    pricePGK: float
    transitDaysMin: int
    transitDaysMax: int
    co2EstimateKg: float
    recommended: bool = False


class MultiModeQuoteResponse(BaseModel):
    quotes: List[ModeQuote]
    weightKg: float
    cbm: Optional[float] = None
    fastest: str
    cheapest: str
    greenest: str


# ============ HELPERS ============
def _normalize_shipment(doc: dict) -> dict:
    """Strip Mongo _id, convert ISO strings back to datetimes."""
    if doc is None:
        return None
    doc = {k: v for k, v in doc.items() if k != "_id"}
    for key in ("createdAt", "updatedAt", "estimatedDelivery", "actualDelivery", "etd", "eta"):
        if isinstance(doc.get(key), str):
            doc[key] = datetime.fromisoformat(doc[key])
    for ev in doc.get("events", []):
        if isinstance(ev.get("timestamp"), str):
            ev["timestamp"] = datetime.fromisoformat(ev["timestamp"])
    # Phase 8.2 — guarantee `mode` exists on every record returned upstream.
    doc.setdefault("mode", "AIR")
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
        mode=doc.get("mode", "AIR"),
        bookingReference=doc.get("bookingReference"),
        etd=doc.get("etd"),
        eta=doc.get("eta"),
        originPort=doc.get("originPort"),
        destinationPort=doc.get("destinationPort"),
    )


# ---- Phase 8.2 reference auto-detect -----------------------------------------
# Patterns we recognise on /api/track/{ref}.
#
# Note: order matters. The most specific pattern is checked first; "legacy_awb"
# is the catch-all so 10-11 digit numerics still resolve.
REF_PATTERNS = [
    ("booking_reference", re.compile(r"^MYDH-\d{4}-\d{6}$", re.I), "bookingReference"),
    ("hawb",              re.compile(r"^\d{3}-\d{8}$"),            "airSpecifics.hawbNumber"),
    ("mawb",              re.compile(r"^\d{3}-\d{8}$"),            "airSpecifics.mawbNumber"),  # same shape, alt field
    ("hbl",               re.compile(r"^(HBL)[A-Z0-9]{6,12}$", re.I),"oceanSpecifics.hblNumber"),
    ("mbl",               re.compile(r"^(MBL)[A-Z0-9]{6,12}$", re.I),"oceanSpecifics.mblNumber"),
    ("container",         re.compile(r"^[A-Z]{4}\d{7}$"),          "oceanSpecifics.containerNumber"),
    ("dhl_awb",           re.compile(r"^DHL\d{10}$", re.I),        "awb"),
    ("numeric_awb",       re.compile(r"^\d{10,11}$"),              "awb"),
]


def _classify_ref(ref: str) -> List[tuple]:
    """Return ordered list of (label, field_path) candidates that match ref."""
    out: List[tuple] = []
    s = ref.strip()
    for label, pat, field in REF_PATTERNS:
        if pat.match(s):
            out.append((label, field))
    return out


async def _find_shipment_by_ref(db, ref: str) -> Optional[dict]:
    """Look up a shipment from any reference shape (AWB / HAWB / MAWB / HBL /
    MBL / container number / booking reference). Returns the raw dict or None.
    """
    norm = ref.strip().upper()
    candidates = _classify_ref(norm)

    # Phase 1 — try classified candidates in priority order.
    for label, field in candidates:
        query = {field: norm}
        doc = await db.shipments.find_one(query)
        if doc:
            return doc

    # Phase 2 — fall back to legacy AWB upper-cased.
    doc = await db.shipments.find_one({"awb": norm})
    if doc:
        return doc

    # Phase 3 — case-insensitive `$or` across all known fields. This catches
    # anything the regex pass missed (e.g. HBL with no prefix in the seed).
    doc = await db.shipments.find_one({
        "$or": [
            {"awb": norm},
            {"bookingReference": norm},
            {"airSpecifics.hawbNumber": norm},
            {"airSpecifics.mawbNumber": norm},
            {"oceanSpecifics.hblNumber": norm},
            {"oceanSpecifics.mblNumber": norm},
            {"oceanSpecifics.containerNumber": norm},
            {"roadSpecifics.consignmentNumber": norm},
        ]
    })
    return doc


# ---- Phase 8.2 multi-mode quote -----------------------------------------------
def _calc_multi_quote(req: MultiModeQuoteRequest) -> MultiModeQuoteResponse:
    """Deterministic multi-mode rate card mock. Pricing is a transparent
    function of weight × distance-factor × mode-base so the demo behaves
    consistently across reloads.
    """
    from business_module import COUNTRY_DISTANCE
    distance = COUNTRY_DISTANCE.get(req.destinationCountry.upper(), 1.5)

    # Weight basis: chargeable = max(weight, cbm * 167) for air-style dimensional.
    chargeable_air = max(req.weightKg, (req.cbm or 0) * 167)
    chargeable_road = max(req.weightKg, (req.cbm or 0) * 250)
    chargeable_ocean = max(req.weightKg, (req.cbm or 0) * 1000)  # CBM rules ocean

    # Per-kg base by mode (PGK)
    bases = {
        "AIR":   18.0,
        "OCEAN": 0.85,
        "ROAD":  6.50,
    }
    handlings = {"AIR": 95, "OCEAN": 260, "ROAD": 140}

    quotes: List[ModeQuote] = []
    co2_lookup: dict = {}
    transit_lookup: dict = {}
    price_lookup: dict = {}
    for mode in MODES:
        profile = MODE_PROFILE[mode]
        if mode == "AIR":
            chargeable = chargeable_air
        elif mode == "OCEAN":
            chargeable = chargeable_ocean
        else:
            chargeable = chargeable_road
        price = round(bases[mode] * chargeable * distance + handlings[mode], 2)
        # Ensure minimum visible prices
        price = max(price, 80.0 if mode == "OCEAN" else 250.0 if mode == "AIR" else 180.0)
        co2 = round(req.weightKg * profile["co2_per_kg"], 2)
        quotes.append(ModeQuote(
            mode=mode,
            label=profile["label"],
            pricePGK=price,
            transitDaysMin=profile["min_days"],
            transitDaysMax=profile["max_days"],
            co2EstimateKg=co2,
        ))
        co2_lookup[mode] = co2
        transit_lookup[mode] = profile["min_days"]
        price_lookup[mode] = price

    fastest = min(transit_lookup, key=transit_lookup.get)
    cheapest = min(price_lookup, key=price_lookup.get)
    greenest = min(co2_lookup, key=co2_lookup.get)
    # Recommended flag is the cheapest mode that isn't slowest by >25 days
    for q in quotes:
        if q.mode == cheapest:
            q.recommended = True
            break

    return MultiModeQuoteResponse(
        quotes=quotes,
        weightKg=req.weightKg,
        cbm=req.cbm,
        fastest=fastest,
        cheapest=cheapest,
        greenest=greenest,
    )


# ============ ROUTER ============
def build_router(db, get_current_user_dep):
    """Build the shipments + bookings APIRouter."""
    router = APIRouter(prefix="/api")

    # ---- multi-format public tracking ----
    @router.get("/track/{ref}", response_model=ShipmentPublic)
    async def public_track(ref: str):
        """
        Public, PII-scrubbed tracking by any freight reference.

        Recognised reference shapes (Phase 8.2):
          • Legacy AWB        — `DHL1234567890` or plain 10-11 digit numeric
          • Booking ref       — `MYDH-2026-000123`
          • HAWB / MAWB       — `020-12345678`
          • HBL / MBL         — `HBL...` / `MBL...` (alphanumeric)
          • Container number  — `MSCU1234567` (ISO 6346)

        DHL Mapping: Tracking Service (DHL XML Services Guide §3 + §1 service
        list). Single endpoint, backend auto-detects the reference type — the
        UI does not need to know.
        """
        doc = await _find_shipment_by_ref(db, ref)
        if not doc:
            raise HTTPException(status_code=404, detail="No shipment found for this reference")
        normalized = _normalize_shipment(doc)
        scrubbed = _scrub_for_public(normalized)
        return ShipmentPublic(**scrubbed)

    @router.get("/shipments", response_model=ShipmentListResponse)
    async def list_shipments(
        current_user: dict = Depends(get_current_user_dep),
        status: Optional[str] = Query(None),
        mode: Optional[str] = Query(None),
        search: Optional[str] = Query(None),
        dateFrom: Optional[str] = Query(None),
        dateTo: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        pageSize: int = Query(20, ge=1, le=100),
    ):
        """Auth-scoped shipment / booking list."""
        query: dict = {"userId": current_user["id"]}
        if status:
            query["status"] = status.upper()
        if mode:
            query["mode"] = mode.upper()
        if search:
            s = search.strip()
            query["$or"] = [
                {"awb": {"$regex": s, "$options": "i"}},
                {"bookingReference": {"$regex": s, "$options": "i"}},
                {"airSpecifics.hawbNumber": {"$regex": s, "$options": "i"}},
                {"airSpecifics.mawbNumber": {"$regex": s, "$options": "i"}},
                {"oceanSpecifics.hblNumber": {"$regex": s, "$options": "i"}},
                {"oceanSpecifics.mblNumber": {"$regex": s, "$options": "i"}},
                {"oceanSpecifics.containerNumber": {"$regex": s, "$options": "i"}},
                {"receiver.name": {"$regex": s, "$options": "i"}},
                {"destination.city": {"$regex": s, "$options": "i"}},
            ]
        if dateFrom or dateTo:
            date_q: dict = {}
            if dateFrom:
                date_q["$gte"] = dateFrom
            if dateTo:
                date_q["$lte"] = dateTo
            query["createdAt"] = date_q

        total = await db.shipments.count_documents(query)
        skip = (page - 1) * pageSize
        cursor = db.shipments.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(pageSize)
        rows = await cursor.to_list(length=pageSize)
        items = [_to_summary(_normalize_shipment(r)) for r in rows]
        return ShipmentListResponse(items=items, total=total, page=page, pageSize=pageSize)

    # ---- Phase 8.2 alias: /api/bookings ----
    @router.get("/bookings", response_model=ShipmentListResponse)
    async def list_bookings(
        current_user: dict = Depends(get_current_user_dep),
        status: Optional[str] = Query(None),
        mode: Optional[str] = Query(None),
        search: Optional[str] = Query(None),
        dateFrom: Optional[str] = Query(None),
        dateTo: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        pageSize: int = Query(20, ge=1, le=100),
    ):
        """Alias for /api/shipments. Same DB collection — different UX label."""
        return await list_shipments(  # type: ignore[misc]
            current_user=current_user, status=status, mode=mode, search=search,
            dateFrom=dateFrom, dateTo=dateTo, page=page, pageSize=pageSize,
        )

    @router.get("/shipments/{awb}", response_model=Shipment)
    async def shipment_detail(
        awb: str,
        current_user: dict = Depends(get_current_user_dep),
    ):
        """Auth-scoped, PII-complete shipment detail for the owner."""
        doc = await db.shipments.find_one(
            {"awb": awb.upper(), "userId": current_user["id"]},
            {"_id": 0},
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Shipment not found")
        normalized = _normalize_shipment(doc)
        return Shipment(**normalized)

    # ---- legacy POST /shipments (Phase 8.0 parcel form) ----
    @router.post("/shipments", response_model=Shipment, status_code=201)
    async def create_shipment(
        payload: ShipmentCreate,
        current_user: dict = Depends(get_current_user_dep),
    ):
        """Legacy parcel-style create. New 5-step wizard uses POST /api/bookings.

        DHL Mapping: Shipment Validation Service (DHL XML Services Guide §5).
        """
        if payload.service not in ("EXPRESS_WORLDWIDE", "EXPRESS_12_00", "ECONOMY_SELECT"):
            raise HTTPException(status_code=400, detail="Invalid service code")

        from business_module import CITIES
        def _resolve_loc(country: str, city: str):
            for c in CITIES.get(country.upper(), []):
                if c["city"].lower() == city.lower():
                    return {"city": c["city"], "country": country.upper(), "code": c["code"]}
            return {"city": city, "country": country.upper(), "code": city[:3].upper()}

        origin = _resolve_loc(payload.sender.country, payload.sender.city)
        destination = _resolve_loc(payload.receiver.country, payload.receiver.city)

        for _ in range(8):
            awb = "DHL" + "".join(str(random.randint(0, 9)) for _ in range(10))
            existing = await db.shipments.find_one({"awb": awb})
            if not existing:
                break

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
            # Phase 8.2 default for legacy create
            "mode": LEGACY_SERVICE_MODE.get(payload.service, "AIR"),
            "bookingReference": _gen_booking_reference(now),
        }
        await db.shipments.insert_one(doc)
        return Shipment(**_normalize_shipment(doc))

    # ---- Phase 8.2 POST /api/bookings — multi-mode freight ----
    @router.post("/bookings", response_model=Shipment, status_code=201)
    async def create_booking(
        payload: BookingCreate,
        current_user: dict = Depends(get_current_user_dep),
    ):
        """Multi-mode freight booking — Air / Ocean / Road.

        Mode-specific validation:
          • AIR  → `airSpecifics` (or empty) accepted; `oceanSpecifics` and
            `roadSpecifics` MUST be null / absent.
          • OCEAN → `oceanSpecifics` only.
          • ROAD → `roadSpecifics` only.

        Generates a booking reference (MYDH-YYYY-NNNNNN) plus a legacy AWB
        for back-compat. Returns the persisted shipment.
        """
        # Cross-mode specifics guard
        m = payload.mode
        if m != "AIR" and payload.airSpecifics:
            raise HTTPException(status_code=422, detail="airSpecifics only allowed for AIR bookings")
        if m != "OCEAN" and payload.oceanSpecifics:
            raise HTTPException(status_code=422, detail="oceanSpecifics only allowed for OCEAN bookings")
        if m != "ROAD" and payload.roadSpecifics:
            raise HTTPException(status_code=422, detail="roadSpecifics only allowed for ROAD bookings")
        if payload.incoterms and payload.incoterms.upper() not in INCOTERMS_ALL:
            raise HTTPException(status_code=422, detail=f"Unknown incoterm — must be one of {INCOTERMS_ALL}")

        from business_module import CITIES
        def _resolve_loc(country: str, city: str):
            for c in CITIES.get(country.upper(), []):
                if c["city"].lower() == city.lower():
                    return {"city": c["city"], "country": country.upper(), "code": c["code"]}
            return {"city": city, "country": country.upper(), "code": city[:3].upper()}

        origin = _resolve_loc(payload.sender.country, payload.sender.city)
        destination = _resolve_loc(payload.receiver.country, payload.receiver.city)

        # Generate AWB + booking ref
        for _ in range(8):
            awb = "DHL" + "".join(str(random.randint(0, 9)) for _ in range(10))
            existing = await db.shipments.find_one({"awb": awb})
            if not existing:
                break
        now = datetime.now(timezone.utc)
        booking_ref = await _gen_unique_booking_ref(db)

        # ETD / ETA from mode profile
        profile = MODE_PROFILE[m]
        etd = now + timedelta(hours=24)
        eta = etd + timedelta(days=random.randint(profile["min_days"], profile["max_days"]))

        events = [{
            "timestamp": now.isoformat(),
            "status": "OC",
            "location": f"{origin['city']}, {origin['country']}",
            "description": "Booking confirmed — awaiting pickup",
            "code": "OC",
        }]

        # Cost estimate from multi-mode quoter (rough)
        if payload.costPGK:
            cost = float(payload.costPGK)
        else:
            try:
                quote_req = MultiModeQuoteRequest(
                    originCountry=payload.sender.country,
                    originCity=payload.sender.city,
                    destinationCountry=payload.receiver.country,
                    destinationCity=payload.receiver.city,
                    weightKg=payload.package.weightKg,
                )
                mq = _calc_multi_quote(quote_req)
                cost = next(q.pricePGK for q in mq.quotes if q.mode == m)
            except Exception:
                cost = 250.0

        co2 = round(payload.package.weightKg * profile["co2_per_kg"], 2)

        # Mode-specific specifics fallback (auto-fill HAWB / HBL / consignment)
        air_specs = payload.airSpecifics
        ocean_specs = payload.oceanSpecifics
        road_specs = payload.roadSpecifics
        if m == "AIR" and not air_specs:
            air_specs = {
                "uldType": "LOOSE",
                "chargeableWeightKg": payload.package.weightKg,
                "awbType": "HAWB",
                "hawbNumber": f"020-{random.randint(10000000, 99999999)}",
            }
        elif m == "OCEAN" and not ocean_specs:
            ocean_specs = {
                "containerType": "LCL",
                "cbm": round(payload.package.weightKg / 250, 2) if payload.package.weightKg else 1.0,
                "grossWeightKg": payload.package.weightKg,
                "bolType": "SEA_WAYBILL",
                "hblNumber": f"HBL{random.randint(100000, 999999)}",
            }
        elif m == "ROAD" and not road_specs:
            road_specs = {
                "truckType": "BOX_TRUCK",
                "pallets": max(1, round(payload.package.weightKg / 500)),
                "crossBorder": False,
                "consignmentNumber": f"PNGRD{random.randint(100000, 999999)}",
            }

        # Map legacy service if absent
        svc = payload.service or {
            "AIR": "EXPRESS_WORLDWIDE", "OCEAN": "ECONOMY_SELECT", "ROAD": "ECONOMY_SELECT",
        }[m]

        doc = {
            "awb": awb,
            "userId": current_user["id"],
            "sender": payload.sender.model_dump(),
            "receiver": payload.receiver.model_dump(),
            "package": payload.package.model_dump(),
            "service": svc,
            "status": "PENDING",
            "origin": origin,
            "destination": destination,
            "events": events,
            "estimatedDelivery": eta.isoformat(),
            "actualDelivery": None,
            "costPGK": float(cost),
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
            "mode": m,
            "bookingReference": booking_ref,
            "incoterms": (payload.incoterms or "").upper() or None,
            "commodity": payload.commodity,
            "hsCode": payload.hsCode,
            "cargoDescription": payload.cargoDescription,
            "originPort": payload.originPort,
            "destinationPort": payload.destinationPort,
            "etd": etd.isoformat(),
            "eta": eta.isoformat(),
            "airSpecifics": air_specs,
            "oceanSpecifics": ocean_specs,
            "roadSpecifics": road_specs,
            "co2EstimateKg": co2,
        }
        await db.shipments.insert_one(doc)
        return Shipment(**_normalize_shipment(doc))

    # ---- Phase 8.2 multi-mode quote ----
    @router.post("/quotes/multi-mode", response_model=MultiModeQuoteResponse)
    async def quotes_multi_mode(
        payload: MultiModeQuoteRequest,
        _user: dict = Depends(get_current_user_dep),
    ):
        """Return 3 mode prices + transit days + CO2 estimate side-by-side."""
        return _calc_multi_quote(payload)

    # Also expose GET for easy testing (query-param flavor)
    @router.get("/quotes/multi-mode", response_model=MultiModeQuoteResponse)
    async def quotes_multi_mode_get(
        originCountry: str = Query(...),
        originCity: str = Query(...),
        destinationCountry: str = Query(...),
        destinationCity: str = Query(...),
        weightKg: float = Query(..., gt=0),
        cbm: Optional[float] = Query(None),
        commodity: Optional[str] = Query(None),
        _user: dict = Depends(get_current_user_dep),
    ):
        return _calc_multi_quote(MultiModeQuoteRequest(
            originCountry=originCountry, originCity=originCity,
            destinationCountry=destinationCountry, destinationCity=destinationCity,
            weightKg=weightKg, cbm=cbm, commodity=commodity,
        ))

    # ---- Phase 8.2 ports list (PUBLIC) ----
    @router.get("/locations/ports")
    async def list_ports(
        mode: Optional[str] = Query(None, description="AIR / OCEAN / ROAD filter"),
        q: Optional[str] = Query(None, description="case-insensitive substring"),
    ):
        """IATA airports + UNLOCODE seaports. Static dataset for the demo —
        in production this would be backed by a Locations service.
        """
        from business_module import PORTS
        rows = PORTS
        if mode:
            mu = mode.upper()
            rows = [r for r in rows if r.get("mode") == mu or r.get("mode") == "MULTI"]
        if q:
            ql = q.lower()
            rows = [r for r in rows
                    if ql in r["code"].lower()
                    or ql in r["name"].lower()
                    or ql in r["country"].lower()
                    or ql in r["city"].lower()]
        return rows[:50]

    @router.get("/shipments/{awb}/label.pdf")
    async def shipment_label(
        awb: str,
        request: Request,
        current_user: dict = Depends(get_current_user_dep),
    ):
        """Render the shipping label PDF (with AWB barcode + tracking QR)."""
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

    # ============ SHIPMENT DOCUMENTS (Phase 8.1) ============
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
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_air_waybill
        return _stream_pdf(generate_air_waybill(shipment, user, customs_doc), awb.upper(), "airwaybill")

    @router.get("/shipments/{awb}/documents/proforma.pdf")
    async def doc_proforma(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_proforma_invoice
        return _stream_pdf(generate_proforma_invoice(shipment, user, customs_doc), awb.upper(), "proforma")

    @router.get("/shipments/{awb}/documents/commercial.pdf")
    async def doc_commercial(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_commercial_invoice
        return _stream_pdf(generate_commercial_invoice(shipment, user, customs_doc), awb.upper(), "commercial")

    @router.get("/shipments/{awb}/documents/tax.pdf")
    async def doc_tax(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_tax_invoice
        return _stream_pdf(generate_tax_invoice(shipment, user), awb.upper(), "tax")

    @router.get("/shipments/{awb}/documents/inbound.pdf")
    async def doc_inbound(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_inbound_invoice
        return _stream_pdf(generate_inbound_invoice(shipment, user), awb.upper(), "inbound")

    @router.get("/shipments/{awb}/documents/declaration.pdf")
    async def doc_declaration(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_shipment_declaration
        return _stream_pdf(generate_shipment_declaration(shipment, user, customs_doc), awb.upper(), "declaration")

    @router.get("/shipments/{awb}/documents/pod.pdf")
    async def doc_pod(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_pod
        return _stream_pdf(generate_pod(shipment, user), awb.upper(), "pod")

    @router.get("/shipments/{awb}/documents/certificate-of-origin.pdf")
    async def doc_cof(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_certificate_of_origin
        return _stream_pdf(generate_certificate_of_origin(shipment, user, customs_doc), awb.upper(), "certificate-of-origin")

    @router.get("/shipments/{awb}/documents/loa.pdf")
    async def doc_loa(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_letter_of_authorization
        return _stream_pdf(generate_letter_of_authorization(shipment, user), awb.upper(), "loa")

    @router.get("/shipments/{awb}/documents/packing-list.pdf")
    async def doc_packing_list(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        customs_doc = await _latest_customs(awb, current_user["id"])
        from document_generator import generate_packing_list
        return _stream_pdf(generate_packing_list(shipment, user, customs_doc), awb.upper(), "packing-list")

    @router.get("/shipments/{awb}/documents/receipt.pdf")
    async def doc_receipt(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        from document_generator import generate_shipment_receipt
        return _stream_pdf(generate_shipment_receipt(shipment, user), awb.upper(), "receipt")

    @router.get("/shipments/{awb}/documents/payment-confirmation.pdf")
    async def doc_payment_confirmation(awb: str, current_user: dict = Depends(get_current_user_dep)):
        shipment = await _load_shipment_for_user(awb, current_user["id"])
        user = await _load_user(current_user["id"])
        payment = await db.payments.find_one(
            {"awb": awb.upper(), "userId": current_user["id"]},
            {"_id": 0},
            sort=[("paidAt", -1)],
        )
        from document_generator import generate_payment_confirmation
        return _stream_pdf(generate_payment_confirmation(shipment, user, payment), awb.upper(), "payment-confirmation")

    return router


# ============ HELPERS — booking reference generator ============
def _gen_booking_reference(now: datetime) -> str:
    return f"MYDH-{now.year}-{random.randint(100000, 999999):06d}"


async def _gen_unique_booking_ref(db) -> str:
    for _ in range(10):
        ref = _gen_booking_reference(datetime.now(timezone.utc))
        existing = await db.shipments.find_one({"bookingReference": ref})
        if not existing:
            return ref
    return _gen_booking_reference(datetime.now(timezone.utc))


# ============ SEED ============
def _gen_events_for_status(status: str, origin: dict, dest: dict, created_at: datetime,
                            eta: datetime, recipient_initial: str) -> List[dict]:
    """Generate a realistic event chain for a given status."""
    hubs = HUBS_BY_DEST.get(dest["code"], [{"city": dest["city"], "country": dest["country"], "code": dest["code"]}])
    total_duration = (eta - created_at).total_seconds()
    events: List[dict] = []

    def _add(code: str, location_city: str, location_country: str, fraction: float):
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

    _add("OC", origin["city"], origin["country"], 0.02)

    if status == "PENDING":
        return events

    _add("PU", origin["city"], origin["country"], 0.12)

    if status == "PICKED_UP":
        if random.random() < 0.5:
            _add("AF", origin["city"], origin["country"], 0.22)
        return events

    _add("AF", origin["city"], origin["country"], 0.22)

    if status == "ON_HOLD":
        first_hub = hubs[0]
        _add("AR", first_hub["city"], first_hub["country"], 0.42)
        _add("HP", first_hub["city"], first_hub["country"], 0.5)
        return events

    if status == "EXCEPTION":
        first_hub = hubs[0]
        _add("AR", first_hub["city"], first_hub["country"], 0.4)
        _add("MS", first_hub["city"], first_hub["country"], 0.5)
        return events

    fraction = 0.35
    for hub in hubs:
        _add("AR", hub["city"], hub["country"], fraction)
        fraction += 0.1
        _add("AF", hub["city"], hub["country"], fraction)
        fraction += 0.1

    _add("AR", dest["city"], dest["country"], 0.78)

    if status == "IN_TRANSIT":
        return events

    _add("WC", dest["city"], dest["country"], 0.92)

    if status == "OUT_FOR_DELIVERY":
        return events

    _add("OK", dest["city"], dest["country"], 1.0)
    return events


# Mode → (port code at origin, port code at dest) lookup for seed enrichment
def _ports_for(mode: str, origin_code: str, dest_code: str) -> tuple:
    """Return (originPort, destinationPort) strings appropriate for the mode."""
    if mode == "AIR":
        return origin_code, dest_code
    if mode == "OCEAN":
        # UNLOCODE = country letters + city letters (5 char). Build heuristic.
        return f"PG{origin_code}", f"{_country_for(dest_code)}{dest_code}"
    # ROAD — Australian destinations get a city code; PNG-only keep origin/dest
    return origin_code, dest_code


def _country_for(dest_code: str) -> str:
    return {
        "SYD": "AU", "BNE": "AU", "MEL": "AU", "AKL": "NZ", "SIN": "SG",
        "HKG": "HK", "NRT": "JP", "LAX": "US", "LHR": "UK", "DXB": "AE",
    }.get(dest_code, "XX")


def _build_specifics(mode: str, weight_kg: float, idx: int) -> dict:
    """Build mode-specific nested dict for the seed."""
    if mode == "AIR":
        return {
            "uldType": ULD_TYPES[idx % len(ULD_TYPES)],
            "chargeableWeightKg": round(max(weight_kg, weight_kg * 1.2), 2),
            "awbType": "HAWB" if idx % 3 != 0 else "MAWB",
            "hawbNumber": f"020-{10000000 + idx * 73}",
            "mawbNumber": f"081-{12345600 + idx}",
        }
    if mode == "OCEAN":
        ct = CONTAINER_TYPES[idx % len(CONTAINER_TYPES)]
        cbm = round(weight_kg / 250, 2) if ct == "LCL" else round(33.2 if "40" in ct else 16.5, 1)
        return {
            "containerType": ct,
            "cbm": cbm,
            "grossWeightKg": round(weight_kg, 2),
            "bolType": "HBL" if ct != "LCL" else "SEA_WAYBILL",
            "hblNumber": f"HBL{200000 + idx * 11}",
            "mblNumber": f"MBL{300000 + idx * 7}",
            "containerNumber": f"MSCU{1230000 + idx * 13:07d}",
            "sealNumber": f"SEAL{900000 + idx * 17}",
        }
    # ROAD
    return {
        "truckType": TRUCK_TYPES[idx % len(TRUCK_TYPES)],
        "pallets": max(1, idx % 6 + 1),
        "crossBorder": (idx % 4 == 0),
        "consignmentNumber": f"PNGRD{400000 + idx * 19}",
    }


async def seed_shipments(db, demo_user_id: str):
    """Seed 25 demo-user shipments with Phase 8.2 mode-aware fields."""
    existing = await db.shipments.count_documents({"userId": demo_user_id})
    with_mode = await db.shipments.count_documents({"userId": demo_user_id, "mode": {"$exists": True}})

    # Re-seed if the on-disk shape is from Phase 8.0 (no `mode` field).
    if existing > 0 and with_mode == 0:
        logger.info(f"[SEED] Detected Phase 8.0 shipments ({existing}, no mode). Re-seeding for Phase 8.2.")
        await db.shipments.delete_many({"userId": demo_user_id})
        existing = 0

    if existing >= 25:
        logger.info(f"[SEED] Shipments already seeded ({existing} for demo user). Skipping.")
        return

    if existing > 0:
        await db.shipments.delete_many({"userId": demo_user_id})

    random.seed(42)

    status_plan = (
        ["DELIVERED"] * 5
        + ["IN_TRANSIT"] * 8
        + ["OUT_FOR_DELIVERY"] * 4
        + ["PICKED_UP"] * 3
        + ["PENDING"] * 2
        + ["ON_HOLD"] * 2
        + ["EXCEPTION"] * 1
    )

    # Phase 8.2 — mode distribution (25 total): 10 AIR, 10 OCEAN, 5 ROAD
    mode_plan = ["AIR"] * 10 + ["OCEAN"] * 10 + ["ROAD"] * 5

    fixed_awbs = {5: "DHL1234567890"}
    fixed_booking_refs = {5: "MYDH-2026-100005"}
    now = datetime.now(timezone.utc)
    docs = []

    for i, st in enumerate(status_plan):
        origin = ORIGINS_PNG[i % len(ORIGINS_PNG)]
        dest = DESTINATIONS_INTL[i % len(DESTINATIONS_INTL)]
        if i == 5:
            origin = ORIGINS_PNG[0]
            dest = DESTINATIONS_INTL[0]

        # Phase 8.2 mode + commodity
        mode = mode_plan[i % len(mode_plan)]
        # ROAD shipments always domestic — overwrite destination to PNG city
        if mode == "ROAD":
            dest = ORIGINS_PNG[(i + 2) % len(ORIGINS_PNG)]
            if dest["code"] == origin["code"]:
                dest = ORIGINS_PNG[(i + 3) % len(ORIGINS_PNG)]

        commodity_pool = COMMODITIES_BY_MODE[mode]
        commodity, hs_code = commodity_pool[i % len(commodity_pool)]

        service = random.choice(SERVICE_TYPES)
        eta_min, eta_max = SERVICE_DAYS_ETA[service]

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
        else:
            days_ago = random.randint(1, 6)

        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        # ETD = createdAt + 24h; ETA = ETD + mode profile days
        profile = MODE_PROFILE[mode]
        etd = created_at + timedelta(hours=24)
        eta_days_real = random.randint(profile["min_days"], profile["max_days"])
        eta = etd + timedelta(days=eta_days_real, hours=random.randint(0, 12))

        actual_delivery = (eta + timedelta(hours=random.randint(-12, 12))) if st == "DELIVERED" else None

        sender_company, sender_name = SENDER_COMPANIES[i % len(SENDER_COMPANIES)]
        recv_options = RECEIVER_COMPANIES_BY_DEST.get(dest["code"], [("International Imports", "Alex Roy")])
        recv_company, recv_name = recv_options[i % len(recv_options)]

        # Domestic ROAD overrides receiver names (PNG company)
        if mode == "ROAD":
            recv_company = ("Highlands Logistics PNG", "Western District Trading")[i % 2]
            recv_name = ("Brian Tau", "Mary Asi", "Sam Bawi", "Carla Reti")[i % 4]

        awb = fixed_awbs.get(i) or f"DHL{random.randint(1000000000, 9999999999)}"
        booking_ref = fixed_booking_refs.get(i) or f"MYDH-{now.year}-{100000 + i * 37:06d}"

        sender_addr = {
            "name": sender_name, "company": sender_company,
            "address": f"{random.randint(1, 199)} Coronation Drive",
            "city": origin["city"], "country": origin["country"],
            "phone": f"+675 {random.randint(7000, 8999)} {random.randint(0, 9999):04d}",
            "email": f"{sender_name.split()[0].lower()}@{sender_company.lower().replace(' ', '').replace(',', '')[:14]}.com.pg",
            "postalCode": str(random.randint(100, 999)),
        }
        receiver_addr = {
            "name": recv_name, "company": recv_company,
            "address": f"{random.randint(10, 999)} {random.choice(['Main', 'King', 'Queen', 'Market', 'Park'])} Street",
            "city": dest["city"], "country": dest["country"],
            "phone": f"+{random.randint(1, 99)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}",
            "email": f"{recv_name.split()[0].lower()}@{recv_company.lower().replace(' ', '').replace(',', '').replace('.', '')[:14]}.com",
            "postalCode": str(random.randint(1000, 99999)),
        }

        pieces = random.randint(1, 6)
        # Heavier loads for OCEAN/ROAD to look freight-realistic
        if mode == "AIR":
            weight_per_piece = round(random.uniform(0.5, 12.0), 2)
        elif mode == "OCEAN":
            weight_per_piece = round(random.uniform(120, 1200), 2)
        else:
            weight_per_piece = round(random.uniform(30, 320), 2)
        total_weight = round(pieces * weight_per_piece, 2)

        package = {
            "pieces": pieces, "weightKg": total_weight,
            "dimensions": {"l": round(random.uniform(15, 220), 1),
                            "w": round(random.uniform(10, 180), 1),
                            "h": round(random.uniform(8, 180), 1)},
            "description": commodity,
            "declaredValueUSD": round(random.uniform(50, 4500), 2),
        }

        # Cost roughly proportional to weight × mode multiplier
        mode_base = {"AIR": 18, "OCEAN": 1.2, "ROAD": 5.5}[mode]
        dest_multiplier = {"SYD": 1.0, "AKL": 1.1, "SIN": 1.3, "HKG": 1.4, "NRT": 1.6,
                            "DXB": 1.8, "LAX": 2.1, "LHR": 2.4}.get(dest["code"], 1.0)
        cost_pgk = round(total_weight * mode_base * dest_multiplier + random.uniform(40, 200), 2)
        cost_pgk = max(120.0, min(8500.0, cost_pgk))

        events = _gen_events_for_status(st, origin, dest, created_at, eta, recv_name.split()[0][0])

        # Phase 8.2 mode-specific blocks
        incoterm = random.choice(["CIF", "FOB", "DAP", "FCA", "EXW", "DDP"])
        origin_port, dest_port = _ports_for(mode, origin["code"], dest["code"])
        co2 = round(total_weight * profile["co2_per_kg"], 2)

        air_specs = _build_specifics("AIR", total_weight, i) if mode == "AIR" else None
        ocean_specs = _build_specifics("OCEAN", total_weight, i) if mode == "OCEAN" else None
        road_specs = _build_specifics("ROAD", total_weight, i) if mode == "ROAD" else None

        doc = {
            "awb": awb,
            "userId": demo_user_id,
            "sender": sender_addr, "receiver": receiver_addr,
            "package": package, "service": service, "status": st,
            "origin": origin, "destination": dest,
            "events": events,
            "estimatedDelivery": eta.isoformat(),
            "actualDelivery": actual_delivery.isoformat() if actual_delivery else None,
            "costPGK": cost_pgk,
            "createdAt": created_at.isoformat(),
            "updatedAt": created_at.isoformat(),
            # Phase 8.2 fields
            "mode": mode,
            "bookingReference": booking_ref,
            "incoterms": incoterm,
            "commodity": commodity,
            "hsCode": hs_code,
            "cargoDescription": commodity + " — " + dest["city"],
            "originPort": origin_port,
            "destinationPort": dest_port,
            "etd": etd.isoformat(),
            "eta": eta.isoformat(),
            "airSpecifics": air_specs,
            "oceanSpecifics": ocean_specs,
            "roadSpecifics": road_specs,
            "co2EstimateKg": co2,
        }
        docs.append(doc)

    await db.shipments.insert_many(docs)
    try:
        await db.shipments.create_index("awb", unique=True)
        await db.shipments.create_index([("userId", 1), ("createdAt", -1)])
        await db.shipments.create_index("bookingReference")
        await db.shipments.create_index("oceanSpecifics.containerNumber")
        await db.shipments.create_index("airSpecifics.hawbNumber")
    except Exception as e:
        logger.debug(f"Shipment index: {e}")

    logger.info(
        f"[SEED] Inserted 25 demo shipments (10 AIR / 10 OCEAN / 5 ROAD) for user {demo_user_id}. "
        f"Guaranteed AWB: DHL1234567890 / Booking: MYDH-2026-100005"
    )


# ============ SHIPPER SEED ============
SHIPPER_AWBS = [
    "DHL5520010001", "DHL5520010002", "DHL5520010003",
    "DHL5520010004", "DHL5520010005", "DHL5520010006",
]
SHIPPER_BOOKINGS = [
    "MYDH-2026-200001", "MYDH-2026-200002", "MYDH-2026-200003",
    "MYDH-2026-200004", "MYDH-2026-200005", "MYDH-2026-200006",
]


async def seed_shipper_shipments(db, shipper_user_id: str):
    """Seed 6 shipments for shipper@dhlpng.com, Phase 8.2 mode-aware."""
    existing = await db.shipments.count_documents({"userId": shipper_user_id})
    with_mode = await db.shipments.count_documents({"userId": shipper_user_id, "mode": {"$exists": True}})
    if existing > 0 and with_mode == 0:
        logger.info(f"[SEED] Shipper Phase 8.0 records ({existing}, no mode). Re-seeding.")
        await db.shipments.delete_many({"userId": shipper_user_id})
        existing = 0
    if existing >= 6:
        logger.info(f"[SEED] Shipper shipments already seeded ({existing}). Skipping.")
        return
    if existing > 0:
        await db.shipments.delete_many({"userId": shipper_user_id})

    rng = random.Random(2026)
    plan = [
        # (status, dest_code, city, ctry, recv_company, recv_name, service, mode)
        ("DELIVERED",  "SYD", "Sydney",    "AU", "Pacific Heavy Equipment Pty Ltd", "Maya Pereira",  "EXPRESS_WORLDWIDE", "AIR"),
        ("DELIVERED",  "BNE", "Brisbane",  "AU", "Coral Sea Industrial Ltd",        "Felix Tan",     "ECONOMY_SELECT",    "OCEAN"),
        ("IN_TRANSIT", "SIN", "Singapore", "SG", "Anchor Trading Co",               "Hadi Rahman",   "EXPRESS_12_00",     "AIR"),
        ("IN_TRANSIT", "AKL", "Auckland",  "NZ", "Southern Cross Procurement Ltd",  "Jordan Hale",   "ECONOMY_SELECT",    "OCEAN"),
        ("PICKED_UP",  "LAE", "Lae",       "PG", "Highlands Logistics PNG",         "Brian Tau",     "ECONOMY_SELECT",    "ROAD"),
        ("PENDING",    "HKG", "Hong Kong", "HK", "Victoria Harbour Imports Ltd",    "Ling Chow",     "ECONOMY_SELECT",    "OCEAN"),
    ]
    origin = {"city": "Port Moresby", "country": "PG", "code": "POM"}
    sender_company = "Highlands Mining Supplies (PNG) Ltd"
    sender_name = "Daniel Kavu"

    descriptions = [
        "Hydraulic spare parts", "Industrial conveyor belting",
        "Sealed bearing assemblies", "Diamond core drilling consumables",
        "Replacement filters and hoses (domestic Lae run)",
        "Calibrated measuring instruments",
    ]
    hs_codes = ["847990", "401012", "848210", "820719", "401320", "902300"]
    incoterms_seq = ["CIF", "FOB", "DAP", "CFR", "EXW", "FOB"]

    now = datetime.now(timezone.utc)
    docs = []

    for i, (st, dcode, dcity, dctry, rcomp, rname, service, mode) in enumerate(plan):
        if st == "DELIVERED":
            days_ago = rng.randint(15, 50)
        elif st == "IN_TRANSIT":
            days_ago = rng.randint(2, 6)
        elif st == "PICKED_UP":
            days_ago = rng.randint(0, 2)
        else:
            days_ago = 0
        created_at = now - timedelta(days=days_ago, hours=rng.randint(0, 23), minutes=rng.randint(0, 59))
        profile = MODE_PROFILE[mode]
        etd = created_at + timedelta(hours=24)
        eta = etd + timedelta(days=rng.randint(profile["min_days"], profile["max_days"]), hours=rng.randint(0, 12))
        actual_delivery = eta + timedelta(hours=rng.randint(-12, 12)) if st == "DELIVERED" else None
        dest = {"city": dcity, "country": dctry, "code": dcode}

        sender_addr = {
            "name": sender_name, "company": sender_company,
            "address": f"{rng.randint(11, 199)} Sir Hubert Murray Highway",
            "city": origin["city"], "country": origin["country"],
            "phone": "+675 7345 1100", "email": "daniel.kavu@highlandsmining.com.pg",
            "postalCode": "121",
        }
        receiver_addr = {
            "name": rname, "company": rcomp,
            "address": f"{rng.randint(20, 880)} {rng.choice(['Industrial', 'Wharf', 'Harbour', 'Trade', 'Market'])} Road",
            "city": dest["city"], "country": dest["country"],
            "phone": f"+{rng.randint(60, 85)} {rng.randint(2000, 9999)} {rng.randint(1000, 9999)}",
            "email": f"{rname.split()[0].lower()}@{rcomp.lower().replace(' ', '').replace(',', '').replace('.', '')[:14]}.com",
            "postalCode": str(rng.randint(1000, 99999)),
        }
        pieces = rng.randint(1, 5)
        if mode == "AIR":
            weight_per_piece = round(rng.uniform(0.8, 9.5), 2)
        elif mode == "OCEAN":
            weight_per_piece = round(rng.uniform(180, 1100), 2)
        else:
            weight_per_piece = round(rng.uniform(40, 300), 2)
        total_weight = round(pieces * weight_per_piece, 2)

        package = {
            "pieces": pieces, "weightKg": total_weight,
            "dimensions": {"l": round(rng.uniform(20, 200), 1),
                            "w": round(rng.uniform(15, 160), 1),
                            "h": round(rng.uniform(10, 140), 1)},
            "description": descriptions[i],
            "declaredValueUSD": round(rng.uniform(80, 1900), 2),
        }

        mode_base = {"AIR": 18, "OCEAN": 1.2, "ROAD": 5.5}[mode]
        dest_mult = {"SYD": 1.0, "BNE": 1.0, "AKL": 1.1, "SIN": 1.3, "HKG": 1.4, "LAE": 0.6}.get(dcode, 1.2)
        cost_pgk = round(total_weight * mode_base * dest_mult + rng.uniform(40, 150), 2)
        cost_pgk = max(200.0, min(7500.0, cost_pgk))

        events = _gen_events_for_status(st, origin, dest, created_at, eta, rname.split()[0][0])

        origin_port, dest_port = _ports_for(mode, origin["code"], dest["code"])
        co2 = round(total_weight * profile["co2_per_kg"], 2)
        air_specs = _build_specifics("AIR", total_weight, i + 100) if mode == "AIR" else None
        ocean_specs = _build_specifics("OCEAN", total_weight, i + 100) if mode == "OCEAN" else None
        road_specs = _build_specifics("ROAD", total_weight, i + 100) if mode == "ROAD" else None

        docs.append({
            "awb": SHIPPER_AWBS[i], "userId": shipper_user_id,
            "sender": sender_addr, "receiver": receiver_addr,
            "package": package, "service": service, "status": st,
            "origin": origin, "destination": dest, "events": events,
            "estimatedDelivery": eta.isoformat(),
            "actualDelivery": actual_delivery.isoformat() if actual_delivery else None,
            "costPGK": cost_pgk,
            "createdAt": created_at.isoformat(),
            "updatedAt": created_at.isoformat(),
            "mode": mode,
            "bookingReference": SHIPPER_BOOKINGS[i],
            "incoterms": incoterms_seq[i],
            "commodity": descriptions[i],
            "hsCode": hs_codes[i],
            "cargoDescription": descriptions[i],
            "originPort": origin_port,
            "destinationPort": dest_port,
            "etd": etd.isoformat(),
            "eta": eta.isoformat(),
            "airSpecifics": air_specs,
            "oceanSpecifics": ocean_specs,
            "roadSpecifics": road_specs,
            "co2EstimateKg": co2,
        })

    await db.shipments.insert_many(docs)
    logger.info(
        f"[SEED] Inserted 6 shipper shipments (Phase 8.2 mode-aware) for user {shipper_user_id}. "
        f"AWBs {SHIPPER_AWBS[0]}..{SHIPPER_AWBS[-1]}"
    )
