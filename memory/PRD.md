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


---

## Phase 8.2.2 — Freight mode content sections on Landing — 2026-05-14
- **Goal:** Inject three large content sections (Air, Ocean, Road) into the public Landing page to mirror DHL master-site architecture, with original copy and brand-strict styling.
- **Files changed:**
  - `/app/frontend/src/pages/Landing.jsx`
    - Added `<FreightModeSection>` DRY component (image-left/right layout, eyebrow, headline, subhead, body, bullets, sub-cards, CTA).
    - Added 3 SVG silhouettes: `PlaneSilhouette`, `ContainerShipSilhouette`, `TruckSilhouette` (low-opacity outlines, no copyrighted assets).
    - Added 3 `<FreightModeSection>` instances under `<InfoBand>` and above `<Sustainability>`:
       1. AIR — yellow variant, plane silhouette, bullets, CTA → `/dashboard/quote?mode=AIR`.
       2. OCEAN — red variant, ship silhouette, FCL/LCL sub-cards.
       3. ROAD — navy variant, truck silhouette, bullets, CTA → `/dashboard/quote?mode=ROAD`.
    - Added `Container` and `Boxes` lucide-react imports for FCL/LCL sub-cards.
  - `/app/frontend/src/pages/Quote.jsx`
    - Reads `?mode=AIR|OCEAN|ROAD` from URL via `useSearchParams`.
    - Eyebrow now appends mode label (e.g. "myDHLi · Quote · Air freight").
    - Header body adapts: "You came in focused on air freight — see how it compares to the other two modes below."
    - Multi-mode comparison strip still renders all three modes side by side (Fastest/Cheapest/Greenest badges retained).
- **Brand compliance:**
  - Strict Sentence case headlines.
  - Only approved hex codes: `#FFCC00` (yellow), `#D40511` (red), `#006B3F` (green), navy ink.
  - Original copy — no verbatim text from DHL master site.
- **Verification:**
  - All 3 sections render with correct CTAs (verified via screenshot tool).
  - Quote `?mode=AIR` URL reads correctly and updates eyebrow + body copy.
  - Lint clean on Landing.jsx.

## Phase 8.2.2 deferred / next phase items
- P1 — Mobile landing parity: `/app/mobile/app/index.tsx` still uses Phase 8.1 hero. Needs the new 6-section structure for parity.
- P1 — Phase 8.3: 12 PDF document generators (backend `document_generator.py`).
- P1 — Phase 8.3: Brand Claim ("Excellence. Simply delivered.") in PDF footers + Login screen.
- P2 — Remove Papua New Guinea lock from Register country dropdown.
- P2 — Quote page currency default: switch `formatPGK` to `formatUSD` per global Brand Guide (still showing "K" prefix).
- P2 — Real Search modal functionality (currently a stub).
- P3 — Clean up orphan landing components in `/app/frontend/src/components/landing/` (DHLHeader, PngFlagSvg, RichFooter, etc.).

## Phase 8.2.2 — Bug fix pass — 2026-05-14
Two bugs caught by tester, both resolved.

### Bug 1 — OCEAN section had no CTA
- **Fix:** Added `cta={{ label: "Explore ocean freight", href: "/dashboard/quote?mode=OCEAN" }}` to the OCEAN `<FreightModeSection>` in `Landing.jsx`.
- `<FreightModeSection>` already renders `bullets`, `subCards`, and `cta` blocks independently (no suppression), so adding the prop alone shipped the button below the FCL/LCL sub-cards as required.
- **Verified:** screenshot tool — `data-testid="mode-cta-ocean"` text "Explore ocean freight", href `/dashboard/quote?mode=OCEAN`.

### Bug 2 — `?mode=X` lost through logged-out CTA → login → quote flow
- **Root cause:** `ProtectedRoute` was passing only `location` via React Router `state`, and `Login.jsx` read only `location.state.from.pathname` — search/hash were dropped.
- **Fix path:** moved redirect intent to `?next=` query param so it survives reloads and shared links.
  - `ProtectedRoute.jsx` now builds: `/login?next=${encodeURIComponent(pathname + search + hash)}` and `<Navigate>` to it.
  - `Login.jsx` reads `searchParams.get("next")`, validates with a safe-redirect helper, and falls back to `/dashboard`.
- **Open-redirect protection** (`resolveNext()` in `Login.jsx`):
  - Whitelist regex: `^/(?!\/)` — must start with `/`, but 2nd char MUST NOT be another `/`.
  - Rejects: `https://evil.com`, `//evil.com`, `\\evil.com`, `javascript:…`, anything that doesn't decode to a relative path.
  - Decodes with `decodeURIComponent`, wrapped in try/catch (malformed URI → null → /dashboard fallback).
  - Strips entries containing `\` (browsers may normalize `\\` to `//`).

### Verification (all 5 acceptance criteria)
1. ✅ OCEAN CTA visible and routes to `/dashboard/quote?mode=OCEAN`.
2. ✅ Round-trip tested for all 3 modes (AIR / OCEAN / ROAD):
   - Guard redirect URL: `/login?next=%2Fdashboard%2Fquote%3Fmode%3DAIR` (and equivalents)
   - Post-login destination: `/dashboard/quote?mode=AIR` (etc.) with eyebrow correctly showing mode name.
3. ✅ Open-redirect: `?next=https://evil.com` and `?next=//evil.com` both rejected → fallback to `/dashboard`.
4. ✅ Backend pytest: **119 passed, 1 skipped** (unchanged — only frontend touched).
5. ✅ Direct deep-link `/dashboard/quote?mode=ROAD` still works for authed users.

### Files changed (this pass)
- `frontend/src/pages/Landing.jsx` (1-line cta prop addition)
- `frontend/src/components/ProtectedRoute.jsx` (Navigate target rewritten)
- `frontend/src/pages/Login.jsx` (added `resolveNext` helper + searchParams read)


## Phase 8.4 — Address Book Rebrand + Internal Track + P2 Polish — 2026-05-17

Final B2B polish pass turning the leftover B2C surfaces into proper Global
Forwarding screens.

### Address Book → Parties (`/dashboard/addresses`)
- **`pages/Addresses.jsx`** rewritten as a table-style **Parties** directory:
  - Title: "Parties" · Subhead: "Your shipper, consignee and notify-party directory — autofill any booking or HBL in a single click."
  - Tabs with counts: All / Shippers / Consignees / Notify Parties
  - Each row shows: role tag (yellow=Shipper, ink=Consignee, gray=Notify),
    company / contact, address, country flag + code, phone, edit/delete actions.
  - Free-text search across company, city, country.
  - Create / Edit modal now exposes a **Role** dropdown (SHIPPER / CONSIGNEE / NOTIFY)
    that gets persisted both as an explicit `role` field and as legacy
    `isDefaultSender` / `isDefaultReceiver` flags for backward-compat.

### Address seed v2 (`backend/address_seed.py`)
- Replaced unversioned legacy records with structured v2 entries that carry
  an explicit `role` field (SHIPPER / CONSIGNEE / NOTIFY) — 6 records per user.
- New `SEED_VERSION` stamp drives automatic clear-and-reseed when the schema
  changes; idempotent once the user has v2 records.
- Demo user now seeded with 2 Shippers (PNG Logistics HQ + Lae warehouse),
  2 Consignees (AU Sydney + NZ Auckland), 2 Notify Parties (AU Brisbane + SG).

### Settings — strict 4-tab layout (`pages/Settings.jsx`)
- Tabs reduced from 5 to exactly: **Profile · Notifications · Account Security · Billing**
- Profile pane now also hosts the Company subsection (name + display
  currency), removing the redundant "Business" tab.
- New **Billing** placeholder pane (Coming Q2 2026) explaining the upcoming
  self-service portal — payment methods, statements, billing contacts.
- "API Access" pane removed — collapsed into a future enterprise track.

### Internal Track page (`pages/DashboardTrack.jsx`)
- New `/dashboard/track` and `/dashboard/track/:awb` routes inside the
  authenticated dashboard chrome (sidebar + topbar preserved).
- Accepts `?ref=` query param so dashboard search and notification links can
  deep-link straight to a result.
- Three states: empty placeholder ("Start tracking"), result (TrackingDetail
  with `mode="dashboard"`), and not-found / network-error.
- The public `/track` page remains untouched for marketing visitors.
- `App.js`: replaced `<Navigate to="/track" />` with `<Route element={<DashboardTrack/>} />`.
- Unused `Navigate` import removed.

### P2 Safety — legacy demo seeders (`shipments_module.py`)
- `seed_shipments`: guard tightened from `existing >= 25` to `existing >= 1`
  so the legacy 25-shipment mock set can never overwrite the 57 real
  ocean-freight records produced by `seed/seed_57_shipments.py`.
- `seed_shipper_shipments`: same `>= 1` guard applied to the 6-record set.
- Startup log lines now clearly state "legacy seeder will not overwrite. Skipping."

### Verification
- Address re-seed log: `Cleared 4 legacy address records for demo@dhlpng.com to re-seed at v2.` → `Inserted 6 address records for demo@dhlpng.com (v2).`
- Public `/track` page: HTTP 200 (no regression).
- Backend `/api/track/DHL-SWB-029`: 200 OK with full timeline.
- `/api/track/DHL-NONEXISTENT-999`: 404 (expected → renders not-found state).
- Lint clean: `frontend/src/pages` + `backend/address_seed.py`.

### Files changed (this pass)
- `frontend/src/pages/Addresses.jsx` (rewritten — table layout, role tags)
- `frontend/src/pages/Settings.jsx` (rewritten — 4 strict tabs)
- `frontend/src/pages/DashboardTrack.jsx` (NEW)
- `frontend/src/App.js` (route swap + Navigate import removal)
- `backend/address_seed.py` (rewritten — v2 schema + auto-migrate)
- `backend/shipments_module.py` (legacy seeder guards tightened)
- `memory/test_credentials.md` (updated seeded-data line)


## Phase 8.4c — Synthetic Document Generation — REVERTED — 2026-05-17

> User rejected the synthetic PDF pipeline: "BU OLMAMIS COK BOKTAN DURUYOR".
> Pitch demo must show ONLY authentic anonymised operational paperwork.

### What was removed
- **Backend endpoint `POST /api/shipments/{ref}/generate-documents`** → 404
- **Backend endpoint `GET /api/document-templates`** → 404
- `backend/forwarding_doc_generator.py` (docxtpl + LibreOffice renderer) — file **deleted**
- `backend/templates/forwarding/*.docx` (9 generic master templates) — **deleted**
- `backend/scripts/apply_logo_to_sample_shipments.py` (PyMuPDF logo overlay) — **deleted**
- `backend/scripts/generate_master_templates.py` (template producer) — **deleted**
- `frontend/src/components/documents/DocumentsGenerateModal.jsx` — **deleted**
- DocumentsSection "Generate" button + `generateOpen` state + Sparkles import — **removed**
- Python deps `docxtpl`, `python-docx` — removed from `requirements.txt` + pip uninstalled
- Logo asset `/app/uploads/dhl_brand_assets/` — directory **deleted**
- DB cleanup: 4 leftover `tags: auto_generated` DRAFT documents purged with their files

### How the 43 overlaid PDFs were restored
For the 5 pitch-priority shipments (SWB-001, 007, 029, 047, 055) the existing
`document_filler.anonymize_pdf()` pipeline was re-run against the original
source PDFs in `/app/uploads/dhl_57_shipments/{ref}_{Status}/`. The DB
`document_id` and `file_path` values were preserved; only the file contents
were rewritten back to the byte-for-byte equivalent of the Phase 8.3b anonymised
output. The `DHL-PNG-Relogo-1` producer-metadata stamp is gone from every file.
Verification: md5+size logged for all 43 PDFs in `backend/scripts/revert_logo_overlay.py`.

### PII audit (post-revert)
Full repo grep for `Mehmet | Cemil | BOYACIOGLU` returns **0 matches**.
`EMERGENT_HANDOVER.md`, `anonymization_map.json`, `document_filler.py` all clean.

### Handover bundle for new job
Repo-clean state is documented in:
- `/app/memory/HANDOVER.md` — required reading for the next agent
- `/app/RESTORE_UPLOADS.md` — how to rebuild `/app/uploads/*` after git clone
- `/app/backend/.env.example`, `/app/frontend/.env.example` — env templates
- `.gitignore` — now ignores `.env`, large source PDFs, screenshots, test_reports

### DO NOT (until DHL ships official templates)
- Re-add `/api/shipments/{ref}/generate-documents`
- Re-add the "Generate" button to DocumentsSection
- Render synthetic PDFs from generic Jinja2 templates
- Bake a homemade DHL logo into existing PDFs



## Mobile (Expo) — Faz 6.1 + Faz 7 — 2026-05-18

### Faz 6.1 — Notifications link in More tab
- `app/(tabs)/more.tsx`: added 10th menu item between Parties and Invoices.
  - `icon: notifications-outline`, `label: Notifications`, `sub: View alerts & inbox`,
    `route: /notifications`, `testID: more-link-notifications`.
  - Made testID prop optional via `item.testID || \`more-menu-...\``.
- HeaderBell on tab header retained (not removed).
- Verified: 10 menu rows render; tapping routes to `/notifications` inbox.

### Faz 7 — Direct-to-login mobile entry + redesigned myDHLi login
- **`app/index.tsx`** rewritten as auth gate only:
  - Shows splash (`BrandWordmark` + spinner on yellow bg) while `loading`.
  - `<Redirect href="/(tabs)">` when authenticated; `<Redirect href="/login">` otherwise.
  - Removed: "Move freight worldwide" hero, stats strip, Freight forwarding PNG cards,
    Open Account / Track Shipment CTAs. No public marketing surface on mobile.
- **`app/login.tsx`** redesigned to match myDHLi reference layout:
  - Top yellow bar (`#FFCC00`, height 64): BrandWordmark left, "Contact us ↗" right (red).
  - Body: `ImageBackground` (Unsplash container-ship CDN) + `rgba(0,0,0,0.25)` overlay.
  - White login card (max 400px, radius 8, shadow): "Welcome to myDHLi" heading,
    email + password (with eye toggle), "Forgot your password?" link (red underline),
    full-width red Login button, "New to myDHLi? Open an account" link, DEMO hint.
  - Bottom footer bar (white): brand mark + "Privacy Notice · Terms of Use · Legal
    Notice · Contact us" + 🌐 PG locale pill.
  - testIDs renamed per spec: `login-email`, `login-password`, `login-password-toggle`,
    `login-submit`, `login-forgot`, `login-contact-us`, `login-footer-privacy/terms/legal`.
- Contact / policy links open `mailto:support@dhlpng.com` via `Linking.openURL`.
- No new runtime deps; backend untouched; web frontend untouched.

### Verification (Faz 7)
- ✅ `GET /` unauthenticated → redirects to `/login` (verified via screenshot tool).
- ✅ `GET /` with stored JWT in `localStorage.dhl_auth_token` → renders tabs dashboard.
- ✅ Login form (`demo@dhlpng.com` / `Demo@2026`) submits → tabs Home renders.
- ✅ ImageBackground (Unsplash container-ship URL) loads in the body.
- ✅ All 12 spec testIDs present in DOM.
- ✅ `grep -ri "[Gg]enerate" /app/mobile/app /app/mobile/src` = 0.
- ✅ `yarn tsc --noEmit`: 20 errors (baseline, pre-existing in `ship.tsx`/`settings.tsx`),
  0 new errors introduced by `index.tsx` or `login.tsx`.
- ✅ Bundle: Metro restart picks up changes; preview tunnel `HTTP/2 200`.

### Files changed (Faz 7)
- `app/index.tsx` (rewritten — redirect gate)
- `app/login.tsx` (rewritten — myDHLi layout)

### Removed from mobile surface
- "Move freight worldwide" landing hero, stats strip, Freight Forwarding cards
  (entire prior `app/index.tsx` body). Not re-archived — git history is the
  reference if ever needed.


### Faz 7.1 — Official DHL Global Forwarding logo assets — 2026-05-18
- New brand assets committed under `/app/mobile/assets/brand/`:
  - `dhl_gf_horizontal.png` (256×101, aspectRatio 2.535) — top yellow bar usage.
  - `dhl_gf_stacked.png` (353×110, aspectRatio 3.209) — bottom white footer usage.
- `app/login.tsx`: `<BrandWordmark>` placeholders in top bar and footer replaced with
  `<Image source={require(...)}>` referencing the local PNG assets. Styles added:
  `topLogo` (height 36, aspectRatio 2.535) and `footerLogo` (height 40, aspectRatio 3.209).
- `app/index.tsx`: splash screen also switched to the horizontal PNG (height 64).
- `BrandWordmark` component left unchanged — still used in More-tab user card and
  other auth surfaces. The variant-prop refactor was deferred (optional in spec,
  blast radius too wide for a single login-asset task).
- Verification:
  - Both `<img>` tags resolve (`/assets/?unstable_path=...dhl_gf_horizontal.png` and
    `...dhl_gf_stacked.png`) and render at expected sizes on a 390×844 viewport.
  - `yarn tsc --noEmit`: index/login dosyalarında 0 hata; baseline 20 (pre-existing).
  - `grep -ri "[Gg]enerate" /app/mobile/app /app/mobile/src` = **0**.
  - Bundle status: `HTTP/2 200` on `/login`.
- Files changed: `app/login.tsx`, `app/index.tsx`, +2 assets.


### Faz 7.2 — Footer colour fix + PWA setup — 2026-05-18

#### Footer background match
- Measured the stacked logo PNG's own background: `rgb(242, 242, 242)` (#F2F2F2).
- `app/login.tsx`: `footerSafe.backgroundColor` and `footerBar.backgroundColor`
  switched from `Colors.white` to `#F2F2F2`. The "DHL Group" wordmark now blends
  seamlessly — no more inset-card effect. No other colour touched.

#### PWA setup
- Generated brand assets from the existing horizontal logo (yellow #FFCC00 canvas
  centered with padding):
  - `/app/mobile/assets/icon.png` (1024×1024)
  - `/app/mobile/assets/adaptive-icon.png` (1024×1024, for Android adaptive)
  - `/app/mobile/assets/favicon.png` (196×196)
  - `/app/mobile/assets/splash.png` (1284×2778)
  - `/app/mobile/assets/splash-icon.png` (400×400, for expo-splash-screen plugin)
- `/app/mobile/app.json` updated:
  - `expo.icon` → `./assets/icon.png`
  - `expo.android.adaptiveIcon.foregroundImage` → `./assets/adaptive-icon.png`,
    `backgroundColor` → `#FFCC00`
  - `expo.web` now carries `name`, `shortName`, `lang`, `scope`, `startUrl`,
    `themeColor`, `backgroundColor`, `display: standalone`, `orientation: portrait`,
    `description`.
  - `expo-splash-screen` plugin retargeted to `splash-icon.png` on yellow bg.
- Static PWA assets under `/app/mobile/public/` (served at site root by Expo):
  - `manifest.json` — full Web App Manifest with 192/512 icons + maskable.
  - `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.png`, `splash.png`.
- `app/+html.tsx` HTML template now injects:
  - `<title>myDHLi PNG · DHL Global Forwarding</title>`
  - `<meta name="theme-color" content="#FFCC00">`
  - `<meta name="apple-mobile-web-app-capable">` + `…title` (myDHLi) + status-bar
  - `<link rel="manifest" href="/manifest.json">`
  - `<link rel="icon">` 192/512 + `<link rel="apple-touch-icon">` 180
  - `<link rel="shortcut icon" href="/favicon.png">`

#### Verification
- `curl /manifest.json` → `HTTP/2 200`, `application/json`, valid Web App Manifest.
- `curl /icon-192.png /icon-512.png /favicon.png /apple-touch-icon.png` → all 200.
- DOM eval on `/login`:
  - `link[rel=manifest]` present = `true`.
  - `meta[name=theme-color]` content = `#FFCC00`.
  - `[data-testid=login-footer]` computed `background-color` = `rgb(242, 242, 242)`.
- `grep -ri "[Gg]enerate" /app/mobile/app /app/mobile/src` = **0**.
- Bundle: preview `HTTP/2 200`.

#### How user verifies "Installable" on their device
- Open the preview URL in Chrome/Edge on Android or Safari on iOS.
- Chrome: address-bar three-dot menu → **Install app** / **Add to Home Screen**.
- Safari (iOS): Share sheet → **Add to Home Screen**.
- DevTools (desktop): Application → Manifest → "Installability: Page is installable"
  (192/512 icons + theme-color + standalone all green).

#### Files changed
- `app.json` (rewritten — PWA fields)
- `app/+html.tsx` (head section augmented with manifest link + PWA meta tags)
- `app/login.tsx` (`footerSafe` + `footerBar` backgroundColor → `#F2F2F2`)
- New: `assets/{icon,adaptive-icon,favicon,splash,splash-icon}.png`
- New: `public/{manifest.json,icon-192,icon-512,apple-touch-icon,favicon,splash}.png`


### Faz 7.3 — Force light color-scheme + top bar exact match — 2026-05-18
- Reported: Android Chrome/Samsung Browser auto-inverted login under system dark mode
  (top bar brown, card black, yellow logo "card" effect).
- Measured `dhl_gf_horizontal.png` corner pixels via PIL → all `rgb(255,204,0) = #FFCC00`.
  Confirmed visual mismatch was browser auto-invert, not a colour-token discrepancy.
- **`app/+html.tsx`** — head + global CSS now blocks dark-mode auto-invert:
  - `<meta name="color-scheme" content="light only">`
  - `<meta name="supported-color-schemes" content="light">`
  - Inline `<style>`: `:root{color-scheme:light only;}`,
    `html,body{color-scheme:light only;background-color:#FFFFFF;forced-color-adjust:none;}`,
    plus a `@media (prefers-color-scheme: dark)` override that re-asserts light.
- **`app/login.tsx`** — explicit literal hexes (no token indirection):
  - `root.backgroundColor`, `topBarSafe.backgroundColor`, `topBar.backgroundColor` → `#FFCC00`
    (exact match to logo PNG bg, verified pixel-perfect via PIL).
  - `card.backgroundColor` → `#FFFFFF` (solid, no alpha).
- StatusBar already `style="dark"` in `_layout.tsx` (light icons-on-yellow is wrong
  per Apple/Material guidelines; `dark` glyphs over the yellow bar is correct).
- Other surfaces (dashboard, tabs, modals) untouched per spec.

#### Verification (Playwright + `emulate_media color_scheme=dark`)
- `prefers-color-scheme: dark` is True (emulation active).
- `meta[name=color-scheme]` = `light only`.
- `getComputedStyle(html).colorScheme` = `light only` (CSS rule wins).
- `getComputedStyle([data-testid=login-topbar]).backgroundColor` = `rgb(255, 204, 0)`.
- `getComputedStyle([data-testid=login-card]).backgroundColor` = `rgb(255, 255, 255)`.
- Screenshot under dark-prefers shows the **same light layout** — no invert.
- `grep -ri "[Gg]enerate"` = 0.
- Preview `HTTP/2 200` on `/login`.

#### Files changed
- `app/+html.tsx` (color-scheme meta + CSS)
- `app/login.tsx` (3 backgroundColor literals)


### Faz 7.4 — UI cleanup (DEMO hint + DEMO MODE badge + PG locale picker removed) — 2026-05-18
- **`app/login.tsx`**:
  - Removed `<View style={styles.demoHint}>` block (DEMO label + `demo@dhlpng.com / Demo@2026` line).
  - Removed footer `<View style={styles.localePill}>` block (globe icon + PG + chevron).
  - Removed unused styles `demoHint`, `demoHintLabel`, `demoHintText`, `localePill`, `localeText`.
- **`app/_layout.tsx`**: removed `DemoBadge` import and the `<DemoBadge />` mount at the
  root of every screen.
- **Deleted file:** `src/components/DemoBadge.tsx` (no remaining references).
- Verification:
  - `grep -ri "DEMO MODE|DemoBadge|locale-picker|Demo@2026|demo-hint|localePill|localeText" /app/mobile/app /app/mobile/src` = **0**.
  - `grep -ri "[Gg]enerate"` = **0**.
  - DOM eval on `/login`: `demoHintGone=true`, `localePickerGone=true`, `demoBadgePresent=false`;
    `cardOK`, `submitOK`, `footerOK`, `footerPrivacy`, `topbarOK`, `contactUs` all `true`.
  - DOM eval on `/` (authenticated dashboard): `demoBadgePresent=false`; KPIs + tab bar intact.
  - `yarn tsc --noEmit`: login.tsx + _layout.tsx clean (baseline unchanged).
  - Preview `HTTP/2 200`.


### Faz 7.5 — Login layout polish (logo sizing + alignment) — 2026-05-18
- Issue discovered: React Native Web does not honour `aspectRatio` style on `<Image>`
  for `require()`-loaded PNGs. Both logos were rendering at the PNG's intrinsic
  pixel width (256 px for top, 353 px for footer) on a 390 px viewport — making
  the top logo look "centered" because it filled most of the bar.
- **`app/login.tsx`** — explicit `width` + `height` (drop `aspectRatio`):
  - `topLogo`: `{ width: 92, height: 36, alignSelf: 'flex-start' }`
  - `footerLogo`: `{ width: 128, height: 40 }`
- Footer alignment for spec compliance ("links centered, same vertical axis as logo"):
  - `footerLeft`: `paddingRight: 12` removed; `alignItems: 'center'` retained.
  - `footerLinks`: added `justifyContent: 'center'`, `alignSelf: 'center'`.

#### Verification (Playwright @ 390×844)
- Topbar: logo at left=20 px, width=92 px (left-aligned per spec).
- Footer logo: `center_offset = 0 px` (exact centering).
- Footer link row (Privacy → Contact us span): `center_offset = 0 px`,
  `left_pad = 51 px`, `right_pad = 51 px` (symmetric).
- Visual: small DHL/GF wordmark top-left, "Contact us ↗" top-right, footer logo
  and 4-link row both on the same centred vertical axis.
- `grep -ri "[Gg]enerate"` = 0. Preview `HTTP/2 200`.

#### Files changed
- `app/login.tsx` (3 style entries: `topLogo`, `footerLeft`, `footerLogo`, `footerLinks`).

#### Note for next agent
- `splash` (in `app/index.tsx`) still uses `aspectRatio` for its DHL logo. Splash
  only flashes briefly during auth load; if user complaints about it later,
  switch to explicit width/height the same way.


### Faz 7.7 — "Made with Emergent" badge removed — 2026-05-18
- **Source identified:** `/app/frontend/public/index.html` lines 18 + 23-67.
  - `<script src="https://assets.emergent.sh/scripts/emergent-main.js"></script>`
  - `<a id="emergent-badge" href="https://app.emergent.sh/...">Made with Emergent</a>`
    (a hard-coded black pill `position: fixed` bottom-right, z-index 9999).
- **Method:** Hard-deleted both nodes from the HTML (not CSS-hide — clean removal).
- **Files changed:** `frontend/public/index.html` (45 lines removed).
- **Web frontend disclosure:** Faz 7.6 spec said "don't touch web frontend"; Faz 7.7
  brief explicitly permitted touching `mobile/frontend` HTML/script tags to remove
  this platform watermark. No frontend UX / source code was changed — only the
  watermark element was excised from the public HTML shell.

#### Verification
- `grep -ic "emergent"` on served `http://localhost:3000` → **0**.
- Mobile preview `/login` DOM check:
  - `#emergent-badge` element: **false**
  - "Made with Emergent" text anywhere: **false**
  - `emergent-main.js` script: **false**
- Mobile preview screenshot still shows the Faz 7.6 myDHLi.com mirror cleanly
  (yellow top bar, "Welcome to myDHLi" heading, Email/Password inputs, red
  "Login" button, DHL Group footer, "English ⌄", 4 links, copyright). No
  watermark anywhere.
- Frontend CRA dev server restarted (`supervisorctl restart frontend`) to flush
  any cached HTML. Hot reload alone did NOT pick up the public/index.html change.
- `grep -ri "[Gg]enerate"` = 0. Preview `HTTP/2 200` on both URLs.

#### Production note
- The currently deployed production at `https://merhaba-app-446.emergent.host` was
  built before this edit, so the badge may still appear there until the user
  redeploys. Preview environment is clean.


### Faz 7.6 — Login pixel-perfect mirror of myDHLi.com — 2026-05-18
- **Scope: MOBILE ONLY.** Web frontend (`/app/frontend/`) NOT touched —
  `git diff -- frontend/` returns empty.
- Reference: real myDHLi.com login screenshot supplied by user
  (`vjkvtp1u_WhatsApp%20Image%202026-05-18%20at%2013.19.41.jpeg`).
- **`app/login.tsx`** rewritten from scratch:
  - Top bar `#FFCC00`: horizontal DHL/GF logo left, "Contact us ↗" right with
    **black** text (`#000000`) — was red previously.
  - Body: pure `#FFFFFF`. ImageBackground (cargo-ship) removed. Card style
    + shadow removed — form sits directly on white.
  - Heading: "Welcome to myDHLi", 30px, weight 800, left-aligned, `#1A1A1A`.
  - Custom `<FloatingInput>` component (animated via `Animated.timing`,
    140ms transition) for Email + Password — Material-style floating label,
    1px `#CCCCCC` border, 1.5px `#333333` on focus, border-radius 2.
    Password input has `eye` toggle in trailing slot.
  - "Forgot your password?": center-aligned, **black** underlined text
    (was red).
  - Login button: `#D40511`, full-width, height 56, border-radius 4, **"Login"**
    (no `textTransform: uppercase` — literal "Login" per user spec).
  - "Open an account" link **removed** entirely.
- Footer (still inside the scroll, white bg, left-aligned items):
  - Stacked DHL Group logo (using new `dhl_gf_stacked_white.png` asset where
    the PNG's intrinsic `#F2F2F2` border has been re-coloured to `#FFFFFF` via
    PIL so it blends seamlessly with the white footer).
  - `English ⌄` locale picker (replaces previous "PG").
  - 4-link row (Privacy Notice · Terms of Use · Legal Notice · Contact us)
    separated by `columnGap: 16` (spaces, no dots).
  - Copyright: "© DHL Global Forwarding Management GmbH. All rights reserved."
    in muted `#888888` 12px.
- New asset: `assets/brand/dhl_gf_stacked_white.png` (353×110, white bg).
- `Colors` import dropped from `login.tsx` — all values are now literal hex
  for spec compliance and design isolation.

#### Verification (Playwright @ 390×844)
- All 15 testIDs present (`login-topbar`, `login-card`, `login-email`,
  `login-password`, `login-password-toggle`, `login-forgot`, `login-submit`,
  `login-footer`, `login-locale-picker`, `login-footer-privacy/terms/legal/contact`,
  `login-copyright`, `login-contact-us`).
- `_submit_text` = `"Login"` (not "LOGIN").
- `_open_account_present` = `false`.
- `_body_bg` = `rgb(255, 255, 255)`.
- Screenshot side-by-side matches reference: same yellow strip, same heading
  treatment, same form scaffolding, same footer ordering.
- `yarn tsc --noEmit`: `login.tsx` 0 errors (baseline 20 unchanged).
- `grep -ri "[Gg]enerate" /app/mobile/app /app/mobile/src` = 0.
- Preview `HTTP/2 200`.
- Demo flow still functional (`AuthContext.login` unchanged).

#### Web frontend untouched — confirmation
- `git status` shows only `mobile/app/login.tsx` as modified.
- `git diff -- frontend/` empty (no source file changes).
- `frontend/yarn.lock` is untracked since May 17 23:26 — pre-existing,
  not from this session.

#### Files changed
- `app/login.tsx` (rewrite)
- `assets/brand/dhl_gf_stacked_white.png` (new)

### Faz 7.8 — Production deploy serves mobile Expo Web bundle — 2026-05-18
- Production deploy at `https://merhaba-app-446.emergent.host` was serving the old
  `/app/frontend/` (CRA web React) app. The user's PWA install was therefore
  picking up the legacy web app, not the myDHLi mobile design.
- **Solution:** swap the frontend deploy artifact so `/app/frontend/build/` now
  contains the Expo Web export of `/app/mobile/`. Frontend React source under
  `/app/frontend/src/` left untouched (acts as legacy backup).

#### Steps performed
1. `cd /app/mobile && yarn expo export --platform web --output-dir ./dist`
   → 22 HTML routes + PWA assets at root (manifest.json, icon-192/512.png,
   apple-touch-icon.png, favicon.png, splash.png) in 48s.
2. `rm -rf /app/frontend/build && cp -r /app/mobile/dist /app/frontend/build`
   → static artifact ready for the next deploy.
3. **`frontend/package.json`** build script changed:
   ```
   "build": "if [ -d ../mobile/node_modules ]; then cd ../mobile && yarn expo export
     --platform web --output-dir ../frontend/build; else echo 'Using prebuilt
     mobile-as-web bundle in ./build/ (mobile/node_modules absent)'; fi",
   ```
   - When the deploy container has mobile deps installed → rebuilds on `yarn build`.
   - When the deploy container only installs frontend deps → uses prebuilt
     static artifact in `./build/` (idempotent, no failure).
   - Original CRA build preserved as `"build:web-legacy": "craco build"`.

#### Dynamic backend resolution (critical for prod)
`expo export` bakes `EXPO_PUBLIC_BACKEND_URL` into the bundle at build time. The
mobile `.env` points to `merhaba-app-446.preview.emergentagent.com` (preview
backend), so a naïve build would have production users hitting the preview API.
Fix: introduced `resolveBackendUrl()` in `mobile/src/lib/api.ts` that:
- Falls back to `EXPO_PUBLIC_BACKEND_URL` only when origin contains
  `.expo.preview.` or `localhost` (i.e. dev tunnel).
- Otherwise returns `window.location.origin` → same-origin API on production
  (Emergent ingress routes `/api/*` to backend at any host).
- Native (no `window`) → still uses `EXPO_PUBLIC_BACKEND_URL`.
The resolver replaces 3 other inline uses too:
- `app/document/[id].tsx`
- `app/invoices.tsx`
- `app/customs-preview/[id].tsx`

#### Verification
- `/app/frontend/build/index.html` → `<title>myDHLi PNG · DHL Global
  Forwarding</title>`, has `theme-color`, `apple-mobile-web-app-*`, `manifest`.
- `/app/frontend/build/manifest.json` → full myDHLi PWA manifest (icons,
  display: standalone, theme #FFCC00).
- `/app/frontend/build/login.html` → myDHLi login route prerendered.
- All PWA assets present at `/app/frontend/build/` root.
- No `Made with Emergent` watermark in built artifact (Faz 7.7 carryover).
- Mobile preview tunnel screenshot: login → dashboard works end-to-end (57
  shipments, 26 At Depot, $269,180 outstanding). `resolveBackendUrl()` correctly
  detects `.expo.preview.` origin and falls back to the preview API URL.
- `yarn tsc --noEmit`: all 4 modified files clean (baseline 20 unchanged).
- `grep -ri "[Gg]enerate"` = 0.

#### Files changed
- `mobile/src/lib/api.ts` (new `resolveBackendUrl()` export)
- `mobile/app/document/[id].tsx` (use resolver)
- `mobile/app/invoices.tsx` (use resolver)
- `mobile/app/customs-preview/[id].tsx` (use resolver)
- `frontend/package.json` (`build` script: idempotent mobile-web export)
- `frontend/build/*` (new — prebuilt mobile-as-web artifact, 34 files)

#### User action required
Kullanıcı Emergent dashboard'dan **Redeploy** yapması gerekiyor. Sonrası:
`https://merhaba-app-446.emergent.host` → myDHLi login açacak,
Add-to-Home-Screen PWA olarak mobile native-style yüklenecek.


### Faz 7.9 — HOTFIX: Web at root + mobile at /m/ — 2026-05-18
- **Bug introduced in Faz 7.8:** mobile bundle overwrote the entire
  `/app/frontend/build/`. PC users lost the web app and the PWA install pulled
  the wrong icon (showed "E" + hostname instead of myDHLi).
- **Correct structure now in place:**
  - `https://merhaba-app-446.emergent.host/` → CRA web frontend (PC)
  - `https://merhaba-app-446.emergent.host/m/` → Expo Web myDHLi PWA (mobile install)
- Web frontend source (`/app/frontend/src/`) was never touched in 7.8 or 7.9 —
  only the build artifact placement changed.

#### Steps
1. **Rebuild web frontend at root**
   - `rm -rf /app/frontend/build && cd /app/frontend && yarn build:web-legacy`
     (CRA build, 18s). Produces original DHL.com pixel-perfect site.
2. **Configure mobile for `/m/` baseUrl**
   - `mobile/app.json` → `expo.experiments.baseUrl: "/m"`,
     `expo.web.scope: "/m/"`, `expo.web.startUrl: "/m/"`,
     `expo.web.name: "myDHLi"`.
3. **Update mobile PWA tags** to reference `/m/` paths
   - `mobile/app/+html.tsx`: `<link rel="manifest" href="/m/manifest.json">`,
     icon hrefs `/m/icon-192.png`, `/m/icon-512.png`, `/m/apple-touch-icon.png`,
     `/m/favicon.png`. Title shortened to `myDHLi · DHL Global Forwarding`.
   - `mobile/public/manifest.json`: name "myDHLi", short_name "myDHLi",
     start_url "/m/", scope "/m/", icons at `/m/icon-192.png` (any maskable)
     and `/m/icon-512.png` (any maskable).
4. **Re-export mobile to subpath**
   - `cd /app/mobile && yarn expo export --platform web --output-dir /app/frontend/build/m`
   - All script/CSS asset srcs now correctly prefixed `/m/_expo/static/...`.
5. **`frontend/package.json` build script** updated to a 2-stage build:
   ```
   "build": "yarn build:web-root && yarn build:mobile-subpath"
   "build:web-root": "craco build"
   "build:mobile-subpath": "if [ -d ../mobile/node_modules ]; then
       cd ../mobile && yarn expo export --platform web --output-dir ../frontend/build/m;
     else echo 'Mobile node_modules absent; using prebuilt /m/ artifact'; fi"
   ```
   On redeploy: CRA builds web root → Expo exports myDHLi into `./build/m`.
   If mobile deps absent, falls back to prebuilt static artifact (no failure).
6. **Backend URL resolution unaffected**
   - `window.location.origin` returns just `https://host` (no path segment), so
     `${origin}/api` still resolves correctly from any URL — root or `/m/`.

#### Verification
- `/app/frontend/build/index.html` → DHL.com `<title>myDHLi — Track, ship and
  document freight</title>` (CRA build, `main.b6a008eb.js`, custom DHL icons).
- `/app/frontend/build/m/index.html` → `<title>myDHLi · DHL Global Forwarding</title>`,
  script `src="/m/_expo/static/js/web/entry-*.js"`, manifest `/m/manifest.json`,
  icons all `/m/...` paths, color-scheme guard, theme #FFCC00.
- `/app/frontend/build/m/manifest.json` → `name: "myDHLi"`, `short_name: "myDHLi"`,
  `start_url: "/m/"`, `scope: "/m/"`, icons at `/m/icon-192.png` and
  `/m/icon-512.png` with purpose `any maskable`.
- All 4 PWA assets present and >5KB in `/m/` directory.
- `[Gg]enerate` grep = 0.

#### Files changed
- `frontend/package.json` (split into `build:web-root` + `build:mobile-subpath`)
- `mobile/app.json` (`baseUrl: /m`, `web.scope /m/`, `web.startUrl /m/`)
- `mobile/app/+html.tsx` (all asset paths now `/m/`-prefixed; title shortened)
- `mobile/public/manifest.json` (rewrite with `/m/` scope + icon paths)
- `frontend/build/*` (CRA build → root)
- `frontend/build/m/*` (Expo Web export → subpath)

#### Kullanıcıya talimat — Redeploy gerekli
1. **Emergent dashboard → "Deploy" / "Redeploy"** butonuna bas.
2. Build pipeline `yarn build` çalıştıracak → önce CRA root web build, sonra
   mobile Expo `/m/` export.
3. Production'da test:
   - **PC tarayıcısında** `https://merhaba-app-446.emergent.host/` → DHL.com
     pixel-perfect web app açılacak.
   - **Telefon tarayıcısında** `https://merhaba-app-446.emergent.host/m/` →
     myDHLi pixel-perfect mobile (yellow top bar + login + 5-tab dashboard).
   - **Telefon Add to Home Screen** (Chrome/Safari) `/m/` URL'sinden →
     ikonda **myDHLi** sarı zemin + kırmızı DHL logo görünecek (artık "E +
     hostname" görünmeyecek).

