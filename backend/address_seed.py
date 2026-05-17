"""Address book seed — pre-populates the addresses collection for the two
seeded demo users with realistic Shipper / Consignee / Notify Party records
that match the 57 ocean-freight shipments seeded by seed/seed_57_shipments.py.

Idempotent: skips if the user already has any addresses.
"""
import uuid
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Each entry has an explicit `role` (SHIPPER / CONSIGNEE / NOTIFY) that drives
# the new B2B "Parties" UI. We keep the legacy `isDefaultSender`/
# `isDefaultReceiver` boolean flags in sync for backwards compatibility.
# ─────────────────────────────────────────────────────────────────────────────

DEMO_ADDRESSES = [
    # ── Shipper of record (the demo user's own corporate identity) ──────────
    {"role": "SHIPPER",
     "label": "Head Office — Port Moresby",
     "name": "Demo User", "company": "PNG Logistics Co",
     "address": "Lvl 2, Defens Haus, Champion Parade",
     "city": "Port Moresby", "country": "PG", "postalCode": "121",
     "phone": "+675 7000 0000", "email": "ops@pnglogistics.demo"},
    {"role": "SHIPPER",
     "label": "Warehouse — Lae",
     "name": "Demo User", "company": "PNG Logistics Co (Lae Branch)",
     "address": "Voco Point Industrial Estate, Lot 4",
     "city": "Lae", "country": "PG", "postalCode": "411",
     "phone": "+675 7000 1234", "email": "lae@pnglogistics.demo"},

    # ── Consignees (overseas receivers) ────────────────────────────────────
    {"role": "CONSIGNEE",
     "label": "Sydney Logistics Partner",
     "name": "Maya Pereira", "company": "Australian Cargo Partners Pty Ltd",
     "address": "Unit 12, 88 Marine Parade",
     "city": "Sydney", "country": "AU", "postalCode": "2000",
     "phone": "+61 2 7000 8800", "email": "maya@auscargopartners.demo"},
    {"role": "CONSIGNEE",
     "label": "Auckland Distributor",
     "name": "Jordan Hale", "company": "Pacific Northern Distributors Ltd",
     "address": "55 Customs Street West",
     "city": "Auckland", "country": "NZ", "postalCode": "1010",
     "phone": "+64 9 555 2030", "email": "jordan@pacificnorthern.demo"},

    # ── Notify Parties (brokers / agents who get HBL copies) ───────────────
    {"role": "NOTIFY",
     "label": "Brisbane Customs Broker",
     "name": "Felix Tan", "company": "QLD Wholesale Imports",
     "address": "210 Kingsford Smith Drive",
     "city": "Brisbane", "country": "AU", "postalCode": "4006",
     "phone": "+61 7 5500 1200", "email": "felix@qldimports.demo"},
    {"role": "NOTIFY",
     "label": "Singapore Trade House",
     "name": "Hadi Rahman", "company": "ASEAN Trade Corp",
     "address": "30 Raffles Place, #18-02",
     "city": "Singapore", "country": "SG", "postalCode": "048622",
     "phone": "+65 6555 7700", "email": "hadi@aseantrade.demo"},
]


SHIPPER_ADDRESSES = [
    {"role": "SHIPPER",
     "label": "Highlands HQ — Port Moresby",
     "name": "Daniel Kavu", "company": "Highlands Mining Supplies (PNG) Ltd",
     "address": "165 Sir Hubert Murray Highway",
     "city": "Port Moresby", "country": "PG", "postalCode": "121",
     "phone": "+675 7345 1100", "email": "daniel.kavu@highlandsmining.com.pg"},
    {"role": "SHIPPER",
     "label": "Lae Operations Base",
     "name": "Daniel Kavu", "company": "Highlands Mining Supplies (PNG) Ltd — Lae",
     "address": "Lot 7 Section 22, Top Town Industrial",
     "city": "Lae", "country": "PG", "postalCode": "411",
     "phone": "+675 7345 1101", "email": "lae@highlandsmining.com.pg"},
    {"role": "CONSIGNEE",
     "label": "Pacific Heavy Equipment — Sydney",
     "name": "Maya Pereira", "company": "Pacific Heavy Equipment Pty Ltd",
     "address": "44 Industrial Drive",
     "city": "Sydney", "country": "AU", "postalCode": "2150",
     "phone": "+61 2 8800 4200", "email": "maya@pacificheavyequip.demo"},
    {"role": "CONSIGNEE",
     "label": "Coral Sea Industrial — Brisbane",
     "name": "Felix Tan", "company": "Coral Sea Industrial Ltd",
     "address": "98 Wharf Road",
     "city": "Brisbane", "country": "AU", "postalCode": "4007",
     "phone": "+61 7 3300 5400", "email": "felix@coralseaindustrial.demo"},
    {"role": "NOTIFY",
     "label": "Anchor Trading — Singapore",
     "name": "Hadi Rahman", "company": "Anchor Trading Co",
     "address": "12 Tanjong Pagar Plaza, #11-04",
     "city": "Singapore", "country": "SG", "postalCode": "082110",
     "phone": "+65 6770 1234", "email": "hadi@anchortrading.demo"},
    {"role": "NOTIFY",
     "label": "Southern Cross Procurement — Auckland",
     "name": "Jordan Hale", "company": "Southern Cross Procurement Ltd",
     "address": "210 Harbour View Road",
     "city": "Auckland", "country": "NZ", "postalCode": "1011",
     "phone": "+64 9 332 5500", "email": "jordan@southerncrossproc.demo"},
]


# Schema version stamp — bumped when seed entries change shape so old data can
# be cleared and re-seeded automatically.
SEED_VERSION = 2


def _build_doc(user_id: str, entry: dict, now_iso: str) -> dict:
    role = entry.get("role", "NOTIFY")
    return {
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "label": entry["label"],
        "name": entry["name"],
        "company": entry["company"],
        "address": entry["address"],
        "city": entry["city"],
        "country": entry["country"],
        "postalCode": entry.get("postalCode", ""),
        "phone": entry.get("phone", ""),
        "email": entry.get("email", ""),
        "role": role,
        # Legacy flags kept in sync so existing callers keep working.
        "isDefaultSender": role == "SHIPPER",
        "isDefaultReceiver": role == "CONSIGNEE",
        "seedVersion": SEED_VERSION,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }


async def seed_address_book(db, user_id: str, user_email: str):
    """Insert pre-defined addresses for a user.

    Idempotent — skips if the user already has any addresses tagged with the
    current SEED_VERSION. If older-version seed records exist (or unversioned
    legacy records), they're cleared and re-seeded to match the new schema.
    """
    if user_email == "demo@dhlpng.com":
        seeds = DEMO_ADDRESSES
    elif user_email == "shipper@dhlpng.com":
        seeds = SHIPPER_ADDRESSES
    else:
        return

    current_count = await db.addresses.count_documents(
        {"userId": user_id, "seedVersion": SEED_VERSION}
    )
    if current_count > 0:
        logger.info(
            f"[SEED] Addresses already at v{SEED_VERSION} for {user_email} "
            f"({current_count}). Skipping."
        )
        return

    # Different version (or unversioned legacy) records exist — clear and
    # re-seed so the UI shows the right Shipper/Consignee/Notify roles.
    deleted = (await db.addresses.delete_many({"userId": user_id})).deleted_count
    if deleted:
        logger.info(
            f"[SEED] Cleared {deleted} legacy address records for {user_email} "
            f"to re-seed at v{SEED_VERSION}."
        )

    now = datetime.now(timezone.utc).isoformat()
    docs = [_build_doc(user_id, s, now) for s in seeds]
    if docs:
        await db.addresses.insert_many(docs)
        logger.info(
            f"[SEED] Inserted {len(docs)} address records for {user_email} "
            f"(v{SEED_VERSION})."
        )
