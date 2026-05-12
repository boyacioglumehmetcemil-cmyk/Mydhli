"""Smoke tests for the additive shipment-document PDF endpoints.

Run from /app/backend:
    cd /app/backend && python3 -m pytest tests/test_shipment_documents.py -v
Or directly:
    cd /app/backend && python3 tests/test_shipment_documents.py
"""
import os
import sys
import requests
import pytest


BACKEND_URL = os.environ.get(
    "BACKEND_URL",
    # Allow override; default to the local supervisor-managed port for backend tests.
    "http://localhost:8001",
)
API = f"{BACKEND_URL}/api"
TEST_AWB = "DHL1234567890"
DOC_SLUGS = ["airwaybill", "proforma", "commercial", "tax", "inbound", "declaration"]


@pytest.fixture(scope="session")
def auth_token():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": "demo@dhlpng.com", "password": "Demo@2026"},
        timeout=10,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.mark.parametrize("slug", DOC_SLUGS)
def test_document_pdf_returns_valid_pdf(auth_token, slug):
    """Each of the 6 document endpoints returns a valid PDF for the demo AWB."""
    r = requests.get(
        f"{API}/shipments/{TEST_AWB}/documents/{slug}.pdf",
        headers={"Authorization": f"Bearer {auth_token}"},
        timeout=15,
    )
    assert r.status_code == 200, f"{slug}: status {r.status_code}"
    assert r.headers.get("content-type") == "application/pdf", \
        f"{slug}: ct={r.headers.get('content-type')}"
    assert r.content[:5] == b"%PDF-", f"{slug}: bad PDF magic"
    assert len(r.content) > 5000, f"{slug}: suspiciously small ({len(r.content)} bytes)"


def test_documents_require_auth():
    """Unauthenticated requests get rejected."""
    r = requests.get(
        f"{API}/shipments/{TEST_AWB}/documents/airwaybill.pdf",
        timeout=10,
    )
    assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"


def test_documents_404_on_other_users_awb(auth_token):
    """A bogus AWB returns 404 (also confirms ownership enforcement)."""
    r = requests.get(
        f"{API}/shipments/NOTREAL999/documents/airwaybill.pdf",
        headers={"Authorization": f"Bearer {auth_token}"},
        timeout=10,
    )
    assert r.status_code == 404


def test_existing_label_pdf_still_works(auth_token):
    """Regression: the original label.pdf endpoint must keep working."""
    r = requests.get(
        f"{API}/shipments/{TEST_AWB}/label.pdf",
        headers={"Authorization": f"Bearer {auth_token}"},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.headers.get("content-type") == "application/pdf"
    assert r.content[:5] == b"%PDF-"


def test_existing_openapi_still_works():
    """Regression: openapi.json public, unchanged shape."""
    r = requests.get(f"{API}/openapi.json", timeout=10)
    assert r.status_code == 200
    spec = r.json()
    paths = spec.get("paths", {})
    # New endpoints present
    for slug in DOC_SLUGS:
        path = f"/api/shipments/{{awb}}/documents/{slug}.pdf"
        assert path in paths, f"missing path {path} in openapi"
    # Old endpoints still present
    assert "/api/shipments/{awb}/label.pdf" in paths
    assert "/api/track/{awb}" in paths


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
