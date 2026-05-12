"""Address book seed — pre-populates the addresses collection for the two
seeded demo users. Idempotent: skips if the user already has any addresses.
"""
import uuid
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


DEMO_ADDRESSES = [
    # Senders (the demo user's own offices)
    {"label": "Head Office — Port Moresby",
     "name": "Demo User", "company": "PNG Logistics Co",
     "address": "Lvl 2, Defens Haus, Champion Parade",
     "city": "Port Moresby", "country": "PG", "postalCode": "121",
     "phone": "+675 7000 0000", "email": "ops@pnglogistics.demo",
     "isDefaultSender": True, "isDefaultReceiver": False},
    {"label": "Warehouse — Lae",
     "name": "Demo User", "company": "PNG Logistics Co (Lae Branch)",
     "address": "Voco Point Industrial Estate, Lot 4",
     "city": "Lae", "country": "PG", "postalCode": "411",
     "phone": "+675 7000 1234", "email": "lae@pnglogistics.demo",
     "isDefaultSender": False, "isDefaultReceiver": False},
    {"label": "Sydney Logistics Partner",
     "name": "Maya Pereira", "company": "Australian Cargo Partners Pty Ltd",
     "address": "Unit 12, 88 Marine Parade",
     "city": "Sydney", "country": "AU", "postalCode": "2000",
     "phone": "+61 2 7000 8800", "email": "maya@auscargopartners.demo",
     "isDefaultSender": False, "isDefaultReceiver": True},
    {"label": "Brisbane Wholesale",
     "name": "Felix Tan", "company": "QLD Wholesale Imports",
     "address": "210 Kingsford Smith Drive",
     "city": "Brisbane", "country": "AU", "postalCode": "4006",
     "phone": "+61 7 5500 1200", "email": "felix@qldimports.demo",
     "isDefaultSender": False, "isDefaultReceiver": False},
    {"label": "Singapore Trade House",
     "name": "Hadi Rahman", "company": "ASEAN Trade Corp",
     "address": "30 Raffles Place, #18-02",
     "city": "Singapore", "country": "SG", "postalCode": "048622",
     "phone": "+65 6555 7700", "email": "hadi@aseantrade.demo",
     "isDefaultSender": False, "isDefaultReceiver": False},
    {"label": "Auckland Distributor",
     "name": "Jordan Hale", "company": "Pacific Northern Distributors Ltd",
     "address": "55 Customs Street West",
     "city": "Auckland", "country": "NZ", "postalCode": "1010",
     "phone": "+64 9 555 2030", "email": "jordan@pacificnorthern.demo",
     "isDefaultSender": False, "isDefaultReceiver": False},
]


SHIPPER_ADDRESSES = [
    {"label": "Highlands HQ — Port Moresby",
     "name": "Daniel Kavu", "company": "Highlands Mining Supplies (PNG) Ltd",
     "address": "165 Sir Hubert Murray Highway",
     "city": "Port Moresby", "country": "PG", "postalCode": "121",
     "phone": "+675 7345 1100", "email": "daniel.kavu@highlandsmining.com.pg",
     "isDefaultSender": True, "isDefaultReceiver": False},
    {"label": "Lae Operations Base",
     "name": "Daniel Kavu", "company": "Highlands Mining Supplies (PNG) Ltd — Lae",
     "address": "Lot 7 Section 22, Top Town Industrial",
     "city": "Lae", "country": "PG", "postalCode": "411",
     "phone": "+675 7345 1101", "email": "lae@highlandsmining.com.pg",
     "isDefaultSender": False, "isDefaultReceiver": False},
    {"label": "Pacific Heavy Equipment — Sydney",
     "name": "Maya Pereira", "company": "Pacific Heavy Equipment Pty Ltd",
     "address": "44 Industrial Drive",
     "city": "Sydney", "country": "AU", "postalCode": "2150",
     "phone": "+61 2 8800 4200", "email": "maya@pacificheavyequip.demo",
     "isDefaultSender": False, "isDefaultReceiver": True},
    {"label": "Coral Sea Industrial — Brisbane",
     "name": "Felix Tan", "company": "Coral Sea Industrial Ltd",
     "address": "98 Wharf Road",
     "city": "Brisbane", "country": "AU", "postalCode": "4007",
     "phone": "+61 7 3300 5400", "email": "felix@coralseaindustrial.demo",
     "isDefaultSender": False, "isDefaultReceiver": False},
    {"label": "Anchor Trading — Singapore",
     "name": "Hadi Rahman", "company": "Anchor Trading Co",
     "address": "12 Tanjong Pagar Plaza, #11-04",
     "city": "Singapore", "country": "SG", "postalCode": "082110",
     "phone": "+65 6770 1234", "email": "hadi@anchortrading.demo",
     "isDefaultSender": False, "isDefaultReceiver": False},
    {"label": "Southern Cross Procurement — Auckland",
     "name": "Jordan Hale", "company": "Southern Cross Procurement Ltd",
     "address": "210 Harbour View Road",
     "city": "Auckland", "country": "NZ", "postalCode": "1011",
     "phone": "+64 9 332 5500", "email": "jordan@southerncrossproc.demo",
     "isDefaultSender": False, "isDefaultReceiver": False},
]


async def seed_address_book(db, user_id: str, user_email: str):
    """Insert pre-defined addresses for a user, idempotent. Skips if any
    address already exists for this user."""
    existing = await db.addresses.count_documents({"userId": user_id})
    if existing > 0:
        logger.info(f"[SEED] Addresses already seeded for {user_email} "
                    f"({existing}). Skipping.")
        return

    if user_email == "demo@dhlpng.com":
        seeds = DEMO_ADDRESSES
    elif user_email == "shipper@dhlpng.com":
        seeds = SHIPPER_ADDRESSES
    else:
        return

    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for a in seeds:
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            **a,
            "createdAt": now,
            "updatedAt": now,
        })
    if docs:
        await db.addresses.insert_many(docs)
        logger.info(f"[SEED] Inserted {len(docs)} addresses for {user_email}.")
