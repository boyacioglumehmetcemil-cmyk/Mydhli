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
    # Phase 8.2: /api/track was renamed to use a generic `ref` path param so
    # it can accept AWB / HAWB / HBL / booking-ref / container-no. The route
    # still exists; the path key is now /api/track/{ref}.
    assert any(p in paths for p in ("/api/track/{ref}", "/api/track/{awb}")), \
        f"track path missing — keys: {[k for k in paths if 'track' in k]}"


# ============ PHASE 8.2 — Multi-mode booking + multi-format tracking ============
def _login_token(email="demo@dhlpng.com", password="Demo@2026"):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=10)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_phase82_seed_distribution():
    """Demo user seed should now have ~10 AIR / 10 OCEAN / 5 ROAD bookings."""
    tok = _login_token()
    counts = {}
    for mode in ("AIR", "OCEAN", "ROAD"):
        r = requests.get(f"{API}/shipments?mode={mode}&pageSize=100", headers=_auth(tok), timeout=10)
        assert r.status_code == 200
        counts[mode] = r.json()["total"]
    assert counts["AIR"] >= 8, f"AIR too low: {counts}"
    assert counts["OCEAN"] >= 8, f"OCEAN too low: {counts}"
    assert counts["ROAD"] >= 4, f"ROAD too low: {counts}"
    assert sum(counts.values()) >= 23, f"Total too low: {counts}"


def test_phase82_legacy_awb_still_tracks():
    """Backward compat: DHL1234567890 must still resolve via /api/track."""
    r = requests.get(f"{API}/track/DHL1234567890", timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["awb"] == "DHL1234567890"
    assert "mode" in body
    assert body["mode"] in ("AIR", "OCEAN", "ROAD")


def test_phase82_track_by_booking_reference():
    tok = _login_token()
    r = requests.get(f"{API}/bookings?pageSize=5", headers=_auth(tok), timeout=10)
    assert r.status_code == 200
    items = r.json()["items"]
    ref = next((it["bookingReference"] for it in items if it.get("bookingReference")), None)
    assert ref and ref.startswith("MYDH-"), f"no booking ref in seed: {items[:1]}"
    pub = requests.get(f"{API}/track/{ref}", timeout=10)
    assert pub.status_code == 200, pub.text
    assert pub.json().get("bookingReference") == ref


def test_phase82_track_unknown_ref_404():
    r = requests.get(f"{API}/track/NOSUCH-XXX-000000", timeout=10)
    assert r.status_code == 404


def test_phase82_bookings_alias():
    tok = _login_token()
    a = requests.get(f"{API}/shipments?pageSize=3", headers=_auth(tok), timeout=10).json()
    b = requests.get(f"{API}/bookings?pageSize=3", headers=_auth(tok), timeout=10).json()
    assert a["total"] == b["total"]
    assert {x["awb"] for x in a["items"]} == {x["awb"] for x in b["items"]}


def _booking_payload(mode, **overrides):
    base = {
        "mode": mode,
        "sender": {
            "name": "Pitch Sender", "company": "Pitch Co",
            "address": "1 Test Way", "city": "Sydney", "country": "AU",
            "phone": "+61 200 000 000", "email": "pitch@example.com", "postalCode": "2000",
        },
        "receiver": {
            "name": "Pitch Receiver", "company": "Pitch Receiver Co",
            "address": "2 Demo Lane", "city": "Singapore", "country": "SG",
            "phone": "+65 6000 0000", "email": "recv@example.com", "postalCode": "018989",
        },
        "package": {
            "pieces": 2, "weightKg": 18.5,
            "dimensions": {"l": 50, "w": 35, "h": 25},
            "description": "Generic cargo", "declaredValueUSD": 1500,
        },
    }
    base.update(overrides)
    return base


def test_phase82_create_booking_air():
    tok = _login_token()
    payload = _booking_payload("AIR", incoterms="CIF", commodity="Electronics",
                               hsCode="847130", originPort="SYD", destinationPort="SIN")
    r = requests.post(f"{API}/bookings", headers=_auth(tok), json=payload, timeout=15)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["mode"] == "AIR"
    assert body["bookingReference"].startswith("MYDH-")
    assert body["incoterms"] == "CIF"
    assert body["airSpecifics"] is not None
    assert body["oceanSpecifics"] is None
    pub = requests.get(f"{API}/track/{body['bookingReference']}", timeout=10)
    assert pub.status_code == 200


def test_phase82_create_booking_ocean():
    tok = _login_token()
    payload = _booking_payload(
        "OCEAN", incoterms="FOB",
        oceanSpecifics={"containerType": "40HC", "cbm": 67, "bolType": "HBL"},
        originPort="HKHKG", destinationPort="NLRTM",
    )
    payload["sender"]["city"] = "Hong Kong"; payload["sender"]["country"] = "HK"
    payload["receiver"]["city"] = "Rotterdam"; payload["receiver"]["country"] = "NL"
    payload["package"]["weightKg"] = 2800
    r = requests.post(f"{API}/bookings", headers=_auth(tok), json=payload, timeout=15)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["mode"] == "OCEAN"
    assert body["oceanSpecifics"]["containerType"] == "40HC"
    assert body["airSpecifics"] is None


def test_phase82_create_booking_road():
    tok = _login_token()
    payload = _booking_payload(
        "ROAD", incoterms="DAP",
        roadSpecifics={"truckType": "FLATBED", "pallets": 2, "crossBorder": False},
    )
    payload["sender"]["city"] = "Port Moresby"; payload["sender"]["country"] = "PG"
    payload["receiver"]["city"] = "Lae"; payload["receiver"]["country"] = "PG"
    payload["package"]["weightKg"] = 450
    r = requests.post(f"{API}/bookings", headers=_auth(tok), json=payload, timeout=15)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["mode"] == "ROAD"
    assert body["roadSpecifics"]["truckType"] == "FLATBED"


def test_phase82_create_booking_rejects_cross_mode_specs():
    tok = _login_token()
    payload = _booking_payload("AIR", oceanSpecifics={"containerType": "20GP"})
    r = requests.post(f"{API}/bookings", headers=_auth(tok), json=payload, timeout=10)
    assert r.status_code == 422, r.text


def test_phase82_multi_mode_quote():
    tok = _login_token()
    payload = {
        "originCountry": "AU", "originCity": "Sydney",
        "destinationCountry": "SG", "destinationCity": "Singapore",
        "weightKg": 250, "cbm": 1.5,
    }
    r = requests.post(f"{API}/quotes/multi-mode", headers=_auth(tok), json=payload, timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["quotes"]) == 3
    modes = {q["mode"] for q in body["quotes"]}
    assert modes == {"AIR", "OCEAN", "ROAD"}
    for q in body["quotes"]:
        assert q["pricePGK"] > 0
        assert q["transitDaysMin"] > 0
        assert q["co2EstimateKg"] >= 0
    assert body["fastest"] in modes
    assert body["cheapest"] in modes
    assert body["greenest"] in modes


def test_phase82_ports_endpoint():
    r = requests.get(f"{API}/locations/ports?mode=AIR&q=fra", timeout=10)
    assert r.status_code == 200
    rows = r.json()
    assert any(p["code"] == "FRA" for p in rows), [p["code"] for p in rows]
    r2 = requests.get(f"{API}/locations/ports?mode=OCEAN", timeout=10)
    assert r2.status_code == 200
    codes = [p["code"] for p in r2.json()]
    assert "SGSIN" in codes and "NLRTM" in codes


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
