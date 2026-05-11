"""Shipments module for DHL Express PNG Demo.
- Pydantic models for shipments, addresses, events, packages
- Public tracking endpoint (privacy-scrubbed)
- Auth-required list/detail endpoints (full PII)
- Seed function — populates 25 mock shipments for the demo user on first boot
"""
from fastapi import APIRouter, Depends, HTTPException, Query
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
        doc = await db.shipments.find_one(
            {"awb": awb.upper(), "userId": current_user["id"]},
            {"_id": 0},
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Shipment not found")
        normalized = _normalize_shipment(doc)
        return Shipment(**normalized)

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
