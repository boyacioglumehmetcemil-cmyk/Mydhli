# DHL Global Forwarding PNG — Demo Backend

FastAPI + MongoDB. Demo backend that powers the myDHLi pitch app. All data
in this build is mock — there are no live calls to DHL services.

## DHL XML Services Mapping

This backend's endpoints intentionally mirror the operations described in
DHL's XML Services Implementation Guide v2.4 (Nov 2014). On production
switch to the live DHL Developer Portal APIs (REST/JSON), each handler
becomes an adapter that delegates to the corresponding live service.

| Internal route | DHL operation |
|---|---|
| `/api/quotes` | Capability & Quote |
| `/api/shipments` (POST) | Shipment Validation |
| `/api/shipments/{awb}/label.pdf` | Shipment Validation — Label Image |
| `/api/track/{awb}` | Tracking |
| `/api/pickups` (POST) | Pickup Request |
| `/api/pickups/{id}` (DELETE) | Pickup Cancellation |

Internal-only surfaces (not part of DHL XML Services):

| Internal route | Purpose |
|---|---|
| `/api/auth/*` | Identity layer (JWT + bcrypt) |
| `/api/addresses` | Address book — sender/receiver presets |
| `/api/invoices/*` | SaaS billing layer |
| `/api/reports/*` | Customer-side analytics |
| `/api/customs/*` | Customs doc generator (related to ShipmentValidation's `Dutiable` block) |
| `/api/payments/charge` | Payment integration boundary (PSP adapter slot) |

## Authentication

- **Today (demo):** JWT (HS256, 7-day expiry) + bcrypt-hashed passwords.
- **DHL XML Services (legacy):** SiteID / Password per request (no user concept).
- **DHL Developer Portal (modern REST):** OAuth 2.0 client credentials.

The adapter switch is a known-shape rewrite: the route handlers stay,
their bodies become outbound API calls.

## Demo credentials

Seeded on startup. See `/app/memory/test_credentials.md` for the canonical
copy used by the testing agent.

```
email:    demo@dhlpng.com
password: Demo@2026
```

## Local

Supervisor auto-runs the backend on `0.0.0.0:8001` with hot reload. The
external URL comes from `REACT_APP_BACKEND_URL` in the frontend `.env`;
do not call `localhost:8001` from the browser.
