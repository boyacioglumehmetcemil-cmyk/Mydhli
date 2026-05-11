# Auth Testing Instructions — DHL Express PNG Demo

## Quick Login Flow (Recommended)
The simplest way to test protected routes is to **let the UI do the login**:

1. Navigate to `/login`
2. Fill `data-testid="login-email-input"` with `demo@dhlpng.com`
3. Fill `data-testid="login-password-input"` with `Demo@2026`
4. Click `data-testid="login-submit-button"`
5. Browser auto-redirects to `/dashboard` and the JWT is persisted to `localStorage` under key `dhl_auth_token`.

## Direct localStorage Injection (Faster for E2E)

If you want to skip the login form and jump straight to a protected page, inject the JWT via localStorage **before** visiting `/dashboard`:

### Steps (Playwright)
```python
# 1. Fetch a token via the API
import requests
backend = os.environ["REACT_APP_BACKEND_URL"]  # or hardcode preview URL
resp = requests.post(
    f"{backend}/api/auth/login",
    json={"email": "demo@dhlpng.com", "password": "Demo@2026"},
)
token = resp.json()["access_token"]

# 2. Navigate to landing first so localStorage is on the right origin
await page.goto(f"{backend}/")

# 3. Inject the token
await page.evaluate(f'localStorage.setItem("dhl_auth_token", "{token}")')

# 4. NOW navigate to a protected route — AuthContext will pick up the token
await page.goto(f"{backend}/dashboard")
```

### Important Notes
- `dhl_auth_token` is the EXACT localStorage key — case-sensitive.
- Token value is the raw JWT string (no JSON wrap, no `Bearer ` prefix).
- AuthContext runs `/api/auth/me` on mount to validate. If the token is invalid or expired, the user is redirected to `/login` automatically.
- To log out for the next test, either:
  - Click `data-testid="account-dropdown-trigger"` → `data-testid="dropdown-logout"`
  - Or call `await page.evaluate('localStorage.removeItem("dhl_auth_token")')` and reload.

## API Smoke Tests (curl)
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Health
curl -s "$API_URL/api/"

# OpenAPI schema (must be publicly accessible)
curl -s "$API_URL/api/openapi.json" | python3 -c "import sys,json; print(list(json.load(sys.stdin)['paths'].keys()))"

# Login
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@dhlpng.com","password":"Demo@2026"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
echo "$TOKEN"

# /me with token
curl -s -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Forgot-password (mock)
curl -s -X POST "$API_URL/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"someone@example.com"}'

# Logout
curl -s -X POST "$API_URL/api/auth/logout" -H "Authorization: Bearer $TOKEN"
```

## Key Test IDs to Target

### Landing (`/`)
- `landing-navbar`, `brand-logo`, `navbar-signin-btn`, `navbar-openaccount-btn`
- `hero-headline`, `hero-track-input`, `hero-track-submit`, `hero-ship-cta`, `hero-signin-link`
- `feature-card-0`, `feature-card-1`, `feature-card-2`
- `cta-open-account`, `cta-signin`, `landing-footer`

### Login (`/login`)
- `login-form`, `login-email-input`, `login-password-input`, `login-toggle-password`
- `login-remember-checkbox`, `login-forgot-link`, `login-submit-button`
- `login-register-link`

### Register (`/register`)
- `register-form`, `register-firstname-input`, `register-lastname-input`,
  `register-email-input`, `register-password-input`, `register-confirm-password-input`,
  `register-company-input`, `register-phone-input`, `register-tnc-checkbox`,
  `register-submit-button`, `register-signin-link`, `password-strength`

### Forgot Password (`/forgot-password`)
- `forgot-form`, `forgot-email-input`, `forgot-submit-button`
- `forgot-success` (post-submit), `forgot-back-to-login`, `forgot-return-link`

### Dashboard (`/dashboard`)
- `dashboard-page`, `dashboard-header`, `dashboard-sidebar`, `dashboard-main`
- `dashboard-search`, `notification-bell`
- `account-dropdown-trigger`, `account-dropdown-menu`, `dropdown-settings`, `dropdown-logout`
- `sidebar-link-dashboard`, `sidebar-link-track-shipment`, `sidebar-link-ship-now`,
  `sidebar-link-get-a-quote`, `sidebar-link-schedule-pickup`, `sidebar-link-my-shipments`,
  `sidebar-link-address-book`, `sidebar-link-invoices`, `sidebar-link-reports`,
  `sidebar-link-customs-documents`, `sidebar-link-settings`
- KPI cards: `kpi-active-shipments`, `kpi-pending-pickups`, `kpi-this-month-spend`, `kpi-account-balance`
- Quick actions: `quick-ship-now`, `quick-track`, `quick-quote`, `quick-pickup`
- Empty state: `recent-shipments-empty`, `empty-state-ship-now`
- `mobile-sidebar-toggle` (mobile only)

### Coming Soon pages (`/dashboard/*`)
- `coming-soon-page`, `coming-soon-icon`, `coming-soon-notify`, `coming-soon-back`

### Tracking (`/track`, `/track/:awb`) — PUBLIC
- `track-headline`, `track-form`, `track-input`, `track-submit`, `demo-awb-button`
- `track-loading`, `track-notfound`, `track-retry`, `track-network-error`, `track-network-retry`
- `tracking-detail`, `status-banner`, `route-visual`, `milestone-timeline`, `timeline-dot-{idx}`

### My Shipments (`/dashboard/shipments`)
- `shipments-page`, `shipments-count`
- `shipments-search-input`, `shipments-status-filter`, `shipments-date-from`, `shipments-date-to`, `shipments-reset-filters`
- `shipments-loading`, `shipments-empty`, `shipments-empty-reset`
- `shipments-table` (desktop), `shipments-cards` (mobile)
- `shipment-row-{awb}`, `shipment-card-{awb}`
- `shipments-pagination`, `shipments-page-prev`, `shipments-page-next`

### Shipment Detail (`/dashboard/shipments/:awb`)
- `shipment-detail-page`, `shipment-detail-loading`, `shipment-detail-notfound`
- `shipment-back-link`, `breadcrumb-shipments`
- `action-download-label`, `action-schedule-pickup`, `action-get-help`
- Reuses `tracking-detail`, `status-banner`, `route-visual`, `milestone-timeline`

### Status badges (reused everywhere)
- `status-badge-{status-lowercase}` — e.g. `status-badge-in_transit`, `status-badge-delivered`

### Dashboard Recent Shipments
- `recent-shipments-loading`, `recent-shipments-empty`
- `recent-shipments-table` (desktop), `recent-shipments-cards` (mobile)
- `recent-row-{awb}`, `view-all-shipments`

### Global
- `demo-mode-badge` (fixed bottom-right on every page)
