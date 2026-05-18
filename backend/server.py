from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from shipments_module import build_router as build_shipments_router, seed_shipments
from business_module import build_router as build_business_router, seed_addresses_and_pickups
from invoices_module import (
    build_router as build_invoices_router,
    seed_invoices,
    seed_shipper_invoices,
    seed_shipper_customs,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'dhlpng_demo')]

# JWT config
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_DAYS = 7

# Password hashing (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI app — openapi at /api/openapi.json per requirements
app = FastAPI(
    title="DHL Global Forwarding PNG — Demo API",
    description="Mock API for DHL Papua New Guinea pitch demo. NOT affiliated with DHL.",
    version="0.1.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Router with /api prefix
api_router = APIRouter(prefix="/api")

# Bearer security
security = HTTPBearer(auto_error=False)


# ============ MODELS ============
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    companyName: str = Field(..., min_length=1, max_length=100)
    country: str = Field(default="PG", min_length=2, max_length=50)
    phone: str = Field(..., min_length=5, max_length=25)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        has_letter = any(c.isalpha() for c in v)
        has_digit = any(c.isdigit() for c in v)
        if not (has_letter and has_digit):
            raise ValueError("Password must contain both letters and digits")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ProfileUpdate(BaseModel):
    firstName: Optional[str] = Field(default=None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(default=None, min_length=1, max_length=50)
    companyName: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=5, max_length=25)


class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str = Field(..., min_length=8, max_length=72)


class NotificationPrefs(BaseModel):
    shipmentCreated: dict = Field(default_factory=lambda: {"email": True, "sms": False})
    outForDelivery: dict = Field(default_factory=lambda: {"email": True, "sms": True})
    delivered: dict = Field(default_factory=lambda: {"email": True, "sms": False})
    invoiceIssued: dict = Field(default_factory=lambda: {"email": True, "sms": False})
    pickupConfirmation: dict = Field(default_factory=lambda: {"email": True, "sms": True})


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    firstName: str
    lastName: str
    companyName: str
    country: str
    phone: str
    createdAt: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


# Placeholder Pydantic models for future phases (collections will exist when first written to)
class ShipmentStub(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class AddressStub(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class InvoiceStub(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


# ============ AUTH UTILS ============
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> tuple[str, int]:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, JWT_EXPIRE_DAYS * 24 * 60 * 60


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    # convert createdAt back to datetime if stored as iso string
    if isinstance(user.get("createdAt"), str):
        user["createdAt"] = datetime.fromisoformat(user["createdAt"])
    return user


def serialize_user(user_doc: dict) -> UserPublic:
    created = user_doc.get("createdAt")
    if isinstance(created, str):
        created = datetime.fromisoformat(created)
    return UserPublic(
        id=user_doc["id"],
        email=user_doc["email"],
        firstName=user_doc["firstName"],
        lastName=user_doc["lastName"],
        companyName=user_doc["companyName"],
        country=user_doc["country"],
        phone=user_doc["phone"],
        createdAt=created,
    )


# ============ ROUTES ============
@api_router.get("/")
async def root():
    return {"message": "DHL Global Forwarding PNG Demo API", "status": "ok"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.post("/auth/register", response_model=TokenResponse, status_code=201)
async def register(payload: UserRegister):
    """
    Create a new account and return a JWT.

    DHL Mapping: Identity layer — Internal. DHL XML Services uses
    SiteID/Password (per-request credentials, no user concept); modern DHL
    REST APIs use OAuth 2.0. We use JWT + bcrypt for the demo's user model.
    """
    # Normalize email
    email = payload.email.lower()

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    user_doc = {
        "id": user_id,
        "email": email,
        "password": hash_password(payload.password),
        "firstName": payload.firstName.strip(),
        "lastName": payload.lastName.strip(),
        "companyName": payload.companyName.strip(),
        "country": payload.country or "PG",
        "phone": payload.phone.strip(),
        "createdAt": now.isoformat(),
        "updatedAt": now.isoformat(),
    }

    await db.users.insert_one(user_doc)
    logger.info(f"[REGISTER] New user: {email}")

    token, expires_in = create_access_token(user_id, email)
    user_doc["createdAt"] = now
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        user=serialize_user(user_doc),
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    """
    Verify credentials and issue a JWT.

    DHL Mapping: Identity layer — Internal. See `/auth/register`.
    """
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token, expires_in = create_access_token(user["id"], user["email"])
    logger.info(f"[LOGIN] {email}")
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        user=serialize_user(user),
    )


@api_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    # Mock — just log
    logger.info(f"[FORGOT-PASSWORD] reset requested for: {payload.email}")
    return {
        "success": True,
        "message": "If an account exists for this email, a password reset link has been sent.",
    }


@api_router.get("/auth/me", response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)


@api_router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    logger.info(f"[LOGOUT] {current_user.get('email')}")
    return {"success": True, "message": "Logged out"}


@api_router.put("/auth/me", response_model=UserPublic)
async def update_profile(payload: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update = {k: v.strip() for k, v in payload.model_dump(exclude_none=True).items() if isinstance(v, str)}
    if not update:
        return serialize_user(current_user)
    update["updatedAt"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": current_user["id"]}, {"$set": update})
    new_doc = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return serialize_user(new_doc)


@api_router.put("/auth/password")
async def change_password(payload: PasswordChange, current_user: dict = Depends(get_current_user)):
    user_full = await db.users.find_one({"id": current_user["id"]})
    if not user_full or not verify_password(payload.currentPassword, user_full["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.newPassword) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    has_letter = any(c.isalpha() for c in payload.newPassword)
    has_digit = any(c.isdigit() for c in payload.newPassword)
    if not (has_letter and has_digit):
        raise HTTPException(status_code=400, detail="Password must contain both letters and digits")
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": hash_password(payload.newPassword),
                  "updatedAt": datetime.now(timezone.utc).isoformat()}},
    )
    return {"success": True, "message": "Password updated"}


@api_router.get("/notifications/preferences")
async def get_notif_prefs(current_user: dict = Depends(get_current_user)):
    doc = await db.notification_prefs.find_one({"userId": current_user["id"]}, {"_id": 0})
    if not doc:
        defaults = NotificationPrefs().model_dump()
        return defaults
    doc.pop("userId", None)
    return doc


@api_router.put("/notifications/preferences")
async def update_notif_prefs(payload: NotificationPrefs, current_user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["userId"] = current_user["id"]
    doc["updatedAt"] = datetime.now(timezone.utc).isoformat()
    await db.notification_prefs.update_one(
        {"userId": current_user["id"]}, {"$set": doc}, upsert=True
    )
    return payload.model_dump()


# Include the router in the main app
app.include_router(api_router)

# Mount shipments router (uses /api prefix internally)
shipments_router = build_shipments_router(db, get_current_user)
app.include_router(shipments_router)

# Mount business router (addresses, pickups, payments, quotes, locations, services)
business_router = build_business_router(db, get_current_user)
app.include_router(business_router)

# Mount invoices/reports/customs router
invoices_router = build_invoices_router(db, get_current_user)
app.include_router(invoices_router)

# Mount in-app notifications router
from notifications_module import build_notifications_router, seed_notifications_for_user
notifications_router = build_notifications_router(db, get_current_user)
app.include_router(notifications_router)

# Mount documents router (Phase 8.3a — uploads, metadata, approve/reject, soft delete)
from documents_module import build_router as build_documents_router
documents_router = build_documents_router(db, get_current_user)
app.include_router(documents_router)

# NOTE: Phase 8.4c forwarding doc-generator (docxtpl + LibreOffice) was REMOVED
# on the user's instruction — the synthetic templates looked unprofessional
# next to the real 482 anonymised PDFs and the pitch demo must show only
# authentic operational paperwork. The previous endpoint
#   POST /api/shipments/{ref}/generate-documents
# is intentionally NOT mounted anymore. Until DHL provides official blank
# templates, no generic / template-based PDF generation is available.


# ============ HEALTH CHECK ============
# Lightweight liveness probe (in addition to the existing /api/ route).
# Must NOT hit MongoDB so that Atlas connection lag never trips
# Kubernetes/Emergent probes.
@app.get("/api/health")
async def api_health():
    return {"status": "ok"}


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============ STARTUP / SHUTDOWN ============
async def _seed_demo_customs(db, user: dict):
    """Idempotent customs seed for the demo user — 6 declarations referencing
    the first 6 ocean-freight shipments. Skipped when the user already has
    any customs document on file.
    """
    user_id = user["id"]
    existing = await db.customs_documents.count_documents({"userId": user_id})
    if existing > 0:
        logger.info(f"[SEED] Demo customs already at {existing} entries. Skipping.")
        return

    ships = await db.shipments.find({"userId": user_id}, {"_id": 0}).limit(6).to_list(length=6)
    if not ships:
        return
    types = ["COMMERCIAL_INVOICE", "PACKING_LIST", "EXPORT_DECLARATION",
             "COMMERCIAL_INVOICE", "PACKING_LIST", "EXPORT_DECLARATION"]
    descs = ["Heavy machinery spare parts", "Hydraulic seal kit",
             "Excavator filter set", "Steel cable assembly",
             "Marine diesel pump"]
    hs_codes = ["8413.91", "8484.10", "8421.39", "7312.10", "8413.50"]
    origins = ["DE", "JP", "US", "CN"]

    docs = []
    now = datetime.now(timezone.utc)
    for i, s in enumerate(ships):
        sender = s.get("sender", {}) or {}
        receiver = s.get("receiver", {}) or {}
        ocean = s.get("oceanSpecifics") or {}
        usd_value = float(ocean.get("goodsValueEur") or 100000)
        item_count = 3 + (i % 3)
        items = [{
            "description": descs[j % len(descs)],
            "hsCode": hs_codes[j % len(hs_codes)],
            "quantity": 5 + j * 3,
            "unitValue": 250 + j * 180,
            "weightKg": 45 + j * 20,
            "countryOfOrigin": origins[j % len(origins)],
        } for j in range(item_count)]
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "shipmentAwb": s["awb"],
            "docType": types[i],
            "exporter": {
                "name": sender.get("company") or "Marine Power Solutions Singapore Pte Ltd",
                "company": sender.get("company") or "Marine Power Solutions Singapore Pte Ltd",
                "address": sender.get("address") or "Tuas Bay Industrial Park",
                "city": sender.get("city") or "Singapore",
                "country": sender.get("country") or "SG",
                "postalCode": sender.get("postalCode") or "637641",
            },
            "importer": {
                "name": receiver.get("company") or "PNG Logistics Co",
                "company": receiver.get("company") or "PNG Logistics Co",
                "address": receiver.get("address") or "Defens Haus, Champion Parade",
                "city": receiver.get("city") or "Port Moresby",
                "country": receiver.get("country") or "PG",
                "postalCode": receiver.get("postalCode") or "121",
            },
            "items": items,
            "currency": "USD",
            "totalValueUSD": usd_value,
            "signedBy": "Demo User",
            "signatureDate": now.isoformat(),
            "createdAt": now.isoformat(),
        })
    await db.customs_documents.insert_many(docs)
    logger.info(f"[SEED] Inserted {len(docs)} demo customs documents for {user['email']}")


@app.on_event("startup")
async def startup_seed():
    """Top-level startup wrapper.

    Every seed step below is individually wrapped in try/except so a
    misbehaving seed cannot fail the container's startup probe in production
    (Atlas, Emergent deploy, etc.). The app must always become ready and serve
    /api/ within the probe timeout window, even if MongoDB is slow or seeds
    fail mid-flight.
    """
    # Ensure unique index on email
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
    except Exception as e:
        logger.warning(f"Index creation: {e}")

    # Create empty placeholder collections (so they exist for future phases)
    for coll in ["shipments", "addresses", "invoices", "pickups", "quotes"]:
        try:
            existing = await db.list_collection_names()
            if coll not in existing:
                await db.create_collection(coll)
        except Exception as e:
            logger.debug(f"Placeholder collection {coll}: {e}")

    # Seed demo user
    demo_email = "demo@dhlpng.com"
    demo_pwd = "Demo@2026"
    existing = await db.users.find_one({"email": demo_email})
    if not existing:
        now = datetime.now(timezone.utc)
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": demo_email,
            "password": hash_password(demo_pwd),
            "firstName": "Demo",
            "lastName": "User",
            "companyName": "PNG Logistics Co",
            "country": "PG",
            "phone": "+675 7000 0000",
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        })
        logger.info(f"[SEED] Demo user created: {demo_email} / {demo_pwd}")
    else:
        logger.info(f"[SEED] Demo user already exists: {demo_email}")

    # Seed shipments for demo user
    demo_user = await db.users.find_one({"email": demo_email})
    if demo_user:
        try:
            await seed_shipments(db, demo_user["id"])
        except Exception as e:
            logger.error(f"[SEED] Shipment seeding failed: {e}")

        # Seed USD invoice ledger (~USD 269,180) for demo user — idempotent.
        try:
            await seed_invoices(db, demo_user)
        except Exception as e:
            logger.error(f"[SEED] Demo invoice seeding failed: {e}")

        # Seed demo customs declarations (6 entries referencing shipments) —
        # idempotent: skipped if any customs document already exists for user.
        try:
            await _seed_demo_customs(db, demo_user)
        except Exception as e:
            logger.error(f"[SEED] Demo customs seeding failed: {e}")

    # ===== Seed secondary "shipper" user (Daniel Kavu) =====
    shipper_email = "shipper@dhlpng.com"
    shipper_pwd = "Shipper@2026"
    existing_shipper = await db.users.find_one({"email": shipper_email})
    if not existing_shipper:
        now = datetime.now(timezone.utc)
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": shipper_email,
            "password": hash_password(shipper_pwd),
            "firstName": "Daniel",
            "lastName": "Kavu",
            "companyName": "Highlands Mining Supplies (PNG) Ltd",
            "country": "PG",
            "phone": "+675 7345 1100",
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        })
        logger.info(f"[SEED] Shipper user created: {shipper_email} / {shipper_pwd}")
    else:
        logger.info(f"[SEED] Shipper user already exists: {shipper_email}")

    shipper_user = await db.users.find_one({"email": shipper_email})
    if shipper_user:
        try:
            from shipments_module import seed_shipper_shipments
            await seed_shipper_shipments(db, shipper_user["id"])
        except Exception as e:
            logger.error(f"[SEED] Shipper shipment seeding failed: {e}")

    # ===== Seed notifications for both users =====
    for u_email in (demo_email, shipper_email):
        u = await db.users.find_one({"email": u_email})
        if u:
            try:
                await seed_notifications_for_user(db, u["id"], u_email)
            except Exception as e:
                logger.error(f"[SEED] Notification seeding failed for {u_email}: {e}")

    # ===== Seed address book for both users =====
    try:
        from address_seed import seed_address_book
        for u_email in (demo_email, shipper_email):
            u = await db.users.find_one({"email": u_email})
            if u:
                await seed_address_book(db, u["id"], u_email)
    except Exception as e:
        logger.error(f"[SEED] Address book seeding failed: {e}")

    # ===== Seed shipper-specific invoices + customs =====
    try:
        sh = await db.users.find_one({"email": shipper_email})
        if sh:
            await seed_shipper_invoices(db, sh)
            await seed_shipper_customs(db, sh)
    except Exception as e:
        logger.error(f"[SEED] Shipper invoices/customs seeding failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
