"""DHL PNG Demo - Parts A-E backend tests (schemas matched to actual API)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"
DEMO_EMAIL = "demo@dhlpng.com"
DEMO_PWD = "Demo@2026"
DEMO_AWB = "DHL1234567890"
CARD_OK = "4111111111111111"
CARD_DECLINE = "4000000000000002"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def token(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PWD}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code}")
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ===== Auth Profile / Password =====
class TestAuthProfile:
    def test_me_get(self, session, auth):
        r = session.get(f"{API}/auth/me", headers=auth, timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL

    def test_me_update(self, session, auth):
        r = session.put(f"{API}/auth/me", headers=auth, json={
            "firstName": "Demo", "lastName": "User",
            "companyName": "PNG Logistics Co", "phone": "+675 7000 0000"
        }, timeout=10)
        assert r.status_code == 200
        assert r.json().get("firstName") == "Demo"

    def test_password_wrong_current(self, session, auth):
        r = session.put(f"{API}/auth/password", headers=auth, json={
            "currentPassword": "WRONG_PWD", "newPassword": "Demo@2026X"
        }, timeout=10)
        assert r.status_code in (400, 401, 403, 422)

    def test_password_correct_and_revert(self, session, auth):
        r = session.put(f"{API}/auth/password", headers=auth, json={
            "currentPassword": DEMO_PWD, "newPassword": "Demo@2026X"
        }, timeout=10)
        assert r.status_code in (200, 204), r.text
        r2 = session.put(f"{API}/auth/password", headers=auth, json={
            "currentPassword": "Demo@2026X", "newPassword": DEMO_PWD
        }, timeout=10)
        assert r2.status_code in (200, 204)


# ===== Quotes =====
class TestQuotes:
    def test_three_options_pgk(self, session, auth):
        payload = {
            "originCountry": "PG", "originCity": "POM",
            "destinationCountry": "AU", "destinationCity": "SYD",
            "weightKg": 5.0,
            "dimensions": {"lengthCm": 30, "widthCm": 20, "heightCm": 15},
            "pieces": 1,
        }
        r = session.post(f"{API}/quotes", headers=auth, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        opts = d.get("options") or d.get("services") or []
        assert len(opts) >= 3, f"got {len(opts)} options"
        assert "chargeableKg" in d
        assert "volumetricKg" in d
        assert "distanceFactor" in d
        first = opts[0]
        assert any(k in first for k in ("pricePGK", "priceK", "price"))


# ===== Addresses =====
class TestAddresses:
    created_id = None

    def test_list(self, session, auth):
        r = session.get(f"{API}/addresses", headers=auth, timeout=10)
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        assert len(items) >= 4

    def test_create(self, session, auth):
        r = session.post(f"{API}/addresses", headers=auth, json={
            "label": "TEST_Addr", "name": "Test", "company": "TEST Co",
            "address": "1 Test St", "city": "POM", "country": "PG",
            "postalCode": "111", "phone": "+675 1", "email": "t@x.com",
        }, timeout=10)
        assert r.status_code in (200, 201), r.text
        TestAddresses.created_id = r.json().get("id") or r.json().get("_id")
        assert TestAddresses.created_id

    def test_update(self, session, auth):
        aid = TestAddresses.created_id
        if not aid:
            pytest.skip("no id")
        r = session.put(f"{API}/addresses/{aid}", headers=auth, json={
            "label": "TEST_Updated", "name": "Test 2", "company": "TEST",
            "address": "2 St", "city": "POM", "country": "PG",
            "postalCode": "222", "phone": "+675 2", "email": "t2@x.com"
        }, timeout=10)
        assert r.status_code in (200, 204), r.text

    def test_default_toggle(self, session, auth):
        aid = TestAddresses.created_id
        if not aid:
            pytest.skip("no id")
        # Try different payload shapes - role-based
        for body in ({"role": "sender"}, {"sender": True}, {"isDefaultSender": True}):
            r = session.put(f"{API}/addresses/{aid}/default", headers=auth, json=body, timeout=10)
            if r.status_code in (200, 204):
                return
        pytest.fail(f"default toggle failed: last={r.status_code} {r.text}")

    def test_delete(self, session, auth):
        aid = TestAddresses.created_id
        if not aid:
            pytest.skip("no id")
        r = session.delete(f"{API}/addresses/{aid}", headers=auth, timeout=10)
        assert r.status_code in (200, 204)


# ===== Pickups =====
class TestPickups:
    created_id = None

    def test_list(self, session, auth):
        r = session.get(f"{API}/pickups", headers=auth, timeout=10)
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        assert len(items) >= 3

    def test_create_with_confirmation(self, session, auth):
        r = session.post(f"{API}/pickups", headers=auth, json={
            "addressSnapshot": {"name": "Test", "company": "TEST", "address": "1 St",
                                "city": "POM", "country": "PG", "postalCode": "111",
                                "phone": "+675 1", "email": "t@x.com"},
            "packageCount": 1,
            "totalWeightKg": 5.0,
            "scheduledDate": "2026-06-15",
            "scheduledWindow": "09:00-12:00",
            "notes": "TEST_PICKUP",
        }, timeout=10)
        assert r.status_code in (200, 201), r.text
        d = r.json()
        TestPickups.created_id = d.get("id") or d.get("_id")
        conf = d.get("confirmationNumber") or d.get("confirmation") or ""
        assert conf.startswith("PU"), f"conf={conf}"

    def test_cancel(self, session, auth):
        pid = TestPickups.created_id
        if not pid:
            pytest.skip("no id")
        r = session.delete(f"{API}/pickups/{pid}", headers=auth, timeout=10)
        assert r.status_code in (200, 204)


# ===== Payments =====
class TestPayments:
    def test_success(self, session, auth):
        r = session.post(f"{API}/payments/charge", headers=auth, json={
            "cardNumber": CARD_OK, "expMonth": 12, "expYear": 2030, "cvv": "123",
            "amountPGK": 100.0, "cardholderName": "Demo User"
        }, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status", "").upper() in ("SUCCESS", "SUCCEEDED", "APPROVED")
        assert "referenceNumber" in d or "reference" in d
        assert d.get("last4") == "1111"

    def test_decline(self, session, auth):
        r = session.post(f"{API}/payments/charge", headers=auth, json={
            "cardNumber": CARD_DECLINE, "expMonth": 12, "expYear": 2030, "cvv": "123",
            "amountPGK": 100.0, "cardholderName": "Demo User"
        }, timeout=10)
        assert r.status_code in (200, 402), r.text
        st = (r.json().get("status") or "").upper()
        assert st in ("DECLINED", "FAILED", "DECLINE") or r.status_code == 402

    def test_invalid_luhn(self, session, auth):
        r = session.post(f"{API}/payments/charge", headers=auth, json={
            "cardNumber": "4111111111111112", "expMonth": 12, "expYear": 2030,
            "cvv": "123", "amountPGK": 50.0, "cardholderName": "Demo User"
        }, timeout=10)
        assert r.status_code in (200, 400, 422)
        if r.status_code == 200:
            assert (r.json().get("status") or "").upper() != "SUCCESS"


# ===== Shipments + Label PDF =====
class TestShipmentsAndLabel:
    def test_label_pdf_for_demo_awb(self, session, auth):
        """Recent fix: labels_module.py ImageReader usage."""
        r = session.get(f"{API}/shipments/{DEMO_AWB}/label.pdf", headers=auth, timeout=20)
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:200]}"
        assert r.content[:4] == b"%PDF"
        assert len(r.content) > 5000, f"too small: {len(r.content)}"

    def test_create_shipment(self, session, auth):
        r = session.post(f"{API}/shipments", headers=auth, json={
            "sender": {"name": "TEST Sender", "company": "TEST Co", "address": "1 St",
                       "city": "POM", "country": "PG", "postalCode": "111",
                       "phone": "+675 1", "email": "s@x.com"},
            "receiver": {"name": "TEST Receiver", "company": "TEST Co", "address": "2 St",
                         "city": "SYD", "country": "AU", "postalCode": "2000",
                         "phone": "+61 1", "email": "r@x.com"},
            "package": {"pieces": 1, "weightKg": 3.0,
                        "dimensions": {"l": 20, "w": 15, "h": 10},
                        "description": "TEST", "declaredValueUSD": 100},
            "service": "EXPRESS_WORLDWIDE",
        }, timeout=15)
        assert r.status_code in (200, 201), r.text
        awb = r.json().get("awb") or r.json().get("trackingNumber")
        assert awb and awb.startswith("DHL")


# ===== Invoices =====
class TestInvoices:
    invoice_number = None
    unpaid_number = None

    def test_list(self, session, auth):
        r = session.get(f"{API}/invoices", headers=auth, timeout=10)
        assert r.status_code == 200
        body = r.json()
        items = body if isinstance(body, list) else body.get("items", [])
        assert len(items) >= 8, f"got {len(items)}"
        TestInvoices.invoice_number = items[0].get("number") or items[0].get("invoiceNumber")
        for i in items:
            if (i.get("status") or "").upper() == "UNPAID":
                TestInvoices.unpaid_number = i.get("number") or i.get("invoiceNumber")
                break
        statuses = [(i.get("status") or "").upper() for i in items]
        assert statuses.count("PAID") >= 1
        assert "UNPAID" in statuses

    def test_get(self, session, auth):
        if not TestInvoices.invoice_number:
            pytest.skip("no inv")
        r = session.get(f"{API}/invoices/{TestInvoices.invoice_number}", headers=auth, timeout=10)
        assert r.status_code == 200

    def test_pdf(self, session, auth):
        if not TestInvoices.invoice_number:
            pytest.skip("no inv")
        r = session.get(f"{API}/invoices/{TestInvoices.invoice_number}/pdf", headers=auth, timeout=15)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"

    def test_pay_flips_status(self, session, auth):
        if not TestInvoices.unpaid_number:
            pytest.skip("no unpaid")
        r = session.post(f"{API}/invoices/{TestInvoices.unpaid_number}/pay", headers=auth, json={
            "cardNumber": CARD_OK, "expMonth": 12, "expYear": 2030,
            "cvv": "123", "cardholderName": "Demo User"
        }, timeout=15)
        assert r.status_code == 200, r.text
        r2 = session.get(f"{API}/invoices/{TestInvoices.unpaid_number}", headers=auth, timeout=10)
        assert (r2.json().get("status") or "").upper() == "PAID"


# ===== Reports =====
class TestReports:
    def test_overview_has_all_keys(self, session, auth):
        r = session.get(f"{API}/reports/overview", headers=auth, timeout=10)
        assert r.status_code == 200
        d = r.json()
        # Per spec: monthlySpend(6m), shipmentsByService, shipmentsByStatus, topDestinations, dailyVolume
        for k in ("monthlySpend", "shipmentsByService", "shipmentsByStatus", "topDestinations"):
            assert k in d, f"missing key: {k}"
        assert len(d["monthlySpend"]) == 6
        # dailyVolume is required per spec
        assert "dailyVolume" in d, f"SPEC VIOLATION: 'dailyVolume' missing. Keys: {list(d.keys())}"

    def test_pdf(self, session, auth):
        r = session.get(f"{API}/reports/pdf", headers=auth, timeout=20)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"


# ===== Customs =====
class TestCustoms:
    created_id = None

    def test_create(self, session, auth):
        r = session.post(f"{API}/customs", headers=auth, json={
            "docType": "COMMERCIAL_INVOICE",
            "shipmentAwb": DEMO_AWB,
            "exporter": {"name": "TEST Exp", "company": "TEST", "address": "1 St",
                         "city": "POM", "country": "PG", "postalCode": "111",
                         "phone": "+675 1", "email": "e@x.com"},
            "importer": {"name": "TEST Imp", "company": "TEST", "address": "2 St",
                         "city": "SYD", "country": "AU", "postalCode": "2000",
                         "phone": "+61 1", "email": "i@x.com"},
            "items": [{"description": "Sample", "quantity": 2, "unitValue": 50,
                       "weightKg": 1.0, "countryOfOrigin": "PG", "hsCode": "1234.56"}],
            "currency": "USD",
            "signedBy": "Demo User",
        }, timeout=10)
        assert r.status_code in (200, 201), r.text
        TestCustoms.created_id = r.json().get("id") or r.json().get("_id")
        assert TestCustoms.created_id

    def test_list(self, session, auth):
        r = session.get(f"{API}/customs", headers=auth, timeout=10)
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        assert len(items) >= 1

    def test_pdf(self, session, auth):
        if not TestCustoms.created_id:
            pytest.skip("no id")
        r = session.get(f"{API}/customs/{TestCustoms.created_id}/pdf", headers=auth, timeout=15)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"


# ===== Notifications =====
class TestNotifications:
    def test_get(self, session, auth):
        r = session.get(f"{API}/notifications/preferences", headers=auth, timeout=10)
        assert r.status_code == 200

    def test_put(self, session, auth):
        r = session.put(f"{API}/notifications/preferences", headers=auth, json={
            "email": True, "sms": False, "push": True
        }, timeout=10)
        assert r.status_code in (200, 204)


# ===== Public OpenAPI =====
class TestPublic:
    def test_openapi_no_auth(self, session):
        r = session.get(f"{API}/openapi.json", timeout=10)
        assert r.status_code == 200
        assert "paths" in r.json()
