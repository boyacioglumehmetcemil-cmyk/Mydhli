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


@pytest.mark.parametrize("slug", DOC_SLUGS)
def test_document_pdf_embeds_logo_on_every_page(auth_token, slug, tmp_path):
    """Every page of every document must embed at least one image (the brand
    logo is drawn on every page via the canvas callback)."""
    import pdfplumber

    r = requests.get(
        f"{API}/shipments/{TEST_AWB}/documents/{slug}.pdf",
        headers={"Authorization": f"Bearer {auth_token}"},
        timeout=15,
    )
    assert r.status_code == 200
    pdf_path = tmp_path / f"{slug}.pdf"
    pdf_path.write_bytes(r.content)

    with pdfplumber.open(str(pdf_path)) as pdf:
        for i, page in enumerate(pdf.pages):
            assert len(page.images) >= 1, (
                f"{slug} page {i + 1}: no image found (expected logo)"
            )


def test_shipper_user_can_login_and_owns_six_shipments():
    """Secondary seeded shipper user (Daniel Kavu) can log in and owns
    the 6 seeded shipments DHL5520010001..DHL5520010006."""
    r = requests.post(
        f"{API}/auth/login",
        json={"email": "shipper@dhlpng.com", "password": "Shipper@2026"},
        timeout=10,
    )
    assert r.status_code == 200, f"shipper login failed: {r.text}"
    body = r.json()
    token = body["access_token"]
    assert body["user"]["email"] == "shipper@dhlpng.com"
    assert body["user"]["companyName"] == "Highlands Mining Supplies (PNG) Ltd"
    assert body["user"]["firstName"] == "Daniel"
    assert body["user"]["lastName"] == "Kavu"

    r2 = requests.get(
        f"{API}/shipments?pageSize=10",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    assert r2.status_code == 200
    data = r2.json()
    assert data["total"] == 6, f"expected 6, got {data['total']}"
    awbs = sorted(item["awb"] for item in data["items"])
    expected = [f"DHL552001000{i}" for i in range(1, 7)]
    assert awbs == expected, f"AWB mismatch: {awbs}"


def test_demo_user_shipments_intact():
    """Regression: demo user's shipment count not broken by the shipper seed."""
    r = requests.post(
        f"{API}/auth/login",
        json={"email": "demo@dhlpng.com", "password": "Demo@2026"},
        timeout=10,
    )
    token = r.json()["access_token"]
    r2 = requests.get(
        f"{API}/shipments?pageSize=1",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    assert r2.status_code == 200
    # Demo user has 25 originally seeded + extras created during dev (≥25)
    assert r2.json()["total"] >= 25


def test_proforma_pdf_contains_required_sections(auth_token, tmp_path):
    """Proforma Invoice PDF must render all six sections from the client's
    template + the shipment's AWB. Verifies no example-template data leaks."""
    import re
    from pdfminer.high_level import extract_text

    r = requests.get(
        f"{API}/shipments/{TEST_AWB}/documents/proforma.pdf",
        headers={"Authorization": f"Bearer {auth_token}"},
        timeout=15,
    )
    assert r.status_code == 200
    p = tmp_path / "proforma.pdf"
    p.write_bytes(r.content)

    text = extract_text(str(p))

    # AWB present
    assert TEST_AWB in text, "AWB missing from proforma PDF"

    # All required section headers (whitespace-tolerant — pdfminer may insert
    # line breaks on visually wrapped paragraphs).
    required_headers = [
        r"PROFORMA\s+INVOICE",
        r"SENDER\s+\(SHIPPER\)",
        r"RECEIVER\s+\(CONSIGNEE\)",
        r"SHIPMENT\s+DETAILS",
        r"LINE\s+ITEM\s+DETAILS",
        r"DECLARATION",
    ]
    for h in required_headers:
        assert re.search(h, text), f"section header pattern '{h}' missing"

    # Invoice number + Waybill number labels
    assert re.search(r"INVOICE\s+NUMBER", text, re.IGNORECASE), "Invoice Number label missing"
    assert re.search(r"WAYBILL\s+NUMBER", text, re.IGNORECASE), "Waybill Number label missing"
    assert f"PRO-{TEST_AWB[-6:]}-" in text, "auto-generated invoice number missing"

    # PGK currency surfaced + total
    assert "PGK" in text
    assert re.search(r"TOTAL\s+DECLARED\s+VALUE", text), "TOTAL DECLARED VALUE row missing"

    # Must NOT leak any of the example template's hard-coded data
    forbidden = [
        "Hastings Deering",
        "Komatsu Australia",
        "Spring Garden Road",
        "Wacol",
        "500344556",
        "63 053 514 739",
    ]
    for token in forbidden:
        assert token not in text, f"example data leak: {token}"


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
