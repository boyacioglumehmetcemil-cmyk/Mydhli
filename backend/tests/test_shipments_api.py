"""Phase 2 — Shipments API tests for DHL Express PNG demo.
Covers: public /api/track/{awb}, auth-only /api/shipments list, detail, filters, pagination.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://dhl-logistics-pg.preview.emergentagent.com").rstrip("/")
DEMO_EMAIL = "demo@dhlpng.com"
DEMO_PASSWORD = "Demo@2026"
DEMO_AWB = "DHL1234567890"


@pytest.fixture(scope="session")
def auth_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# ============ PUBLIC TRACKING ============
class TestPublicTrack:
    def test_public_track_demo_awb_returns_scrubbed(self):
        r = requests.get(f"{BASE_URL}/api/track/{DEMO_AWB}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["awb"] == DEMO_AWB
        assert data["status"] == "IN_TRANSIT"
        assert data["origin"]["code"] == "POM"
        assert data["destination"]["code"] == "SYD"
        # Scrubbed sender
        assert set(data["sender"].keys()) == {"city", "country"}
        assert set(data["receiver"].keys()) == {"city", "country"}
        # No PII keys
        for forbidden in ("name", "company", "address", "phone", "email", "postalCode"):
            assert forbidden not in data["sender"]
            assert forbidden not in data["receiver"]
        # Package summary only
        pkg_keys = set(data["package"].keys())
        assert pkg_keys == {"pieces", "weightKg"}, f"Unexpected pkg keys: {pkg_keys}"
        # No costPGK / userId
        assert "costPGK" not in data
        assert "userId" not in data
        # Events present
        assert isinstance(data["events"], list)
        assert len(data["events"]) > 0

    def test_public_track_invalid_awb_404(self):
        r = requests.get(f"{BASE_URL}/api/track/INVALID_AWB_XYZ")
        assert r.status_code == 404

    def test_public_track_no_auth_required(self):
        # No Authorization header — must still work
        r = requests.get(f"{BASE_URL}/api/track/{DEMO_AWB}", headers={})
        assert r.status_code == 200


# ============ AUTH SHIPMENTS LIST ============
class TestShipmentsList:
    def test_list_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/shipments")
        assert r.status_code in (401, 403)

    def test_list_default_pagination(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/shipments", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 25
        assert data["page"] == 1
        assert data["pageSize"] == 20
        assert len(data["items"]) == 20

    @pytest.mark.parametrize("status,expected", [
        ("IN_TRANSIT", 8),
        ("DELIVERED", 5),
        ("PENDING", 2),
        ("ON_HOLD", 2),
        ("EXCEPTION", 1),
        ("OUT_FOR_DELIVERY", 4),
        ("PICKED_UP", 3),
    ])
    def test_list_filter_status(self, auth_headers, status, expected):
        r = requests.get(f"{BASE_URL}/api/shipments", headers=auth_headers, params={"status": status})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == expected, f"status={status}: got total={data['total']}, expected {expected}"
        for it in data["items"]:
            assert it["status"] == status

    def test_list_search_sydney(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/shipments", headers=auth_headers, params={"search": "Sydney"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 1
        # Demo AWB present
        awbs = [i["awb"] for i in data["items"]]
        assert DEMO_AWB in awbs

    def test_list_pagination_page2(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/shipments", headers=auth_headers, params={"page": 2, "pageSize": 10})
        assert r.status_code == 200
        data = r.json()
        assert data["page"] == 2
        assert data["pageSize"] == 10
        assert data["total"] == 25
        assert len(data["items"]) == 10


# ============ AUTH SHIPMENTS DETAIL ============
class TestShipmentDetail:
    def test_detail_no_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/shipments/{DEMO_AWB}")
        assert r.status_code in (401, 403)

    def test_detail_full_pii(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/shipments/{DEMO_AWB}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["awb"] == DEMO_AWB
        # PII fields present
        for f in ("name", "company", "address", "phone", "email", "postalCode"):
            assert f in data["sender"] and data["sender"][f]
            assert f in data["receiver"] and data["receiver"][f]
        # Cost
        assert data["costPGK"] > 0
        # Package full
        assert "dimensions" in data["package"]
        assert "declaredValueUSD" in data["package"]
        assert "description" in data["package"]
        # Status + route
        assert data["status"] == "IN_TRANSIT"
        assert data["origin"]["code"] == "POM"
        assert data["destination"]["code"] == "SYD"

    def test_detail_invalid_awb_returns_404(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/shipments/INVALID_AWB_XYZ", headers=auth_headers)
        assert r.status_code == 404


# ============ REGRESSION ============
class TestRegression:
    def test_login_still_works(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_me_with_token(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL
