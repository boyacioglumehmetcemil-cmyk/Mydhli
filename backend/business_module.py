"""Business module — addresses, pickups, payments, locations, quotes, services.
Single APIRouter that's mounted by server.py.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import random
import logging

logger = logging.getLogger(__name__)


# ============ COUNTRIES / CITIES ============
COUNTRIES = [
    {"code": "PG", "name": "Papua New Guinea", "flag": "🇵🇬"},
    {"code": "AU", "name": "Australia", "flag": "🇦🇺"},
    {"code": "NZ", "name": "New Zealand", "flag": "🇳🇿"},
    {"code": "SG", "name": "Singapore", "flag": "🇸🇬"},
    {"code": "HK", "name": "Hong Kong SAR", "flag": "🇭🇰"},
    {"code": "JP", "name": "Japan", "flag": "🇯🇵"},
    {"code": "CN", "name": "China", "flag": "🇨🇳"},
    {"code": "ID", "name": "Indonesia", "flag": "🇮🇩"},
    {"code": "PH", "name": "Philippines", "flag": "🇵🇭"},
    {"code": "MY", "name": "Malaysia", "flag": "🇲🇾"},
    {"code": "TH", "name": "Thailand", "flag": "🇹🇭"},
    {"code": "VN", "name": "Vietnam", "flag": "🇻🇳"},
    {"code": "IN", "name": "India", "flag": "🇮🇳"},
    {"code": "KR", "name": "South Korea", "flag": "🇰🇷"},
    {"code": "AE", "name": "United Arab Emirates", "flag": "🇦🇪"},
    {"code": "US", "name": "United States", "flag": "🇺🇸"},
    {"code": "CA", "name": "Canada", "flag": "🇨🇦"},
    {"code": "UK", "name": "United Kingdom", "flag": "🇬🇧"},
    {"code": "DE", "name": "Germany", "flag": "🇩🇪"},
    {"code": "FR", "name": "France", "flag": "🇫🇷"},
    {"code": "NL", "name": "Netherlands", "flag": "🇳🇱"},
    {"code": "FJ", "name": "Fiji", "flag": "🇫🇯"},
    {"code": "SB", "name": "Solomon Islands", "flag": "🇸🇧"},
]

CITIES = {
    "PG": [{"city": "Port Moresby", "code": "POM"}, {"city": "Lae", "code": "LAE"}, {"city": "Mt Hagen", "code": "HGU"},
           {"city": "Madang", "code": "MAG"}, {"city": "Goroka", "code": "GKA"}, {"city": "Rabaul", "code": "RAB"}],
    "AU": [{"city": "Sydney", "code": "SYD"}, {"city": "Melbourne", "code": "MEL"}, {"city": "Brisbane", "code": "BNE"},
           {"city": "Perth", "code": "PER"}, {"city": "Adelaide", "code": "ADL"}],
    "NZ": [{"city": "Auckland", "code": "AKL"}, {"city": "Wellington", "code": "WLG"}, {"city": "Christchurch", "code": "CHC"}],
    "SG": [{"city": "Singapore", "code": "SIN"}],
    "HK": [{"city": "Hong Kong", "code": "HKG"}],
    "JP": [{"city": "Tokyo", "code": "NRT"}, {"city": "Osaka", "code": "KIX"}],
    "CN": [{"city": "Shanghai", "code": "PVG"}, {"city": "Beijing", "code": "PEK"}, {"city": "Guangzhou", "code": "CAN"}],
    "ID": [{"city": "Jakarta", "code": "CGK"}, {"city": "Bali", "code": "DPS"}],
    "PH": [{"city": "Manila", "code": "MNL"}, {"city": "Cebu", "code": "CEB"}],
    "MY": [{"city": "Kuala Lumpur", "code": "KUL"}],
    "TH": [{"city": "Bangkok", "code": "BKK"}],
    "VN": [{"city": "Ho Chi Minh City", "code": "SGN"}, {"city": "Hanoi", "code": "HAN"}],
    "IN": [{"city": "Mumbai", "code": "BOM"}, {"city": "Delhi", "code": "DEL"}, {"city": "Bangalore", "code": "BLR"}],
    "KR": [{"city": "Seoul", "code": "ICN"}],
    "AE": [{"city": "Dubai", "code": "DXB"}, {"city": "Abu Dhabi", "code": "AUH"}],
    "US": [{"city": "Los Angeles", "code": "LAX"}, {"city": "New York", "code": "JFK"}, {"city": "Chicago", "code": "ORD"}],
    "CA": [{"city": "Toronto", "code": "YYZ"}, {"city": "Vancouver", "code": "YVR"}],
    "UK": [{"city": "London", "code": "LHR"}, {"city": "Manchester", "code": "MAN"}],
    "DE": [{"city": "Frankfurt", "code": "FRA"}, {"city": "Berlin", "code": "BER"}],
    "FR": [{"city": "Paris", "code": "CDG"}],
    "NL": [{"city": "Amsterdam", "code": "AMS"}],
    "FJ": [{"city": "Nadi", "code": "NAN"}, {"city": "Suva", "code": "SUV"}],
    "SB": [{"city": "Honiara", "code": "HIR"}],
}

SERVICES = [
    {"code": "EXPRESS_12_00", "name": "Express 12:00",
     "description": "Guaranteed delivery before 12 noon next business day to major hubs.",
     "transitDaysHint": "1 day", "tier": "premium"},
    {"code": "EXPRESS_WORLDWIDE", "name": "Express Worldwide",
     "description": "Time-definite end-of-day delivery to 220+ countries.",
     "transitDaysHint": "1-3 days", "tier": "standard"},
    {"code": "ECONOMY_SELECT", "name": "Economy Select",
     "description": "Cost-effective shipping with day-definite delivery.",
     "transitDaysHint": "4-7 days", "tier": "economy"},
]

# Distance multiplier for pricing (higher = farther = more expensive)
COUNTRY_DISTANCE = {
    "AU": 1.0, "NZ": 1.1, "SG": 1.4, "ID": 1.3, "PH": 1.3, "MY": 1.5, "HK": 1.5,
    "JP": 1.7, "CN": 1.7, "TH": 1.6, "VN": 1.6, "KR": 1.7, "IN": 1.9, "AE": 2.0,
    "US": 2.3, "CA": 2.4, "UK": 2.6, "DE": 2.6, "FR": 2.6, "NL": 2.6,
    "FJ": 1.1, "SB": 0.8, "PG": 0.5,
}

# Base prices per kg
BASE_PER_KG = {"EXPRESS_12_00": 28.0, "EXPRESS_WORLDWIDE": 18.5, "ECONOMY_SELECT": 9.5}
BASE_HANDLING = {"EXPRESS_12_00": 35.0, "EXPRESS_WORLDWIDE": 22.0, "ECONOMY_SELECT": 12.0}


# ============ MODELS ============
class AddressBase(BaseModel):
    label: str = Field(..., max_length=60)
    name: str
    company: str = ""
    address: str
    city: str
    country: str
    postalCode: str = ""
    phone: str = ""
    email: str = ""


class AddressIn(AddressBase):
    isDefaultSender: bool = False
    isDefaultReceiver: bool = False


class AddressOut(AddressBase):
    id: str
    isDefaultSender: bool
    isDefaultReceiver: bool
    createdAt: datetime


class PickupIn(BaseModel):
    addressSnapshot: dict
    packageCount: int = Field(..., ge=1)
    totalWeightKg: float = Field(..., gt=0)
    scheduledDate: str  # ISO date
    scheduledWindow: str  # "09:00-12:00" etc
    specialInstructions: str = ""


class PickupOut(BaseModel):
    id: str
    confirmationNumber: str
    addressSnapshot: dict
    packageCount: int
    totalWeightKg: float
    scheduledDate: str
    scheduledWindow: str
    specialInstructions: str
    status: str
    createdAt: datetime


class QuoteRequest(BaseModel):
    originCountry: str
    originCity: str
    destinationCountry: str
    destinationCity: str
    weightKg: float = Field(..., gt=0)
    length: float = Field(default=20.0, gt=0)
    width: float = Field(default=15.0, gt=0)
    height: float = Field(default=10.0, gt=0)
    declaredValueUSD: float = 0


class QuoteOption(BaseModel):
    service: str
    serviceName: str
    description: str
    pricePGK: float
    transitDays: int
    estimatedDelivery: str  # ISO date
    breakdown: dict


class QuoteResponse(BaseModel):
    options: List[QuoteOption]
    weightUsedKg: float
    volumetricKg: float
    chargeableKg: float
    distanceFactor: float


class PaymentIn(BaseModel):
    cardNumber: str
    expMonth: int = Field(..., ge=1, le=12)
    expYear: int = Field(..., ge=2025, le=2050)
    cvv: str = Field(..., min_length=3, max_length=4)
    cardholderName: str
    amountPGK: float = Field(..., gt=0)
    shipmentAwb: Optional[str] = None
    invoiceNumber: Optional[str] = None


class PaymentOut(BaseModel):
    referenceNumber: str
    status: str
    amountPGK: float
    last4: str
    createdAt: datetime
    detail: Optional[str] = None


# ============ HELPERS ============
def _luhn_check(card: str) -> bool:
    digits = [int(c) for c in card if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def _strip_id(doc):
    if doc:
        doc = {k: v for k, v in doc.items() if k != "_id"}
    return doc


def _calc_quote(req: QuoteRequest) -> QuoteResponse:
    volumetric = (req.length * req.width * req.height) / 5000.0
    chargeable = max(req.weightKg, volumetric)
    distance = COUNTRY_DISTANCE.get(req.destinationCountry, 1.5)
    options = []
    for svc in SERVICES:
        code = svc["code"]
        base = BASE_PER_KG[code] * chargeable * distance + BASE_HANDLING[code]
        # Add small value-based fee for declared value
        value_fee = req.declaredValueUSD * 0.005
        price = round(base + value_fee, 2)
        # Transit days
        if code == "EXPRESS_12_00":
            transit = 1 if distance < 1.5 else 2
        elif code == "EXPRESS_WORLDWIDE":
            transit = 2 if distance < 2.0 else 3
        else:
            transit = 4 if distance < 1.5 else 6 if distance < 2.2 else 7
        eta = (datetime.now(timezone.utc) + timedelta(days=transit)).date().isoformat()
        options.append(QuoteOption(
            service=code, serviceName=svc["name"], description=svc["description"],
            pricePGK=price, transitDays=transit, estimatedDelivery=eta,
            breakdown={
                "baseRate": round(BASE_PER_KG[code] * chargeable * distance, 2),
                "handling": BASE_HANDLING[code],
                "valueFee": round(value_fee, 2),
            },
        ))
    return QuoteResponse(
        options=options,
        weightUsedKg=req.weightKg,
        volumetricKg=round(volumetric, 2),
        chargeableKg=round(chargeable, 2),
        distanceFactor=distance,
    )


# ============ ROUTER ============
def build_router(db, get_current_user_dep):
    router = APIRouter(prefix="/api")

    # ---- locations & services (PUBLIC) ----
    @router.get("/locations/countries")
    async def list_countries():
        return COUNTRIES

    @router.get("/locations/cities")
    async def list_cities(country: str = Query(...)):
        return CITIES.get(country.upper(), [])

    @router.get("/services")
    async def list_services():
        return SERVICES

    # ---- quotes (auth) ----
    @router.post("/quotes", response_model=QuoteResponse)
    async def create_quote(payload: QuoteRequest, _user: dict = Depends(get_current_user_dep)):
        """
        Return 3 service-tier prices and transit days for a prospective shipment.

        DHL Mapping: Capability & Quote Service (DHL XML Services Guide §4).
        Returns EXPRESS_12_00 / EXPRESS_WORLDWIDE / ECONOMY_SELECT tiers with
        PGK pricing and ETA. On production switch this adapter calls the live
        Capability & Quote endpoint and remaps the response to the same shape.
        """
        return _calc_quote(payload)

    # ---- addresses (auth) ----
    @router.get("/addresses", response_model=List[AddressOut])
    async def list_addresses(user: dict = Depends(get_current_user_dep)):
        """
        Address book — convenience layer for sender/receiver presets.

        DHL Mapping: Internal (not part of DHL XML Services).
        DHL ShipmentValidation accepts an inline `Shipper`/`Consignee` block;
        this collection is our SaaS-side persistence so users don't retype.
        """
        cursor = db.addresses.find({"userId": user["id"]}, {"_id": 0}).sort("createdAt", -1)
        return await cursor.to_list(length=200)

    @router.post("/addresses", response_model=AddressOut, status_code=201)
    async def create_address(payload: AddressIn, user: dict = Depends(get_current_user_dep)):
        """
        Create an address entry. DHL Mapping: Internal address-book layer
        (not part of DHL XML Services).
        """
        # If marking default, unset others
        if payload.isDefaultSender:
            await db.addresses.update_many(
                {"userId": user["id"], "isDefaultSender": True}, {"$set": {"isDefaultSender": False}}
            )
        if payload.isDefaultReceiver:
            await db.addresses.update_many(
                {"userId": user["id"], "isDefaultReceiver": True}, {"$set": {"isDefaultReceiver": False}}
            )
        doc = payload.model_dump()
        doc.update({
            "id": str(uuid.uuid4()),
            "userId": user["id"],
            "createdAt": datetime.now(timezone.utc).isoformat(),
        })
        await db.addresses.insert_one(doc)
        return _strip_id(doc)

    @router.put("/addresses/{addr_id}", response_model=AddressOut)
    async def update_address(addr_id: str, payload: AddressIn, user: dict = Depends(get_current_user_dep)):
        existing = await db.addresses.find_one({"id": addr_id, "userId": user["id"]})
        if not existing:
            raise HTTPException(status_code=404, detail="Address not found")
        if payload.isDefaultSender:
            await db.addresses.update_many(
                {"userId": user["id"], "isDefaultSender": True, "id": {"$ne": addr_id}},
                {"$set": {"isDefaultSender": False}},
            )
        if payload.isDefaultReceiver:
            await db.addresses.update_many(
                {"userId": user["id"], "isDefaultReceiver": True, "id": {"$ne": addr_id}},
                {"$set": {"isDefaultReceiver": False}},
            )
        update = payload.model_dump()
        await db.addresses.update_one({"id": addr_id}, {"$set": update})
        new_doc = await db.addresses.find_one({"id": addr_id}, {"_id": 0})
        return new_doc

    @router.delete("/addresses/{addr_id}")
    async def delete_address(addr_id: str, user: dict = Depends(get_current_user_dep)):
        res = await db.addresses.delete_one({"id": addr_id, "userId": user["id"]})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Address not found")
        return {"success": True}

    @router.put("/addresses/{addr_id}/default")
    async def set_default(addr_id: str, body: dict, user: dict = Depends(get_current_user_dep)):
        kind = body.get("kind")
        if kind not in ("sender", "receiver"):
            raise HTTPException(status_code=400, detail="kind must be 'sender' or 'receiver'")
        field = "isDefaultSender" if kind == "sender" else "isDefaultReceiver"
        await db.addresses.update_many({"userId": user["id"]}, {"$set": {field: False}})
        res = await db.addresses.update_one({"id": addr_id, "userId": user["id"]}, {"$set": {field: True}})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Address not found")
        return {"success": True}

    # ---- pickups (auth) ----
    @router.get("/pickups", response_model=List[PickupOut])
    async def list_pickups(user: dict = Depends(get_current_user_dep)):
        """
        Auth-scoped pickup list. DHL Mapping: Internal (lists DHL Pickup
        Request bookings we've persisted; not a DHL XML operation itself).
        """
        cursor = db.pickups.find({"userId": user["id"]}, {"_id": 0}).sort("createdAt", -1)
        return await cursor.to_list(length=200)

    @router.post("/pickups", response_model=PickupOut, status_code=201)
    async def create_pickup(payload: PickupIn, user: dict = Depends(get_current_user_dep)):
        """
        Book a courier pickup. Returns confirmationNumber `PU########`.

        DHL Mapping: Pickup Request Service (DHL XML Services Guide §6).
        On production switch, this handler becomes the adapter that posts
        the equivalent BookPickupRequest to DHL and stores the response.
        """
        conf = "PU" + "".join(str(random.randint(0, 9)) for _ in range(8))
        doc = payload.model_dump()
        doc.update({
            "id": str(uuid.uuid4()),
            "userId": user["id"],
            "confirmationNumber": conf,
            "status": "SCHEDULED",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        })
        await db.pickups.insert_one(doc)
        return _strip_id(doc)

    @router.delete("/pickups/{pickup_id}")
    async def cancel_pickup(pickup_id: str, user: dict = Depends(get_current_user_dep)):
        """
        Cancel a scheduled pickup. Sets status=CANCELLED.

        DHL Mapping: Pickup Cancellation Service (DHL XML Services Guide §6).
        On production switch, this handler posts CancelPickupRequest to DHL
        and reconciles the local status from the response.
        """
        res = await db.pickups.update_one(
            {"id": pickup_id, "userId": user["id"]}, {"$set": {"status": "CANCELLED"}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Pickup not found")
        return {"success": True}

    # ---- payments (auth) ----
    @router.post("/payments/charge", response_model=PaymentOut)
    async def charge(payload: PaymentIn, user: dict = Depends(get_current_user_dep)):
        """
        Demo card charge — Luhn-validated mock with predictable test cards.

        DHL Mapping: Out of scope for DHL XML Services (which only covers
        AWB lifecycle, not payments). Replace this with the real PSP adapter
        (Stripe/Adyen/etc.) on production switch.
        """
        clean = "".join(c for c in payload.cardNumber if c.isdigit())
        # Validation
        now = datetime.now(timezone.utc)
        if not _luhn_check(clean):
            raise HTTPException(status_code=400, detail="Invalid card number")
        exp_date = datetime(payload.expYear, payload.expMonth, 1, tzinfo=timezone.utc)
        if exp_date < now.replace(day=1):
            raise HTTPException(status_code=400, detail="Card has expired")
        if not (payload.cvv.isdigit() and 3 <= len(payload.cvv) <= 4):
            raise HTTPException(status_code=400, detail="Invalid CVV")

        # Simulate decline for 4000... cards
        decline = clean.startswith("4000")
        ref = "PAY" + "".join(str(random.randint(0, 9)) for _ in range(10))
        status = "FAILED" if decline else "SUCCESS"
        last4 = clean[-4:]

        doc = {
            "id": str(uuid.uuid4()),
            "userId": user["id"],
            "amountPGK": payload.amountPGK,
            "currency": "PGK",
            "method": "card",
            "last4": last4,
            "status": status,
            "referenceNumber": ref,
            "createdAt": now.isoformat(),
            "linkedShipmentAwb": payload.shipmentAwb,
            "linkedInvoiceNumber": payload.invoiceNumber,
        }
        await db.payments.insert_one(doc)

        return PaymentOut(
            referenceNumber=ref,
            status=status,
            amountPGK=payload.amountPGK,
            last4=last4,
            createdAt=now,
            detail="Card was declined by issuer. Please try another card." if decline else "Payment successful",
        )

    return router


# ============ SEED ============
async def seed_addresses_and_pickups(db, user: dict):
    """Idempotent — seed 4 addresses + 3 pickups for the demo user if missing."""
    user_id = user["id"]
    existing_addrs = await db.addresses.count_documents({"userId": user_id})
    if existing_addrs == 0:
        random.seed(101)
        now = datetime.now(timezone.utc)
        addrs = [
            {"label": "Head Office", "name": f"{user['firstName']} {user['lastName']}",
             "company": user.get("companyName", "PNG Logistics Co"),
             "address": "12 Coronation Drive", "city": "Port Moresby", "country": "PG",
             "postalCode": "121", "phone": "+675 7000 1010", "email": user["email"],
             "isDefaultSender": True, "isDefaultReceiver": False},
            {"label": "Sydney Warehouse", "name": "Olivia Chen", "company": "Harbour Bridge Imports",
             "address": "47 George Street", "city": "Sydney", "country": "AU",
             "postalCode": "2000", "phone": "+61 2 9000 4242", "email": "olivia@harbourbridge.com",
             "isDefaultSender": False, "isDefaultReceiver": True},
            {"label": "Singapore Hub", "name": "Wei Lin Tan", "company": "Marina Bay Distribution",
             "address": "8 Marina Boulevard", "city": "Singapore", "country": "SG",
             "postalCode": "018981", "phone": "+65 6555 1212", "email": "weilin@marinabay.com",
             "isDefaultSender": False, "isDefaultReceiver": False},
            {"label": "Lae Branch", "name": "Daniel Kava", "company": "PNG Logistics Co",
             "address": "Markham Road", "city": "Lae", "country": "PG",
             "postalCode": "411", "phone": "+675 7500 9090", "email": "lae@pnglogistics.com.pg",
             "isDefaultSender": False, "isDefaultReceiver": False},
        ]
        for a in addrs:
            a.update({"id": str(uuid.uuid4()), "userId": user_id, "createdAt": now.isoformat()})
        await db.addresses.insert_many(addrs)
        logger.info(f"[SEED] Inserted {len(addrs)} addresses for {user['email']}")

    existing_pickups = await db.pickups.count_documents({"userId": user_id})
    if existing_pickups == 0:
        random.seed(202)
        now = datetime.now(timezone.utc)
        windows = ["09:00-12:00", "12:00-15:00", "15:00-18:00"]
        pickups = []
        for i in range(3):
            date = (now + timedelta(days=2 + i * 3)).date().isoformat()
            pickups.append({
                "id": str(uuid.uuid4()),
                "userId": user_id,
                "confirmationNumber": "PU" + "".join(str(random.randint(0, 9)) for _ in range(8)),
                "addressSnapshot": {
                    "name": f"{user['firstName']} {user['lastName']}",
                    "company": user.get("companyName", "PNG Logistics Co"),
                    "address": "12 Coronation Drive",
                    "city": "Port Moresby",
                    "country": "PG",
                    "postalCode": "121",
                    "phone": "+675 7000 1010",
                },
                "packageCount": random.randint(1, 5),
                "totalWeightKg": round(random.uniform(2, 22), 2),
                "scheduledDate": date,
                "scheduledWindow": windows[i % 3],
                "specialInstructions": ["Use rear loading dock.", "", "Call before arrival."][i],
                "status": "SCHEDULED",
                "createdAt": now.isoformat(),
            })
        await db.pickups.insert_many(pickups)
        logger.info(f"[SEED] Inserted {len(pickups)} pickups for {user['email']}")
