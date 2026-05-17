"""Seed the 57-shipment Ocean Freight evidence pack into MongoDB.

Run:
    cd /app/backend && python3 -m seed.seed_57_shipments

Behaviour:
    1. WIPES the `shipments` collection AND the `documents` collection.
    2. WIPES `/app/uploads/shipment_documents/` on disk.
    3. Parses /app/uploads/dhl_57_shipments/00_MASTER/master_logbook.json plus
       SHIPMENT_INDEX.csv plus bl_metadata_cache.json (built by us at audit
       time) and builds 57 Shipment dicts that match the existing Phase 8.2
       schema in shipments_module.py (no schema migration needed).
    4. For every shipment, copies + anonymises every PDF that ships with that
       folder into /app/uploads/shipment_documents/{swb}/ via PyMuPDF
       redactions (see document_filler.py).
    5. Inserts one `documents` row per copied PDF — status=APPROVED because
       these represent already-executed historical paperwork.

Idempotent: rerunning fully wipes and re-seeds.

The script is intentionally a standalone async runner (no FastAPI) so it can
be invoked manually whenever the seed data changes — never during normal
request handling. It does NOT register itself into server.py startup.
"""
from __future__ import annotations

import asyncio
import csv
import hashlib
import json
import logging
import os
import shutil
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Make the script importable from /app/backend without needing PYTHONPATH gymnastics.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from document_filler import anonymize_pdf, doc_type_from_filename

load_dotenv("/app/backend/.env")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [seed_57] %(message)s")
log = logging.getLogger("seed_57")

# ============ PATHS ============
SOURCE_ROOT = Path("/app/uploads/dhl_57_shipments")
TARGET_ROOT = Path("/app/uploads/shipment_documents")
SEED_DIR = Path(__file__).parent
BL_CACHE = SEED_DIR / "bl_metadata_cache.json"

# ============ STATIC PARTY DATA ============
# Derived from the actual addresses & tax IDs in the source PDFs — all already
# corporate / publicly-listed, no PII. Anonymised contact phones kept.
SELLERS = {
    "MAN Energy Solutions SE": {
        "company": "MAN Energy Solutions SE",
        "address": "Stadtbachstraße 1",
        "city": "Augsburg",
        "country": "Germany",
        "postalCode": "86153",
        "phone": "+49 821 322-0",
        "email": "export.ops@man-es.com",
        "taxId": "DE128492611",
    },
    "BOMAG GmbH": {
        "company": "BOMAG GmbH",
        "address": "Hellerwald",
        "city": "Boppard",
        "country": "Germany",
        "postalCode": "56154",
        "phone": "+49 6742 100-0",
        "email": "international.logistics@bomag.com",
        "taxId": "DE149871134",
    },
}

BUYERS = {
    "Marine Power Solutions Singapore Pte Ltd": {
        "company": "Marine Power Solutions Singapore Pte Ltd",
        "address": "50 Tuas Crescent",
        "city": "Singapore",
        "country": "Singapore",
        "postalCode": "638725",
        "phone": "+65 6863 7720",
        "email": "procurement@marinepower.sg",
        "taxId": "UEN 201538291M",
    },
    "Pacific Heavy Machinery Pte Ltd": {
        "company": "Pacific Heavy Machinery Pte Ltd",
        "address": "Terminal Avenue, Tuas",
        "city": "Singapore",
        "country": "Singapore",
        "postalCode": "627620",
        "phone": "+65 6886 1500",
        "email": "procurement@pacificheavy.sg",
        "taxId": "UEN 200811476G",
    },
}

# Short → full seller / buyer name (master_logbook.json has truncated forms)
SELLER_SHORT_TO_FULL = {
    "MAN Energy": "MAN Energy Solutions SE",
    "BOMAG GmbH": "BOMAG GmbH",
}
BUYER_SHORT_TO_FULL = {
    "Marine Power": "Marine Power Solutions Singapore Pte Ltd",
    "Pacific Heavy": "Pacific Heavy Machinery Pte Ltd",
}

# Transit port → LocationCode
PORT_LOCATION = {
    "Port Moresby":   {"city": "Port Moresby", "country": "Papua New Guinea", "code": "PGPOM"},
    "Port of Suva":   {"city": "Suva",         "country": "Fiji",            "code": "FJSUV"},
}
NOTIFY_BY_PORT = {
    "PGPOM": {
        "company": "Pacific Cargo Logistics PNG Ltd.",
        "address": "Coastal Street, Wharf Area",
        "city": "Port Moresby",
        "country": "Papua New Guinea",
        "postalCode": "121",
        "phone": "+675 320 1122",
        "email": "ops@pacificcargolog.com.pg",
    },
    "FJSUV": {
        "company": "SP Cargo Fiji Pte Ltd",
        "address": "Walu Bay Industrial Area",
        "city": "Suva",
        "country": "Fiji",
        "postalCode": "1188",
        "phone": "+679 331 2200",
        "email": "ops@spcargo.com.fj",
    },
}

# Product → HS code + indicative dimensions / weight
PRODUCT_DEFAULTS = {
    "Cyl Liner": {
        "hsCode": "8409.91",
        "description": "MAN B&W Marine Diesel Cylinder Liner",
        "dimensions": {"l": 200, "w": 110, "h": 95},
        "weightKg": 4150,
    },
    "Cyl Head": {
        "hsCode": "8409.91",
        "description": "MAN B&W Marine Diesel Cylinder Head Assembly",
        "dimensions": {"l": 220, "w": 130, "h": 110},
        "weightKg": 5200,
    },
    "Bomag BW 154": {
        "hsCode": "8429.40",
        "description": "BOMAG BW 154 Single-Drum Vibratory Soil Compactor",
        "dimensions": {"l": 500, "w": 230, "h": 290},
        "weightKg": 9500,
    },
    "Bomag BW 174": {
        "hsCode": "8429.40",
        "description": "BOMAG BW 174 Tandem Vibratory Asphalt Roller",
        "dimensions": {"l": 480, "w": 220, "h": 280},
        "weightKg": 8200,
    },
    "Excavator Bucket": {
        "hsCode": "8431.49",
        "description": "Heavy-Duty Excavator Bucket Attachment (3.5 m³)",
        "dimensions": {"l": 280, "w": 170, "h": 150},
        "weightKg": 2400,
    },
}

# Container type → service code + descriptor
CONTAINER_TYPE = {
    "20ft FCL": ("20FT_DRY",        "Ocean FCL — 20' Standard Dry"),
    "40ft FR":  ("40FT_FLAT_RACK",  "Ocean FCL — 40' Flat Rack"),
}

USD_TO_PGK = 3.55     # rough Singapore-PNG rate
EUR_TO_USD = 1.05     # for declaredValueUSD


# ============ HELPERS ============
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_date(s: str) -> datetime:
    """master_logbook uses ISO yyyy-mm-dd."""
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def _full_seller(row: dict) -> dict:
    name = SELLER_SHORT_TO_FULL.get(row["seller"], row["seller"])
    return SELLERS[name] | {"name": name}


def _full_buyer(row: dict) -> dict:
    name = BUYER_SHORT_TO_FULL.get(row["buyer"], row["buyer"])
    return BUYERS[name] | {"name": name}


def _build_address(party: dict) -> dict:
    """Pydantic AddressModel keys."""
    return {
        "name":       party["name"],
        "company":    party["company"],
        "address":    party["address"],
        "city":       party["city"],
        "country":    party["country"],
        "phone":      party["phone"],
        "email":      party["email"],
        "postalCode": party["postalCode"],
    }


def _booking_date(etd: datetime) -> datetime:
    """Booking is typically 10–14 days before sailing."""
    return etd - timedelta(days=12)


def _build_events(row: dict, etd: datetime, eta: datetime, customs: datetime,
                  status: str, bl_meta: dict) -> list[dict]:
    """Realistic 5–6 event timeline."""
    booking = _booking_date(etd)
    pol_label = "Singapore Tuas (SGSIN)"
    transit_label = PORT_LOCATION[row["transit_port"]]["city"]
    vessel = bl_meta.get("vessel_voyage", "Vessel TBA")

    events = [
        {"timestamp": booking,                     "status": "OC",         "location": pol_label,
         "description": f"Booking confirmed · {bl_meta.get('booking_ref', 'BKG-PENDING')}",          "code": "OC"},
        {"timestamp": etd - timedelta(days=2),     "status": "PICKED_UP",  "location": pol_label,
         "description": "Container gated-in at Tuas Mega Port",                                       "code": "DF"},
        {"timestamp": etd,                         "status": "IN_TRANSIT", "location": pol_label,
         "description": f"Loaded on board {vessel} — vessel departed POL",                            "code": "AF"},
        {"timestamp": eta,                         "status": "IN_TRANSIT", "location": transit_label,
         "description": f"Vessel arrived at {transit_label} (POD)",                                   "code": "AR"},
        {"timestamp": customs,                     "status": "OUT_FOR_DELIVERY", "location": transit_label,
         "description": "Customs cleared at port",                                                    "code": "CC"},
    ]
    if status == "DELIVERED":
        events.append({
            "timestamp": customs + timedelta(days=2),
            "status": "DELIVERED",
            "location": transit_label,
            "description": "Final delivery completed to consignee onward-route partner",
            "code": "OK",
        })
    else:  # AT_DEPOT
        events.append({
            "timestamp": customs + timedelta(days=1),
            "status": "AT_DEPOT",
            "location": transit_label,
            "description": "Cargo placed in DHL bonded warehouse — awaiting consignee instructions",
            "code": "DEP",
        })
    return events


def _depot_priority(days: int) -> str:
    if days > 365:
        return "CRITICAL"
    if days > 180:
        return "HIGH"
    if days > 90:
        return "MEDIUM"
    return "MONITOR"


def _build_shipment(row: dict, bl_meta: dict, demo_user_id: str, now: datetime) -> dict:
    """Assemble a Shipment doc matching shipments_module.Shipment shape."""
    swb_no   = row["swb_no"]
    seller   = _full_seller(row)
    buyer    = _full_buyer(row)
    pod_loc  = PORT_LOCATION[row["transit_port"]]
    notify   = NOTIFY_BY_PORT[pod_loc["code"]]
    product  = PRODUCT_DEFAULTS.get(row["product"], PRODUCT_DEFAULTS["Cyl Liner"])
    cont_t   = CONTAINER_TYPE.get(row["container"], ("20FT_DRY", "Ocean FCL — 20' Standard"))

    etd      = _parse_date(row["etd_singapore"])
    eta      = _parse_date(row["port_arrival"])
    customs  = _parse_date(row["customs_clearance"])
    status   = "DELIVERED" if row["status"] == "Teslim" else "AT_DEPOT"

    booking_ref = bl_meta.get("booking_ref") or f"BKG-SIN-{etd.year}-{swb_no.split('-')[-1]}"
    vessel_voyage = bl_meta.get("vessel_voyage", "MV CORAL EXPRESS · V-XXX")
    vessel, _, voyage = vessel_voyage.partition("·")
    bl_number = bl_meta.get("bl_number", f"SGSINPGPOM00000{swb_no.split('-')[-1]}")

    ocean_specifics = {
        "vessel":           vessel.strip(),
        "voyage":           voyage.strip(),
        "blNumber":         bl_number,
        "containerNumber":  None,    # filled below from CSV when available
        "containerType":    cont_t[0],
        "sealNumber":       None,
        "freightTerm":      "Prepaid (CIF)",
        "originals":        "3/3",
        "goodsValueEur":    row["goods_value_eur"],
        "freightCostUsd":   row["freight_cost_usd"],
        "customsClearedDate": customs.isoformat(),
        "finalDestination": row["final_destination"],
        "depotStatus":      None,
    }
    if status == "AT_DEPOT":
        days = max(0, (now - customs).days)
        ocean_specifics["depotStatus"] = {
            "location":  "DHL Bonded Warehouse PNG – Hangar 7, Port Moresby Wharf"
                          if pod_loc["code"] == "PGPOM"
                          else "DHL Suva Bonded Storage – Walu Bay Block C",
            "since":     customs.isoformat(),
            "days":      days,
            "priority":  _depot_priority(days),
        }

    shipment = {
        "awb":               swb_no,
        "userId":            demo_user_id,
        "sender":            _build_address(seller),
        "receiver":          _build_address(buyer),
        "package": {
            "pieces":            1,
            "weightKg":          float(product["weightKg"]),
            "dimensions":        product["dimensions"],
            "description":       product["description"],
            "declaredValueUSD":  float(row["goods_value_eur"]) * EUR_TO_USD,
        },
        "service":             cont_t[0],
        "status":              status,
        "origin": {
            "city":              "Singapore",
            "country":           "Singapore",
            "code":              "SGSIN",
        },
        "destination":         pod_loc,
        "events":              _build_events(row, etd, eta, customs, status, bl_meta),
        "estimatedDelivery":   eta,
        "actualDelivery":      customs + timedelta(days=2) if status == "DELIVERED" else None,
        "costPGK":             round(float(row["freight_cost_usd"]) * USD_TO_PGK, 2),
        "createdAt":           _booking_date(etd),
        "updatedAt":           now,

        # Phase 8.2 fields
        "mode":                "OCEAN",
        "bookingReference":    booking_ref,
        "incoterms":           "CIF",
        "commodity":           row["product"],
        "hsCode":              product["hsCode"],
        "cargoDescription":    product["description"],
        "originPort":          "SGSIN",
        "destinationPort":     pod_loc["code"],
        "etd":                 etd,
        "eta":                 eta,
        "oceanSpecifics":      ocean_specifics,
        "co2EstimateKg":       round(float(product["weightKg"]) * 0.014, 1),  # rough ocean CO2 factor

        # Internal flag
        "isDemoSeed":          True,
        "demoBatch":           "57_OCEAN_FREIGHT_PACK",
        "notifyParty":         notify,
    }
    return shipment


def _merge_csv_overlay(shipments: list[dict], csv_path: Path) -> None:
    """SHIPMENT_INDEX.csv carries the actual container # and seal #. Patch
    each shipment's oceanSpecifics in-place."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            for s in shipments:
                if s["awb"] == row["SWB"]:
                    s["oceanSpecifics"]["containerNumber"] = row.get("Container No") or None
                    s["oceanSpecifics"]["sealNumber"] = row.get("Seal No") or None
                    break


# ============ MAIN ============
async def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    log.info("Phase 1: locating demo user…")
    demo = await db.users.find_one({"email": "demo@dhlpng.com"})
    if not demo:
        log.error("demo@dhlpng.com not found in users collection — start the backend at least once so the seed runs.")
        return
    demo_user_id = demo["id"]
    log.info(f"  demo user_id = {demo_user_id}")

    log.info("Phase 2: wiping existing shipments + documents collections…")
    deleted_ships = (await db.shipments.delete_many({})).deleted_count
    deleted_docs = (await db.documents.delete_many({})).deleted_count
    log.info(f"  removed {deleted_ships} shipments, {deleted_docs} documents from Mongo")

    log.info("Phase 3: wiping /app/uploads/shipment_documents/…")
    if TARGET_ROOT.exists():
        shutil.rmtree(TARGET_ROOT)
    TARGET_ROOT.mkdir(parents=True, exist_ok=True)
    log.info(f"  reset {TARGET_ROOT}")

    log.info("Phase 4: parsing master logbook + B/L cache…")
    rows = json.loads((SOURCE_ROOT / "00_MASTER" / "master_logbook.json").read_text())
    bl_meta_all = json.loads(BL_CACHE.read_text())
    log.info(f"  {len(rows)} shipments parsed, {len(bl_meta_all)} B/L meta entries")

    log.info("Phase 5: building shipment documents…")
    now = _now()
    shipments = [_build_shipment(r, bl_meta_all.get(r["swb_no"], {}), demo_user_id, now) for r in rows]
    _merge_csv_overlay(shipments, SOURCE_ROOT / "00_MASTER" / "SHIPMENT_INDEX.csv")
    delivered = sum(1 for s in shipments if s["status"] == "DELIVERED")
    at_depot  = sum(1 for s in shipments if s["status"] == "AT_DEPOT")
    log.info(f"  built {len(shipments)} shipments — {delivered} DELIVERED, {at_depot} AT_DEPOT")

    log.info("Phase 6: inserting shipments…")
    await db.shipments.insert_many(shipments)
    log.info(f"  ✓ inserted {len(shipments)} shipments")

    log.info("Phase 7: anonymising + copying PDFs + writing document rows…")
    doc_rows: list[dict] = []
    total_replacements = 0
    files_with_hits = 0
    pdf_count = 0

    for s in shipments:
        swb = s["awb"]
        # The source folder uses "_Delivered" or "_Depot" suffix on the path.
        suffix = "_Delivered" if s["status"] == "DELIVERED" else "_Depot"
        src_folder = SOURCE_ROOT / f"{swb}{suffix}"
        if not src_folder.is_dir():
            log.warning(f"  missing source folder {src_folder}")
            continue
        dst_folder = TARGET_ROOT / swb
        dst_folder.mkdir(parents=True, exist_ok=True)

        for pdf in sorted(src_folder.glob("*.pdf")):
            doc_type = doc_type_from_filename(pdf.name)
            if doc_type is None:
                log.warning(f"  unmappable filename, skipping: {pdf.name}")
                continue
            doc_id = str(uuid.uuid4())
            stored = f"{doc_id}.pdf"
            dst_path = dst_folder / stored
            stats = anonymize_pdf(pdf, dst_path)
            pdf_count += 1
            if stats["total_hits"] > 0:
                files_with_hits += 1
                total_replacements += stats["total_hits"]

            size = dst_path.stat().st_size
            # page count — re-read with pypdf for accuracy
            try:
                from pypdf import PdfReader
                pages = len(PdfReader(str(dst_path)).pages)
            except Exception:
                pages = None

            doc_rows.append({
                "document_id":          doc_id,
                "shipment_ref":         swb,
                "document_type":        doc_type,
                "file_name":            pdf.name,
                "stored_file_name":     stored,
                "file_path":            str(dst_path),
                "file_size_bytes":      size,
                "mime_type":            "application/pdf",
                "page_count":           pages,
                "status":               "APPROVED",
                "uploaded_by_user_id":  demo_user_id,
                "uploaded_by_email":    "operations@dhl-gf.com",
                "uploaded_at":          s["createdAt"].isoformat(),
                "reviewed_by_user_id":  demo_user_id,
                "reviewed_by_email":    "operations@dhl-gf.com",
                "reviewed_at":          s["createdAt"].isoformat(),
                "review_note":          "Auto-approved on demo seed (historical record).",
                "tags":                 [],
                "is_deleted":           False,
                "created_at":           s["createdAt"].isoformat(),
                "updated_at":           s["updatedAt"].isoformat(),
                "is_demo_seed":         True,
            })

    log.info(f"  ✓ anonymised + copied {pdf_count} PDFs ({files_with_hits} had PII redactions, {total_replacements} total replacements)")
    if doc_rows:
        await db.documents.insert_many(doc_rows)
        log.info(f"  ✓ inserted {len(doc_rows)} document rows")

    log.info("Done. Final counts:")
    log.info(f"  shipments collection  = {await db.shipments.count_documents({})}")
    log.info(f"  documents collection  = {await db.documents.count_documents({})}")
    log.info(f"  on-disk PDF size      = {sum(p.stat().st_size for p in TARGET_ROOT.rglob('*.pdf')) // 1024} KB")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
