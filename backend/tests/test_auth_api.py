"""DHL PNG Demo - Auth API backend tests (Phase 1)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://cargo-connect-416.preview.emergentagent.com").rstrip("/")
# Fallback: read from frontend .env if env not set
if "REACT_APP_BACKEND_URL" not in os.environ:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"
DEMO_EMAIL = "demo@dhlpng.com"
DEMO_PWD = "Demo@2026"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def demo_token(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PWD}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Demo login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


# ===== Health & OpenAPI =====
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "message" in data

    def test_openapi_public(self, session):
        r = session.get(f"{API}/openapi.json", timeout=10)
        assert r.status_code == 200
        data = r.json()
        paths = data.get("paths", {})
        for p in ["/api/auth/login", "/api/auth/register", "/api/auth/me", "/api/auth/logout", "/api/auth/forgot-password"]:
            assert p in paths, f"Missing path {p} in openapi"


# ===== Login =====
class TestLogin:
    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PWD}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "access_token" in d and isinstance(d["access_token"], str) and len(d["access_token"]) > 20
        assert d["token_type"] == "bearer"
        assert d["expires_in"] == 604800
        u = d["user"]
        for f in ["id", "email", "firstName", "lastName", "companyName", "country", "phone", "createdAt"]:
            assert f in u, f"Missing field {f}"
        assert u["email"] == DEMO_EMAIL
        assert "_id" not in u
        assert "password" not in u

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "WrongPwd123"}, timeout=15)
        assert r.status_code == 401
        assert "Invalid email or password" in r.json().get("detail", "")

    def test_login_nonexistent(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "nobody-xyz-12345@example.com", "password": "Whatever1"}, timeout=15)
        assert r.status_code == 401


# ===== /me =====
class TestMe:
    def test_me_no_auth(self, session):
        s = requests.Session()
        r = s.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_invalid_token(self, session):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.value"}, timeout=10)
        assert r.status_code == 401

    def test_me_valid(self, session, demo_token):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {demo_token}"}, timeout=10)
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == DEMO_EMAIL
        assert u["firstName"] == "Demo"
        assert u["lastName"] == "User"
        assert u["companyName"] == "PNG Logistics Co"
        assert u["phone"] == "+675 7000 0000"
        assert u["country"] == "PG"
        assert "_id" not in u
        assert "password" not in u


# ===== Register =====
class TestRegister:
    def test_register_success_and_auto_login(self, session):
        email = f"test-{int(time.time()*1000)}@example.com"
        payload = {
            "email": email,
            "password": "Strong1Pass",
            "firstName": "Test",
            "lastName": "User",
            "companyName": "Acme PNG",
            "country": "PG",
            "phone": "+675 1234567",
        }
        r = session.post(f"{API}/auth/register", json=payload, timeout=15)
        assert r.status_code == 201, r.text
        d = r.json()
        assert "access_token" in d
        assert d["user"]["email"] == email
        assert "_id" not in d["user"]
        assert "password" not in d["user"]
        # token works on /me
        r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {d['access_token']}"}, timeout=10)
        assert r2.status_code == 200
        assert r2.json()["email"] == email

    def test_register_duplicate(self, session):
        r = session.post(f"{API}/auth/register", json={
            "email": DEMO_EMAIL, "password": "Strong1Pass", "firstName": "X",
            "lastName": "Y", "companyName": "Z", "country": "PG", "phone": "+675 1"
        }, timeout=15)
        assert r.status_code == 400
        assert "already exists" in r.json().get("detail", "").lower()

    def test_register_short_password(self, session):
        r = session.post(f"{API}/auth/register", json={
            "email": f"short-{int(time.time())}@example.com",
            "password": "abc1", "firstName": "X", "lastName": "Y",
            "companyName": "Z", "country": "PG", "phone": "+675 1"
        }, timeout=10)
        assert r.status_code == 422

    def test_register_invalid_email(self, session):
        r = session.post(f"{API}/auth/register", json={
            "email": "not-an-email", "password": "Strong1Pass",
            "firstName": "X", "lastName": "Y", "companyName": "Z",
            "country": "PG", "phone": "+675 1"
        }, timeout=10)
        assert r.status_code == 422


# ===== Forgot password =====
class TestForgot:
    def test_forgot_password_any_email(self, session):
        r = session.post(f"{API}/auth/forgot-password", json={"email": "anyone@example.com"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["success"] is True


# ===== Logout =====
class TestLogout:
    def test_logout_no_auth(self, session):
        r = requests.post(f"{API}/auth/logout", timeout=10)
        assert r.status_code == 401

    def test_logout_with_auth(self, demo_token):
        r = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {demo_token}"}, timeout=10)
        assert r.status_code == 200


# ===== JWT structure =====
class TestJWT:
    def test_jwt_hs256_and_expiry(self, demo_token):
        import jwt as pyjwt
        header = pyjwt.get_unverified_header(demo_token)
        assert header["alg"] == "HS256"
        payload = pyjwt.decode(demo_token, options={"verify_signature": False})
        # 7 days expiry window check
        delta = payload["exp"] - payload["iat"]
        assert delta == 7 * 24 * 3600
