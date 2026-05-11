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

## Acceptance Criteria Status
- [x] Demo user can log in
- [x] New user can register & is auto-logged in
- [x] Forgot password flow shows success message
- [x] Protected routes redirect when unauthenticated
- [x] Logout clears token and redirects
- [x] Sidebar coming-soon items work
- [x] DEMO MODE badge visible bottom-right
- [x] `/api/openapi.json` publicly accessible
- [x] Mobile responsive

## Prioritized Backlog (Phase 2+)
### P0 (next phase)
- Track Shipment module (AWB lookup, milestone timeline)
- Ship Now wizard (origin/destination/dimensions/payment)
- Get a Quote calculator
- Schedule Pickup form

### P1
- My Shipments list with filtering
- Address Book CRUD
- Invoices list + PDF stub
- Real PGK billing/account balance integration mock

### P2
- Reports dashboard with charts (recharts already installed)
- Customs documents generation
- Settings module (profile, password change, notifications)
- Email integration for real forgot-password
- Swap typographic logo for official DHL asset when user provides it
