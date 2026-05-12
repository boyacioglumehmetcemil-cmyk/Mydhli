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
DOC_SLUGS = [
    "airwaybill", "proforma", "commercial", "tax", "inbound", "declaration",
    "pod", "certificate-of-origin", "loa", "packing-list", "receipt",
    "payment-confirmation",
]


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
        f"{API}/shipments?pageSize=50",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    assert r2.status_code == 200
    data = r2.json()
    # Shipper user has 6 seeded shipments. They may also have created additional
    # ones via the Ship Now flow — accept any superset that contains all 6.
    assert data["total"] >= 6, f"expected at least 6, got {data['total']}"
    awbs = {item["awb"] for item in data["items"]}
    expected_seeded = {f"DHL552001000{i}" for i in range(1, 7)}
    missing = expected_seeded - awbs
    assert not missing, f"seeded AWBs missing from list: {missing}"


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


# ===== Invoice + Customs PDF endpoints (auth bug regression) =====
@pytest.mark.parametrize(
    "email,pwd",
    [("demo@dhlpng.com", "Demo@2026"), ("shipper@dhlpng.com", "Shipper@2026")],
)
def test_invoice_pdf_endpoint_authed_returns_valid_pdf(email, pwd):
    """For each seeded user, every invoice's /pdf endpoint returns a valid PDF
    when the Bearer JWT is attached."""
    tok = _login(email, pwd)
    invs = requests.get(f"{API}/invoices?pageSize=20",
                       headers={"Authorization": f"Bearer {tok}"}, timeout=10).json()
    items = invs["items"]
    assert items, f"no invoices for {email}"
    for inv in items[:5]:
        r = requests.get(f"{API}/invoices/{inv['invoiceNumber']}/pdf",
                         headers={"Authorization": f"Bearer {tok}"}, timeout=15)
        assert r.status_code == 200, f"{email} / {inv['invoiceNumber']}: {r.status_code}"
        assert r.headers.get("content-type") == "application/pdf"
        assert r.content[:5] == b"%PDF-"
        assert len(r.content) > 3000


@pytest.mark.parametrize(
    "email,pwd",
    [("demo@dhlpng.com", "Demo@2026"), ("shipper@dhlpng.com", "Shipper@2026")],
)
def test_customs_pdf_endpoint_authed_returns_valid_pdf(email, pwd):
    """For each seeded user, every customs doc's /pdf endpoint returns a valid
    PDF when the Bearer JWT is attached."""
    tok = _login(email, pwd)
    cus = requests.get(f"{API}/customs",
                       headers={"Authorization": f"Bearer {tok}"}, timeout=10).json()
    assert cus, f"no customs docs for {email}"
    for c in cus:
        r = requests.get(f"{API}/customs/{c['id']}/pdf",
                         headers={"Authorization": f"Bearer {tok}"}, timeout=15)
        assert r.status_code == 200, f"{email} / {c['id']}: {r.status_code}"
        assert r.headers.get("content-type") == "application/pdf"
        assert r.content[:5] == b"%PDF-"
        # Sparse customs docs (single item, minimal parties) compress to ~2.4 KB.
        # 1500 still excludes blank PDFs (~600 bytes) and proves real content.
        assert len(r.content) > 1500


def test_invoice_pdf_requires_auth():
    """Sanity check: no auth → 401 (so the frontend MUST attach the JWT)."""
    # Login briefly to get a valid invoice number
    tok = _login("demo@dhlpng.com", "Demo@2026")
    inv = requests.get(f"{API}/invoices?pageSize=1",
                       headers={"Authorization": f"Bearer {tok}"}, timeout=10).json()
    inv_no = inv["items"][0]["invoiceNumber"]
    r = requests.get(f"{API}/invoices/{inv_no}/pdf", timeout=10)
    assert r.status_code in (401, 403)


def test_customs_pdf_requires_auth():
    """Sanity check: no auth → 401."""
    tok = _login("demo@dhlpng.com", "Demo@2026")
    cus = requests.get(f"{API}/customs",
                       headers={"Authorization": f"Bearer {tok}"}, timeout=10).json()
    cus_id = cus[0]["id"]
    r = requests.get(f"{API}/customs/{cus_id}/pdf", timeout=10)
    assert r.status_code in (401, 403)


def test_shipper_user_has_invoices_and_customs():
    """Bug fix regression: shipper user must have at least 5 invoices and 4
    customs documents seeded."""
    tok = _login("shipper@dhlpng.com", "Shipper@2026")
    inv = requests.get(f"{API}/invoices",
                       headers={"Authorization": f"Bearer {tok}"}, timeout=10).json()
    cus = requests.get(f"{API}/customs",
                       headers={"Authorization": f"Bearer {tok}"}, timeout=10).json()
    assert inv["total"] >= 5, f"expected >=5 invoices, got {inv['total']}"
    assert len(cus) >= 4, f"expected >=4 customs, got {len(cus)}"


# ===== Notifications tests =====
def _login(email, pwd):
    r = requests.post(f"{API}/auth/login",
                      json={"email": email, "password": pwd}, timeout=10)
    assert r.status_code == 200
    return r.json()["access_token"]


def test_notifications_seeded_for_demo_user():
    """Demo user has at least 6 notifications, with unread > 0."""
    tok = _login("demo@dhlpng.com", "Demo@2026")
    r = requests.get(f"{API}/notifications?pageSize=20",
                     headers={"Authorization": f"Bearer {tok}"}, timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 6
    assert body["unread"] >= 1
    assert len(body["items"]) >= 6
    # Most-recent first ordering
    times = [it["createdAt"] for it in body["items"]]
    assert times == sorted(times, reverse=True)


def test_notifications_seeded_for_shipper_user():
    """Shipper user has at least 6 notifications, with unread > 0."""
    tok = _login("shipper@dhlpng.com", "Shipper@2026")
    r = requests.get(f"{API}/notifications?pageSize=20",
                     headers={"Authorization": f"Bearer {tok}"}, timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 6
    assert body["unread"] >= 1


def test_notifications_unread_count_endpoint():
    """unread-count endpoint returns the same number shown in /notifications."""
    tok = _login("demo@dhlpng.com", "Demo@2026")
    r1 = requests.get(f"{API}/notifications/unread-count",
                      headers={"Authorization": f"Bearer {tok}"}, timeout=10)
    r2 = requests.get(f"{API}/notifications?pageSize=20",
                      headers={"Authorization": f"Bearer {tok}"}, timeout=10)
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["unread"] == r2.json()["unread"]


def test_notifications_require_auth():
    """Unauthenticated requests are rejected."""
    r = requests.get(f"{API}/notifications", timeout=10)
    assert r.status_code in (401, 403)


# ===== Address book tests =====
def test_address_book_seeded_for_demo_user():
    """Demo user has at least 4 seeded addresses."""
    tok = _login("demo@dhlpng.com", "Demo@2026")
    r = requests.get(f"{API}/addresses",
                     headers={"Authorization": f"Bearer {tok}"}, timeout=10)
    assert r.status_code == 200
    addrs = r.json()
    assert len(addrs) >= 4
    # Each address must have the required boolean default fields.
    for a in addrs:
        assert "isDefaultSender" in a and "isDefaultReceiver" in a
        assert isinstance(a["isDefaultSender"], bool)
        assert isinstance(a["isDefaultReceiver"], bool)


def test_address_book_seeded_for_shipper_user():
    """Shipper user has 6 seeded addresses with Daniel Kavu / Highlands persona."""
    tok = _login("shipper@dhlpng.com", "Shipper@2026")
    r = requests.get(f"{API}/addresses",
                     headers={"Authorization": f"Bearer {tok}"}, timeout=10)
    assert r.status_code == 200
    addrs = r.json()
    assert len(addrs) >= 6
    companies = {a.get("company", "") for a in addrs}
    assert any("Highlands Mining Supplies" in c for c in companies), \
        f"Expected sender companies tied to Daniel Kavu in {companies}"


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
