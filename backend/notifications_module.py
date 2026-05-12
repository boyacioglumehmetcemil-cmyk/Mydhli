"""Notifications module — backend routes + seed.

DHL Mapping: Internal (not part of DHL XML Services). Simple in-app
notification list backed by the `notifications` MongoDB collection.
"""
import uuid
import random
import logging
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

logger = logging.getLogger(__name__)


# ===== Models =====
class NotificationOut(BaseModel):
    id: str
    type: str        # SHIPMENT_DELIVERED, OUT_FOR_DELIVERY, INVOICE_PAID,
                     # PICKUP_CONFIRMED, SERVICE_UPDATE
    title: str
    subtitle: str
    awb: Optional[str] = None
    invoiceNumber: Optional[str] = None
    createdAt: str
    readAt: Optional[str] = None


class NotificationListResponse(BaseModel):
    items: List[NotificationOut]
    total: int
    unread: int


# ===== Router factory =====
def build_notifications_router(db, get_current_user_dep):
    router = APIRouter(prefix="/api")

    @router.get("/notifications", response_model=NotificationListResponse)
    async def list_notifications(
        user: dict = Depends(get_current_user_dep),
        page: int = Query(1, ge=1),
        pageSize: int = Query(20, ge=1, le=100),
    ):
        """List the current user's notifications, most recent first.

        DHL Mapping: Internal — not part of DHL XML Services.
        """
        q = {"userId": user["id"]}
        total = await db.notifications.count_documents(q)
        unread = await db.notifications.count_documents({**q, "readAt": None})
        skip = (page - 1) * pageSize
        cursor = (db.notifications.find(q, {"_id": 0})
                  .sort("createdAt", -1).skip(skip).limit(pageSize))
        items = await cursor.to_list(length=pageSize)
        return {"items": items, "total": total, "unread": unread}

    @router.get("/notifications/unread-count")
    async def unread_count(user: dict = Depends(get_current_user_dep)):
        """Return the current user's unread notification count.

        DHL Mapping: Internal — not part of DHL XML Services.
        """
        n = await db.notifications.count_documents(
            {"userId": user["id"], "readAt": None}
        )
        return {"unread": n}

    @router.post("/notifications/{notif_id}/read")
    async def mark_read(notif_id: str, user: dict = Depends(get_current_user_dep)):
        """Mark a single notification as read.

        DHL Mapping: Internal — not part of DHL XML Services.
        """
        res = await db.notifications.update_one(
            {"id": notif_id, "userId": user["id"], "readAt": None},
            {"$set": {"readAt": datetime.now(timezone.utc).isoformat()}},
        )
        if res.matched_count == 0:
            # Already-read or non-existent — idempotent OK
            return {"ok": True, "alreadyRead": True}
        return {"ok": True, "alreadyRead": False}

    @router.post("/notifications/read-all")
    async def mark_all_read(user: dict = Depends(get_current_user_dep)):
        """Mark all of the current user's unread notifications as read.

        DHL Mapping: Internal — not part of DHL XML Services.
        """
        now = datetime.now(timezone.utc).isoformat()
        res = await db.notifications.update_many(
            {"userId": user["id"], "readAt": None},
            {"$set": {"readAt": now}},
        )
        return {"ok": True, "updated": res.modified_count}

    return router


# ===== Seed =====
async def seed_notifications_for_user(db, user_id: str, user_email: str):
    """Seed 6-8 demo notifications for a user (idempotent — skips if any
    notifications already exist for this user)."""
    existing = await db.notifications.count_documents({"userId": user_id})
    if existing > 0:
        logger.info(f"[SEED] Notifications already seeded for {user_email} "
                    f"({existing}). Skipping.")
        return

    # Pull a few of the user's real shipments to tie messages to real AWBs.
    delivered = await db.shipments.find(
        {"userId": user_id, "status": "DELIVERED"}, {"awb": 1, "receiver": 1, "destination": 1}
    ).to_list(length=3)
    out_for_delivery = await db.shipments.find(
        {"userId": user_id, "status": "OUT_FOR_DELIVERY"},
        {"awb": 1, "receiver": 1, "destination": 1},
    ).to_list(length=2)
    in_transit = await db.shipments.find(
        {"userId": user_id, "status": "IN_TRANSIT"},
        {"awb": 1, "receiver": 1, "destination": 1},
    ).to_list(length=2)
    picked_up = await db.shipments.find(
        {"userId": user_id, "status": "PICKED_UP"},
        {"awb": 1, "receiver": 1, "destination": 1},
    ).to_list(length=1)

    rng = random.Random(hash(user_email) & 0xffffffff)
    now = datetime.now(timezone.utc)

    docs = []

    # 1) Up to 2 delivered notifications (read)
    for i, s in enumerate(delivered[:2]):
        recv = (s.get("receiver") or {}).get("name", "consignee")
        dest = (s.get("destination") or {}).get("city", "destination")
        delta = timedelta(days=rng.randint(2, 10), hours=rng.randint(0, 23))
        created = now - delta
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "type": "SHIPMENT_DELIVERED",
            "title": f"Shipment delivered to {recv}",
            "subtitle": f"AWB {s['awb']} arrived at {dest}",
            "awb": s["awb"],
            "createdAt": created.isoformat(),
            "readAt": (created + timedelta(hours=2)).isoformat(),
        })

    # 2) Out for delivery (unread)
    for s in out_for_delivery[:1]:
        dest = (s.get("destination") or {}).get("city", "destination")
        created = now - timedelta(hours=rng.randint(1, 6))
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "type": "OUT_FOR_DELIVERY",
            "title": "Out for delivery",
            "subtitle": f"AWB {s['awb']} is out for delivery in {dest}",
            "awb": s["awb"],
            "createdAt": created.isoformat(),
            "readAt": None,
        })

    # 3) In transit (unread)
    for s in in_transit[:1]:
        dest = (s.get("destination") or {}).get("city", "destination")
        created = now - timedelta(hours=rng.randint(8, 30))
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "type": "IN_TRANSIT",
            "title": "Shipment update",
            "subtitle": f"AWB {s['awb']} cleared origin facility — en route to {dest}",
            "awb": s["awb"],
            "createdAt": created.isoformat(),
            "readAt": None,
        })

    # 4) Invoice paid (read)
    invoice_doc = await db.invoices.find_one(
        {"userId": user_id, "status": "PAID"},
        {"invoiceNumber": 1, "totalPGK": 1},
    )
    if invoice_doc:
        inv_no = invoice_doc.get("invoiceNumber") or invoice_doc.get("id") or "INV-—"
        created = now - timedelta(days=rng.randint(1, 8))
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "type": "INVOICE_PAID",
            "title": "Payment received",
            "subtitle": f"Invoice {inv_no} paid in full",
            "invoiceNumber": inv_no,
            "createdAt": created.isoformat(),
            "readAt": (created + timedelta(hours=4)).isoformat(),
        })

    # 5) Pickup confirmed (unread)
    if picked_up:
        s = picked_up[0]
        created = now - timedelta(hours=rng.randint(2, 24))
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "type": "PICKUP_CONFIRMED",
            "title": "Pickup confirmed",
            "subtitle": f"Courier collected AWB {s['awb']} — now in transit",
            "awb": s["awb"],
            "createdAt": created.isoformat(),
            "readAt": None,
        })
    else:
        # Generic pickup-confirmed if user has no PICKED_UP shipments
        created = now - timedelta(hours=rng.randint(2, 24))
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "type": "PICKUP_CONFIRMED",
            "title": "Pickup confirmed",
            "subtitle": "Your scheduled pickup has been confirmed for tomorrow",
            "createdAt": created.isoformat(),
            "readAt": None,
        })

    # 6-7) Service update (mixed)
    service_msgs = [
        ("Service notice", "Brief weather delay reported on the Port Moresby ↔ Lae lane",
         "SERVICE_UPDATE"),
        ("New rates effective 1 June",
         "Updated express rate cards are now available for review", "SERVICE_UPDATE"),
        ("Pickup window reminder",
         "Last cut-off for next-day pickup is 4:30 PM local time",
         "SERVICE_UPDATE"),
    ]
    rng.shuffle(service_msgs)
    for i, (title, sub, kind) in enumerate(service_msgs[:2]):
        created = now - timedelta(days=rng.randint(0, 5), hours=rng.randint(0, 23))
        # Make one of them unread
        read_at = None if i == 0 else (created + timedelta(hours=3)).isoformat()
        docs.append({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "type": kind,
            "title": title,
            "subtitle": sub,
            "createdAt": created.isoformat(),
            "readAt": read_at,
        })

    if docs:
        await db.notifications.insert_many(docs)
        unread_n = sum(1 for d in docs if d["readAt"] is None)
        logger.info(
            f"[SEED] Inserted {len(docs)} notifications for {user_email} "
            f"({unread_n} unread)."
        )
