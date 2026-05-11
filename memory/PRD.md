# DHL Express PNG — Demo Clone (Web)

## Original Problem Statement
A pitch demo for DHL Papua New Guinea that mirrors MyDHL Express functionality. All data is MOCK (no real DHL API). The user will provide official logos later — for now a typographic placeholder "DHL Express" is used. Legal-safety badge "DEMO MODE" is fixed bottom-right on every page. All marketing copy is ORIGINAL.

## Architecture
- **Stack:** FastAPI (Python 3.11) + React 19 (CRA + craco) + MongoDB (motor) + Tailwind + shadcn/ui + sonner toasts
- **Auth:** JWT HS256, 7-day expiry, bcrypt password hashing, localStorage key `dhl_auth_token`
- **Routing:** React Router v7 with auth guard on `/dashboard/*`
- **Branding tokens:** DHL yellow `#FFCC00`, DHL red `#D40511`, ink `#1A1A1A`, panel `#F5F5F5`, text `#333333`, muted `#666666`
- **Fonts:** Cabinet Grotesk (Fontshare) for display headings, Inter (Google Fonts) for body

## User Personas
- **PNG Business Owner / Shipping Coordinator:** opens an account, logs in, manages shipments — the primary persona.
- **Account Manager / Internal DHL Staff:** views invoices, reports (future phases).

## Core Requirements (static)
- Marketing landing page + auth flow + dashboard shell
- Real working JWT auth (no mocked auth)
- Mongo-backed user collection
- Public OpenAPI spec at `/api/openapi.json`
- Mobile responsive at 375 / 768 / 1280+
- Demo-mode badge on every page

## What's Been Implemented (Phase 1) — 2026-02-XX
- **Backend** (`/app/backend/server.py`)
  - Pydantic models: `UserRegister`, `UserLogin`, `UserResponse`, `Token`, `ForgotPasswordRequest`
  - JWT util with HS256 (7-day expiry), bcrypt password hashing via passlib
  - Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `GET /api/auth/me`, `POST /api/auth/logout`
  - Demo user seeded on startup (`demo@dhlpng.com` / `Demo@2026`)
  - Placeholder Mongo collections created: `users`, `shipments`, `addresses`, `invoices`, `pickups`, `quotes`
  - OpenAPI mounted at `/api/openapi.json` (public)
  - Unique index on `users.email`
- **Frontend**
  - Pages: Landing, Login, Register, ForgotPassword, Dashboard, DashboardComingSoon
  - Components: Logo, DemoBadge, ProtectedRoute, LandingNavbar, Footer, DashboardLayout, HeroVisual
  - AuthContext bootstrap from localStorage with `/auth/me` hydration
  - Axios instance with auth interceptor and 401 auto-redirect
  - Sidebar collapses to hamburger (shadcn Sheet) on mobile
  - Password strength meter on Register
  - All interactive elements carry `data-testid`

## What's Been Implemented (Phase 2) — 2026-02-XX
- **Phase 1 bug fix:** Logout now redirects to `/` (landing), not `/login`. Navigates BEFORE clearing user state so ProtectedRoute doesn't interject.
- **Backend** (`/app/backend/shipments_module.py`)
  - Pydantic models: `Shipment` (full PII), `ShipmentPublic` (scrubbed), `ShipmentSummary`, `ShipmentEvent`, `AddressModel`, `AddressPublicModel`, `PackageModel`, `LocationCode`, `ShipmentListResponse`
  - Routes: `GET /api/track/{awb}` (PUBLIC, scrubbed), `GET /api/shipments` (auth, filterable + paginated), `GET /api/shipments/{awb}` (auth, full detail)
  - **25 shipments seeded** for the demo user on startup, deterministic with `random.seed(42)`
  - Status mix: 5 DELIVERED, 8 IN_TRANSIT, 4 OUT_FOR_DELIVERY, 3 PICKED_UP, 2 PENDING, 2 ON_HOLD, 1 EXCEPTION
  - Guaranteed demo AWB: `DHL1234567890` (IN_TRANSIT, Port Moresby → Sydney)
  - Privacy scrub: public track view hides sender/receiver name/email/phone/full address + package details + cost
  - Unique index on `shipments.awb`, compound index on `(userId, createdAt)`
- **Frontend**
  - New pages: `Track` (`/track`, `/track/:awb` public), `Shipments` (`/dashboard/shipments`), `ShipmentDetail` (`/dashboard/shipments/:awb`)
  - New components: `StatusBadge`, `RouteVisual` (custom SVG, no external map), `MilestoneTimeline`, `TrackingDetail` (shared between public + auth views)
  - New utils: `shipmentUtils.js` (status tones/labels, service labels, formatters)
  - Updated `Dashboard.jsx`: real Active Shipments KPI (sums PICKED_UP+IN_TRANSIT+OUT_FOR_DELIVERY), Recent Shipments table (last 5), This Month Spend KPI from API, Track Quick Action navigates to `/track`
  - Updated `Landing.jsx`: hero track widget now navigates to `/track/:awb`
  - Updated `LandingNavbar.jsx`: TRACK link is now a router Link
  - Updated `App.js` routing: `/track`, `/track/:awb`, replaced `dashboard/shipments` coming-soon with real list + detail routes
  - Mobile: shipments list switches to card layout below `md` breakpoint

## Acceptance Criteria Status
- [x] Demo user can log in
- [x] New user can register & is auto-logged in
- [x] Forgot password flow shows success message
- [x] Protected routes redirect when unauthenticated
- [x] Logout clears token and redirects to **/** (Phase 2 fix verified)
- [x] Sidebar coming-soon items work
- [x] DEMO MODE badge visible bottom-right
- [x] `/api/openapi.json` publicly accessible
- [x] Mobile responsive
- [x] AWB `DHL1234567890` returns valid in-transit shipment on public `/track/:awb`
- [x] Invalid AWB shows clean empty state
- [x] Public track hides PII; auth detail shows full PII
- [x] My Shipments lists 25 seeded shipments
- [x] Search/filter/sort/pagination all working
- [x] Timeline UI is polished, color-coded, latest highlighted
- [x] Route visualization is custom (no external map)
- [x] Dashboard Active Shipments KPI reflects real count (15)
- [x] Dashboard Recent Shipments shows last 5
- [x] Phase 1 regression: all 16 auth tests still passing

## Prioritized Backlog (Phase 3+)
### Now Implemented (Parts A–E) — 2026-05-11
- **Backend modules**
  - `labels_module.py` — A6 shipping labels (Code128 barcode + QR), A4 invoices, customs docs, account reports (reportlab + qrcode + python-barcode). **FIXED:** ImageReader bug on shipping label PDF.
  - `business_module.py` — quotes (PGK pricing with chargeable+volumetric+distance factor), addresses CRUD with default sender/receiver kinds, pickups CRUD with PU####### confirmation, mock card charge (Luhn + 4111 success / 4000 decline).
  - `invoices_module.py` — invoices list/get/pay/PDF, reports overview (monthlySpend, shipmentsByService, shipmentsByStatus, topDestinations, **dailyVolume** — renamed from volumeOverTime to match spec), reports PDF, customs CRUD + PDF.
  - Seeded: 8 invoices (PAID/UNPAID/OVERDUE mix), 4 addresses, 3 pickups, notifications preferences.
- **Frontend pages wired in `App.js`**
  - `/dashboard/ship` — 5-step Ship Now wizard
  - `/dashboard/quote` — live debounced Get a Quote calculator (**FIXED:** useQuote → applyQuote hook-lint)
  - `/dashboard/addresses` — Address Book cards with edit/delete/default
  - `/dashboard/pickup` and `/dashboard/pickups` — schedule + list/cancel
  - `/dashboard/invoices` — list + Pay Now modal + PDF download
  - `/dashboard/reports` — 4 recharts (monthly bar, by service donut, by status, daily volume line) + PDF export
  - `/dashboard/customs` — create + list + PDF
  - `/dashboard/settings` — Profile / Business / Security / Notifications / API tabs
  - `*` NotFound
- **Landing page global redesign** — `/app/frontend/src/components/landing/` (GlobalNavbar, HeroSection cargo-plane, AnimatedStats, ServicesGrid, GlobalNetwork, WhyBlocks, Testimonials, FinalCTA, RichFooter). **FIXED:** GlobalNavbar changed sticky → fixed so transparent navbar overlays hero (Sign In / nav links now visible over dark hero).
- **Login page** — split-screen with world-routes visual on right
- **Testing:** 28/30 backend pytests passing (`test_parts_a_to_e.py`). Frontend all 9 dashboard routes load, KPIs populate, charts render.

### Future Backlog
- P1: Multi-leg/transfer routing in route visualization
- P2: Real email integration for forgot-password (Resend/SendGrid)
- P2: Sortable table headers on My Shipments
- P2: Swap typographic logo for official DHL asset when user provides it
- P2: Email/SMS notifications hooked to actual provider (currently preference toggles only)

