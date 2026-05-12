"""Shipping document PDF generators.

Six original A4-portrait document templates auto-populated from a shipment
record. The layouts are our own — not pixel-replicas of any carrier's form.
All generators return PDF bytes.

DHL Mapping (collectively): supports DHL XML Services Guide §5 Shipment
Validation (Dutiable block) + §7 Label Image. Tax / Inbound / Proforma
invoices are internal SaaS-billing layer additions not in the DHL spec.
"""
import os
import hashlib
from io import BytesIO
from datetime import datetime, timezone, timedelta
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as PlatyImage,
    KeepTogether,
)

from labels_module import _barcode_png, _qr_png, DHL_YELLOW, DHL_RED, DHL_INK


# ============ LOGO ============
# Client-uploaded DHL Express wordmark. Native size: 334 × 31 px.
LOGO_PATH = "/app/frontend/public/images/logo-user.png"
# Cached ImageReader (loaded once per process)
_LOGO_READER: Optional[ImageReader] = None
LOGO_RENDER_WIDTH_MM = 60       # rendered width on every page
LOGO_RENDER_HEIGHT_MM = 5.6     # 60mm × (31/334) ≈ 5.57mm — preserves aspect
LOGO_TOP_PAD_MM = 5             # distance from page top to top of logo

def _logo() -> Optional[ImageReader]:
    global _LOGO_READER
    if _LOGO_READER is None and os.path.exists(LOGO_PATH):
        try:
            _LOGO_READER = ImageReader(LOGO_PATH)
        except Exception:
            _LOGO_READER = None
    return _LOGO_READER


# ============ STYLES ============
_styles = getSampleStyleSheet()
_S_NORMAL = _styles["Normal"]
_S_TITLE = ParagraphStyle(
    "doc_title", parent=_styles["Heading1"], fontName="Helvetica-Bold",
    fontSize=20, textColor=DHL_INK, leading=22, spaceAfter=0,
)
_S_BRAND = ParagraphStyle(
    "brand", parent=_styles["Normal"], fontName="Helvetica-Bold",
    fontSize=9, textColor=DHL_INK, leading=10,
)
_S_SECTION = ParagraphStyle(
    "section", parent=_styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=10, textColor=DHL_INK, leading=12, spaceBefore=6, spaceAfter=4,
)
_S_LABEL = ParagraphStyle(
    "label", parent=_styles["Normal"], fontName="Helvetica-Bold",
    fontSize=7, textColor=colors.HexColor("#666"), leading=9, spaceAfter=2,
)
_S_BODY = ParagraphStyle(
    "body", parent=_styles["Normal"], fontName="Helvetica",
    fontSize=9, textColor=DHL_INK, leading=12,
)
_S_BODY_BOLD = ParagraphStyle(
    "body_bold", parent=_styles["Normal"], fontName="Helvetica-Bold",
    fontSize=9, textColor=DHL_INK, leading=12,
)
_S_DISCLAIMER = ParagraphStyle(
    "disclaimer", parent=_styles["Normal"], fontName="Helvetica-Oblique",
    fontSize=7, textColor=colors.HexColor("#999"), leading=9,
)


# ============ SERVICE LABELS ============
SERVICE_LABEL = {
    "EXPRESS_WORLDWIDE": "Express Worldwide",
    "EXPRESS_12_00": "Express 12:00",
    "ECONOMY_SELECT": "Economy Select",
}


# ============ HELPERS ============
def _money(value: float, currency: str = "PGK") -> str:
    return f"{currency} {value:,.2f}"


def _fmt_addr_block(addr: dict, role: str) -> Paragraph:
    """Render a multi-line address block as a Paragraph."""
    name = addr.get("name", "")
    company = addr.get("company", "")
    address = addr.get("address", "")
    city = addr.get("city", "")
    country = addr.get("country", "")
    postal = addr.get("postalCode", "")
    phone = addr.get("phone", "")
    email = addr.get("email", "")
    html = f"<b>{role}</b><br/>"
    html += f"<b>{name}</b><br/>" if name else ""
    html += f"{company}<br/>" if company else ""
    html += f"{address}<br/>" if address else ""
    html += f"{city}, {country} {postal}<br/>" if city else ""
    html += f"Tel: {phone}<br/>" if phone else ""
    html += f"Email: {email}" if email else ""
    return Paragraph(html, _S_BODY)


def _header_band(doc_type: str, awb: str) -> Table:
    """Yellow header band with doc type title + AWB barcode.
    Brand logo is drawn separately on every page via the canvas callback."""
    bc_buf = _barcode_png(awb)
    bc_img = PlatyImage(bc_buf, width=58 * mm, height=14 * mm)
    title_html = (
        f"<font size='15'><b>{doc_type}</b></font><br/>"
        f"<font size='9' color='#666'>AWB {awb}</font>"
    )
    tbl = Table(
        [[Paragraph(title_html, _S_TITLE), bc_img]],
        colWidths=[110 * mm, 60 * mm],
    )
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_YELLOW),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return tbl


def _section_title(num: int, title: str) -> Paragraph:
    return Paragraph(
        f"<font color='#D40511'>{num}.</font> <font color='#1A1A1A'>{title}</font>",
        _S_SECTION,
    )


def _kv_grid(rows: list, col_widths: Optional[list] = None) -> Table:
    """Render a label/value 2-column grid. `rows` is list of [label, value] strings."""
    data = [
        [Paragraph(lab.upper(), _S_LABEL), Paragraph(val, _S_BODY)]
        for lab, val in rows
    ]
    cw = col_widths or [45 * mm, 110 * mm]
    tbl = Table(data, colWidths=cw)
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
    ]))
    return tbl


def _two_col_addr(left: Paragraph, right: Paragraph) -> Table:
    tbl = Table([[left, right]], colWidths=[78 * mm, 78 * mm])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return tbl


def _line_items_table(rows: list, total_label: str, total_value: str) -> list:
    """Generic line-items table + total row. `rows[0]` is the header row."""
    tbl = Table(rows, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    total_tbl = Table([[total_label, total_value]], colWidths=[120 * mm, 35 * mm])
    total_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("BACKGROUND", (0, 0), (-1, -1), DHL_YELLOW),
        ("TEXTCOLOR", (0, 0), (-1, -1), DHL_INK),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return [tbl, Spacer(1, 4 * mm), total_tbl]


# ============ PAGE TEMPLATE ============
def _build_doc(awb: str) -> tuple:
    """Create a BaseDocTemplate that prints the brand logo at the top and
    the disclaimer footer at the bottom of every page."""
    buf = BytesIO()

    def _draw_page_chrome(canv, _doc):
        # ---- TOP: brand logo on every page (top-left) ----
        logo = _logo()
        if logo is not None:
            canv.drawImage(
                logo,
                x=13 * mm,
                y=A4[1] - (LOGO_TOP_PAD_MM + LOGO_RENDER_HEIGHT_MM) * mm,
                width=LOGO_RENDER_WIDTH_MM * mm,
                height=LOGO_RENDER_HEIGHT_MM * mm,
                preserveAspectRatio=True,
                mask="auto",
            )
        # ---- BOTTOM: hairline + generated/AWB/demo disclaimer + page number ----
        canv.saveState()
        canv.setStrokeColor(colors.HexColor("#E5E7EB"))
        canv.setLineWidth(0.5)
        canv.line(13 * mm, 14 * mm, A4[0] - 13 * mm, 14 * mm)
        canv.setFont("Helvetica", 7)
        canv.setFillColor(colors.HexColor("#666"))
        gen_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        canv.drawString(13 * mm, 10 * mm,
                        f"Generated {gen_ts}  ·  AWB {awb}  ·  DHL Express (Demo)")
        canv.setFont("Helvetica-Oblique", 6.5)
        canv.setFillColor(colors.HexColor("#999"))
        canv.drawRightString(A4[0] - 13 * mm, 10 * mm,
                             "Demo Document — for pitch and prototyping only")
        canv.setFont("Helvetica", 7)
        canv.setFillColor(colors.HexColor("#666"))
        canv.drawRightString(A4[0] - 13 * mm, 6 * mm, f"Page {canv.getPageNumber()}")
        canv.restoreState()

    # topMargin = 18mm leaves clear room (5mm pad + ~5.6mm logo + 7mm gap)
    # for the canvas-drawn logo above the frame content.
    doc = BaseDocTemplate(
        buf, pagesize=A4,
        leftMargin=13 * mm, rightMargin=13 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
        title="DHL Express Shipment Document",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin,
                  doc.width, doc.height, id="content")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=_draw_page_chrome)])
    return doc, buf


# ============ COMMON SHIPMENT CONTEXT ============
def _service_label(svc: str) -> str:
    return SERVICE_LABEL.get(svc, svc.replace("_", " ").title())


def _common_shipment_kv(shipment: dict) -> list:
    """Return the standard shipment KV rows used across most documents."""
    pkg = shipment.get("package", {})
    dims = pkg.get("dimensions") or {}
    dim_str = (
        f"{dims.get('length', '?')} × {dims.get('width', '?')} × {dims.get('height', '?')} cm"
        if dims else "—"
    )
    origin = shipment.get("origin", {})
    dest = shipment.get("destination", {})
    created = shipment.get("createdAt", "")
    if isinstance(created, str) and len(created) >= 10:
        created = created[:10]
    eta = shipment.get("estimatedDelivery", "")
    if isinstance(eta, str) and len(eta) >= 10:
        eta = eta[:10]
    return [
        ("Air Waybill No.", shipment.get("awb", "—")),
        ("Service", _service_label(shipment.get("service", ""))),
        ("Date of Issue", created or "—"),
        ("Origin", f"{origin.get('city', '')}, {origin.get('country', '')}  ({origin.get('code', '')})"),
        ("Destination", f"{dest.get('city', '')}, {dest.get('country', '')}  ({dest.get('code', '')})"),
        ("Estimated Delivery", eta or "—"),
        ("Total Pieces", str(pkg.get("pieces", "—"))),
        ("Total Weight (kg)", f"{pkg.get('weightKg', '—')} kg"),
        ("Dimensions (L×W×H cm)", dim_str),
        ("Commodity Description", pkg.get("description", "General merchandise")),
        ("Declared Value", f"USD {pkg.get('declaredValueUSD', 0):,.2f}"),
    ]


# ============ DOCUMENT 1 — AIR WAYBILL ============
# Friendly expansions for Type of Export
EXPORT_TYPE_LABEL = {
    "PERMANENT": "Permanent",
    "TEMPORARY": "Temporary",
    "REPAIR": "Repair / Return",
    "RETURN": "Repair / Return",
}


def _shipper_reference(awb: str, shipment: dict) -> str:
    """Reference shown on the AWB; ≤32 chars, first 12 visible on invoice."""
    ref = shipment.get("reference") or shipment.get("shipperReference")
    if ref:
        return str(ref)[:32]
    return f"REF-{awb[-12:]}"


def generate_air_waybill(shipment: dict, user: dict,
                        customs_doc: Optional[dict] = None) -> bytes:
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {}) or {}
    sender = shipment.get("sender", {}) or {}
    receiver = shipment.get("receiver", {}) or {}

    story = [_header_band("AIR WAYBILL", awb), Spacer(1, 6 * mm)]

    # ===== 1. Shipper & Consignee =====
    story.append(_section_title(1, "Shipper & Consignee"))
    story.append(_two_col_addr(
        _fmt_addr_block(sender, "SHIPPER"),
        _fmt_addr_block(receiver, "CONSIGNEE"),
    ))
    story.append(Spacer(1, 5 * mm))

    # ===== 2. Routing & Service =====
    story.append(_section_title(2, "Routing & Service"))
    story.append(_kv_grid(_common_shipment_kv(shipment)))
    story.append(Spacer(1, 5 * mm))

    # ===== 3. Payment & Insurance =====
    story.append(_section_title(3, "Payment & Insurance"))
    insurance_value_usd = pkg.get("insuranceValueUSD") or 0
    insurance_status = "Insured" if insurance_value_usd > 0 else "Not Insured"
    payer_account = (
        (user or {}).get("dhlAccountNo")
        or (user or {}).get("accountNumber")
        or "—"
    )
    optional_services = []
    svc = shipment.get("service", "")
    if svc == "EXPRESS_12_00":
        optional_services.append("Express 12:00 Delivery")
    if pkg.get("saturdayDelivery"):
        optional_services.append("Saturday Delivery")
    if pkg.get("deliveryNotification"):
        optional_services.append("Delivery Notification")
    opt_svc_str = ", ".join(optional_services) if optional_services else "Standard"

    story.append(_kv_grid([
        ("Charge To", "Shipper"),
        ("Payer Account No.", payer_account),
        ("Shipment Insurance", insurance_status),
        ("Insured Value", f"USD {insurance_value_usd:,.2f}" if insurance_value_usd > 0 else "—"),
        ("Shipper's Reference", _shipper_reference(awb, shipment)),
        ("Optional Services", opt_svc_str),
    ]))
    story.append(Spacer(1, 5 * mm))

    # ===== 4. Charges =====
    story.append(_section_title(4, "Charges"))
    cost = shipment.get("costPGK") or 0
    story.append(_kv_grid([
        ("Freight Charge", _money(cost)),
        ("Terms of Trade", _expand_incoterms(
            (customs_doc or {}).get("termsOfTrade") or pkg.get("termsOfTrade")
        )),
        ("Currency", "PGK"),
    ]))
    story.append(Spacer(1, 5 * mm))

    # ===== 5. Customs (Non-Document Shipments) =====
    story.append(_section_title(5, "Customs (Non-Document Shipments)"))
    shipper_tax = (user or {}).get("companyTaxId") or "—"
    importer = ((customs_doc or {}).get("importer") or {}) if customs_doc else {}
    receiver_tax = importer.get("taxId") or importer.get("vatNumber") or "—"
    type_of_export = EXPORT_TYPE_LABEL.get(
        ((customs_doc or {}).get("exportType") or "").upper(), "Permanent"
    )
    duties_paid_by = (customs_doc or {}).get("dutiesPaidBy") or "Receiver"
    story.append(_kv_grid([
        ("Shipper's VAT/GST Number", shipper_tax),
        ("Receiver's VAT/GST Number", receiver_tax),
        ("Declared Value for Customs", f"USD {pkg.get('declaredValueUSD', 0):,.2f}"),
        ("Harmonised Commodity Code", pkg.get("hsCode") or "—"),
        ("Type of Export", type_of_export),
        ("Destination Duties Paid By", duties_paid_by),
    ]))
    story.append(Spacer(1, 5 * mm))

    # ===== 6. Signature & Tracking =====
    qr_buf = _qr_png(f"https://tracking.dhl-demo.local/{awb}")
    qr_img = PlatyImage(qr_buf, width=28 * mm, height=28 * mm)
    sign = Paragraph(
        "<b>Shipper's Signature (required)</b><br/><br/><br/>"
        "_________________________<br/>"
        f"<font size='8' color='#666'>{user.get('firstName', '')} {user.get('lastName', '')}, "
        f"{user.get('companyName', '')}<br/>"
        f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}</font>",
        _S_BODY,
    )
    foot_tbl = Table([[sign, qr_img]], colWidths=[125 * mm, 32 * mm])
    foot_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(_section_title(6, "Shipper's Agreement & Tracking"))
    story.append(foot_tbl)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 2 — PROFORMA INVOICE ============
# Friendly expansions for Incoterms (Incoterms 2020 + common usage)
INCOTERMS_LABEL = {
    "EXW": "Ex Works",
    "FCA": "Free Carrier",
    "FAS": "Free Alongside Ship",
    "FOB": "Free On Board",
    "CFR": "Cost and Freight",
    "CIF": "Cost, Insurance and Freight",
    "CPT": "Carriage Paid To",
    "CIP": "Carriage and Insurance Paid To",
    "DAP": "Delivered at Place",
    "DPU": "Delivered at Place Unloaded",
    "DDP": "Delivered Duty Paid",
}

# Friendly expansions for "Reason for Export" codes
REASON_LABEL = {
    "SALE": "Sale of Goods",
    "GIFT": "Gift / Personal",
    "SAMPLE": "Commercial Sample (no value)",
    "RETURN": "Return for Repair or Replacement",
    "REPAIR": "Temporary Export for Testing & Repair",
    "INTERCOMPANY": "Intercompany Transfer",
    "DOCUMENTS": "Documents (no commercial value)",
}

# Friendly expansions for package "type"
PACKAGE_TYPE_LABEL = {
    "DOCUMENT": "Document(s)",
    "PARCEL": "Parcel(s)",
    "PALLET": "Pallet(s)",
    "BOX": "Box(es)",
    "ENVELOPE": "Envelope(s)",
}

# Fixed mock FX rate for the demo (USD → PGK)
_USD_TO_PGK = 3.7


def _proforma_invoice_number(awb: str) -> str:
    last6 = awb[-6:] if len(awb) >= 6 else awb
    return f"PRO-{last6}-{datetime.now(timezone.utc).strftime('%y%m%d')}"


def _expand_incoterms(code: Optional[str]) -> str:
    if not code:
        return "DAP (Delivered at Place)"
    code_up = code.upper().strip()
    label = INCOTERMS_LABEL.get(code_up)
    return f"{code_up} ({label})" if label else code_up


def _expand_reason(code: Optional[str]) -> str:
    if not code:
        return "Commercial Sale"
    label = REASON_LABEL.get(code.upper().strip())
    return label or code


def _expand_package_type(code: Optional[str]) -> str:
    if not code:
        return "Parcel(s)"
    return PACKAGE_TYPE_LABEL.get(code.upper().strip(), "Parcel(s)")


def _addr_kv_block(addr: dict, contact_label: str = "Contact",
                   tax_label: str = "Tax ID", tax_value: Optional[str] = None) -> Table:
    """Render a sender/receiver block as a clean label/value grid."""
    rows = [
        ("Company", addr.get("company") or "—"),
        ("Address", addr.get("address") or "—"),
        ("City / State", addr.get("city") or "—"),
        ("Country", addr.get("country") or "—"),
        (contact_label, addr.get("name") or "—"),
        ("Phone", addr.get("phone") or "—"),
        (tax_label, tax_value or "—"),
    ]
    data = [
        [Paragraph(lab.upper(), _S_LABEL), Paragraph(str(val), _S_BODY)]
        for lab, val in rows
    ]
    tbl = Table(data, colWidths=[26 * mm, 53 * mm])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
    ]))
    return tbl


def generate_proforma_invoice(shipment: dict, user: dict,
                              customs_doc: Optional[dict] = None) -> bytes:
    """Proforma Invoice aligned with the client's template structure.

    Sections (in order): brand header strip, doc header (right), SENDER/RECEIVER
    side-by-side, SHIPMENT DETAILS, LINE ITEM DETAILS + total, DECLARATION,
    signature block.

    Data sources, in priority order: customs_doc record → shipment → user.
    No example-template data is hard-coded; "—" is shown where no real data
    exists.
    """
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {}) or {}
    sender = shipment.get("sender", {}) or {}
    receiver = shipment.get("receiver", {}) or {}

    # Today (and shipment.createdAt fallback for the visible Date field)
    created = shipment.get("createdAt") or ""
    if isinstance(created, str) and len(created) >= 10:
        try:
            d = datetime.fromisoformat(created.replace("Z", "+00:00"))
            doc_date_str = d.strftime("%d %b %Y")
        except Exception:
            doc_date_str = datetime.now(timezone.utc).strftime("%d %b %Y")
    else:
        doc_date_str = datetime.now(timezone.utc).strftime("%d %b %Y")

    # ===== Brand strip + header block =====
    story = [_header_band("PROFORMA INVOICE", awb), Spacer(1, 5 * mm)]

    # Header block — right-aligned key facts (Date / Invoice # / Waybill #)
    inv_no = _proforma_invoice_number(awb)
    hdr_rows = [
        ("Date", doc_date_str),
        ("Invoice Number", inv_no),
        ("DHL Waybill Number", awb),
    ]
    hdr_data = [
        [Paragraph(lab.upper(), _S_LABEL), Paragraph(str(val), _S_BODY_BOLD)]
        for lab, val in hdr_rows
    ]
    hdr_tbl = Table(hdr_data, colWidths=[40 * mm, 50 * mm], hAlign="RIGHT")
    hdr_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
    ]))
    story.append(hdr_tbl)
    story.append(Spacer(1, 6 * mm))

    # ===== SENDER (SHIPPER) / RECEIVER (CONSIGNEE) — side-by-side 50/50 =====
    sender_tax = (user or {}).get("companyTaxId")
    importer = ((customs_doc or {}).get("importer") or {}) if customs_doc else {}
    receiver_tax = importer.get("taxId") or importer.get("abn")

    left_block = [
        Paragraph("SENDER (SHIPPER)", _S_SECTION),
        _addr_kv_block(sender, contact_label="Contact",
                       tax_label="Tax ID", tax_value=sender_tax),
    ]
    right_block = [
        Paragraph("RECEIVER (CONSIGNEE)", _S_SECTION),
        _addr_kv_block(receiver, contact_label="Contact",
                       tax_label="ABN / Tax ID", tax_value=receiver_tax),
    ]
    two_col = Table(
        [[left_block, right_block]],
        colWidths=[91 * mm, 91 * mm],
    )
    two_col.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(two_col)
    story.append(Spacer(1, 5 * mm))

    # ===== SHIPMENT DETAILS =====
    story.append(Paragraph("SHIPMENT DETAILS", _S_SECTION))
    reason = _expand_reason((customs_doc or {}).get("reasonForExport"))
    incoterms = _expand_incoterms(
        (customs_doc or {}).get("termsOfTrade") or pkg.get("termsOfTrade")
    )
    pkg_type = _expand_package_type(pkg.get("type"))
    pieces = pkg.get("pieces") or 1
    weight = pkg.get("weightKg")
    weight_str = f"{weight} kg" if weight is not None else "—"
    total_pkgs = f"{pieces} {pkg_type}"

    story.append(_kv_grid([
        ("Reason for Export", reason),
        ("Incoterms", incoterms),
        ("Total Packages", total_pkgs),
        ("Total Weight", weight_str),
        ("Currency", "PGK (Papua New Guinea Kina)"),
    ]))
    story.append(Spacer(1, 5 * mm))

    # ===== LINE ITEM DETAILS =====
    story.append(Paragraph("LINE ITEM DETAILS", _S_SECTION))
    items_header = ["Description of Goods", "HS Code", "Qty",
                    "Unit Value (PGK)", "Total Value (PGK)", "Origin"]
    rows = [items_header]
    grand_total_pgk = 0.0

    customs_items = (customs_doc or {}).get("items") or []
    if customs_items:
        # Treat customs_doc.currency as the source unit-value currency.
        src_currency = (customs_doc or {}).get("currency", "USD").upper()
        for it in customs_items:
            qty = it.get("quantity") or 1
            unit_val = float(it.get("unitValue") or 0)
            unit_pgk = unit_val * (_USD_TO_PGK if src_currency == "USD" else 1.0)
            line_pgk = qty * unit_pgk
            grand_total_pgk += line_pgk
            rows.append([
                it.get("description") or "—",
                it.get("hsCode") or "—",
                str(qty),
                f"{unit_pgk:,.2f}",
                f"{line_pgk:,.2f}",
                it.get("countryOfOrigin") or sender.get("country") or "—",
            ])
    else:
        # Fallback to shipment.package
        qty = pieces
        decl_usd = float(pkg.get("declaredValueUSD") or 0)
        unit_pgk = decl_usd * _USD_TO_PGK
        line_pgk = qty * unit_pgk
        grand_total_pgk = line_pgk
        rows.append([
            pkg.get("description") or "Commercial Goods",
            pkg.get("hsCode") or "—",
            str(qty),
            f"{unit_pgk:,.2f}",
            f"{line_pgk:,.2f}",
            sender.get("country") or "—",
        ])

    items_tbl = Table(
        rows,
        colWidths=[55 * mm, 22 * mm, 12 * mm, 30 * mm, 32 * mm, 21 * mm],
        repeatRows=1,
    )
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), DHL_INK),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (-1, 0), (-1, -1), "LEFT"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, DHL_INK),
        ("LINEBELOW", (0, 1), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(items_tbl)

    # ===== TOTAL DECLARED VALUE =====
    total_tbl = Table(
        [["TOTAL DECLARED VALUE", f"{grand_total_pgk:,.2f} PGK"]],
        colWidths=[140 * mm, 32 * mm],
    )
    total_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("BACKGROUND", (0, 0), (-1, -1), DHL_YELLOW),
        ("TEXTCOLOR", (0, 0), (-1, -1), DHL_INK),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(total_tbl)
    story.append(Spacer(1, 8 * mm))

    # ===== DECLARATION =====
    origin_country = sender.get("country") or "the country of origin"
    decl_para = Paragraph(
        f"<i>I declare that the information mentioned above is true and "
        f"correct to the best of my knowledge and that the goods are of "
        f"{origin_country} origin.</i>",
        _S_BODY,
    )
    decl_wrap = Table([[decl_para]], colWidths=[182 * mm])
    decl_wrap.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, colors.HexColor("#9CA3AF")),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(Paragraph("DECLARATION", _S_SECTION))
    story.append(decl_wrap)
    story.append(Spacer(1, 12 * mm))

    # ===== Signature block =====
    sig_left = Paragraph(
        "<b>Authorized Signature:</b><br/><br/><br/>____________________________",
        _S_BODY,
    )
    sig_right = Paragraph(
        f"<b>Name:</b> ____________________<br/><br/>"
        f"<b>Title:</b> ____________________<br/><br/>"
        f"<b>Date:</b> {doc_date_str}",
        _S_BODY,
    )
    sig_tbl = Table([[sig_left, sig_right]], colWidths=[91 * mm, 91 * mm])
    sig_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(sig_tbl)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 3 — COMMERCIAL INVOICE ============
def generate_commercial_invoice(shipment: dict, user: dict, customs_doc: Optional[dict] = None) -> bytes:
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {})

    story = [_header_band("COMMERCIAL INVOICE", awb), Spacer(1, 6 * mm)]

    story.append(_section_title(1, "Exporter, Importer & Bill To"))
    if customs_doc:
        exp = customs_doc.get("exporter") or shipment.get("sender", {})
        imp = customs_doc.get("importer") or shipment.get("receiver", {})
    else:
        exp = shipment.get("sender", {})
        imp = shipment.get("receiver", {})
    # BILL TO defaults to the account holder (the user) — that's who DHL bills.
    bill_to_block = {
        "name": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or "Account Holder",
        "company": user.get("companyName") or "—",
        "address": user.get("address") or "—",
        "city": user.get("city") or "—",
        "country": user.get("country") or "—",
        "postalCode": user.get("postalCode") or "—",
        "phone": user.get("phone") or "—",
        "email": user.get("email") or "—",
    }
    parties_tbl = Table([
        [_fmt_addr_block(exp, "EXPORTER"),
         _fmt_addr_block(imp, "IMPORTER"),
         _fmt_addr_block(bill_to_block, "BILL TO")],
    ], colWidths=[60 * mm, 60 * mm, 60 * mm])
    parties_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(parties_tbl)
    # IOSS / EORI / Other reference numbers per party (placeholder where unknown)
    importer_eori = (customs_doc or {}).get("importer", {}).get("eori") or "—"
    importer_ioss = (customs_doc or {}).get("importer", {}).get("ioss") or "—"
    exporter_eori = (user or {}).get("eori") or "—"
    refs_tbl = Table([
        [Paragraph("<b>IOSS</b> —    <b>EORI</b> " + exporter_eori, _S_BODY),
         Paragraph("<b>IOSS</b> " + importer_ioss + "    <b>EORI</b> " + importer_eori, _S_BODY),
         Paragraph("<b>IOSS</b> —    <b>EORI</b> —", _S_BODY)],
    ], colWidths=[60 * mm, 60 * mm, 60 * mm])
    refs_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
    ]))
    story.append(refs_tbl)
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(2, "Shipment Reference"))
    currency = (customs_doc or {}).get("currency", "USD")
    export_license = (customs_doc or {}).get("exportLicenseNo") or "—"
    import_license = (customs_doc or {}).get("importLicenseNo") or "—"
    reference = (customs_doc or {}).get("reference") or _shipper_reference(awb, shipment)
    incoterms = _expand_incoterms(
        (customs_doc or {}).get("termsOfTrade") or pkg.get("termsOfTrade")
    )
    reason = _expand_reason((customs_doc or {}).get("reasonForExport"))
    story.append(_kv_grid([
        ("Air Waybill No.", awb),
        ("Invoice Date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        ("Country of Origin", shipment.get("origin", {}).get("country", "PG")),
        ("Currency", currency),
        ("Incoterm", incoterms),
        ("Reason for Export", reason),
        ("Carrier", "DHL"),
        ("Export License No.", export_license),
        ("Import License No.", import_license),
        ("Reference", reference),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(3, "Goods Declaration"))
    items = (customs_doc or {}).get("items") or []
    rows = [["#", "Description", "HS Code", "Qty", "Unit Wt (kg)",
             f"Unit Value ({currency})", "Origin", f"Total ({currency})"]]
    grand = 0.0
    total_pkg_weight = float(pkg.get("weightKg") or 0)
    if items:
        # Distribute the shipment's package weight evenly across line items
        # when no per-item unitWeight is supplied (typical for our customs docs).
        total_units = sum((it.get("quantity") or 1) for it in items) or 1
        for i, it in enumerate(items, 1):
            qty = it.get("quantity", 1)
            uv = it.get("unitValue", 0.0)
            line = qty * uv
            grand += line
            unit_wt = it.get("unitWeightKg")
            if unit_wt is None and total_pkg_weight:
                unit_wt = round(total_pkg_weight / total_units, 3)
            unit_wt_str = f"{unit_wt:,.3f}" if unit_wt else "—"
            rows.append([
                str(i), it.get("description", "—"), it.get("hsCode", "—"),
                str(qty), unit_wt_str, f"{uv:,.2f}",
                it.get("countryOfOrigin", "—"), f"{line:,.2f}",
            ])
    else:
        # Fallback to package data
        qty = pkg.get("pieces", 1)
        uv = pkg.get("declaredValueUSD", 0.0)
        grand = qty * uv
        unit_wt = round(total_pkg_weight / max(qty, 1), 3) if total_pkg_weight else None
        unit_wt_str = f"{unit_wt:,.3f}" if unit_wt else "—"
        rows.append([
            "1", pkg.get("description", "General merchandise"), pkg.get("hsCode", "9999.99"),
            str(qty), unit_wt_str, f"{uv:,.2f}",
            shipment.get("origin", {}).get("country", "PG"), f"{grand:,.2f}",
        ])
    items_tbl = Table(rows, colWidths=[7 * mm, 46 * mm, 18 * mm, 11 * mm, 18 * mm, 24 * mm, 16 * mm, 24 * mm])
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(items_tbl)
    story.append(Spacer(1, 4 * mm))
    total_tbl = Table([
        ["Total Declared Value", f"{currency} {grand:,.2f}"]
    ], colWidths=[121 * mm, 55 * mm])
    total_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("BACKGROUND", (0, 0), (-1, -1), DHL_YELLOW),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(total_tbl)
    story.append(Spacer(1, 6 * mm))

    if not customs_doc:
        story.append(Paragraph(
            "<i>(No customs declaration on file — values derived from the "
            "shipment's declared package data.)</i>",
            _S_DISCLAIMER,
        ))
        story.append(Spacer(1, 4 * mm))

    story.append(_section_title(4, "Declaration"))
    signer = (customs_doc or {}).get("signedBy") or f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or "Authorized Signatory"
    sign_date = (customs_doc or {}).get("signatureDate", "")
    if isinstance(sign_date, str) and len(sign_date) >= 10:
        sign_date = sign_date[:10]
    else:
        sign_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    story.append(Paragraph(
        "I declare that the information on this invoice is true and correct, "
        "and that the contents and value of this shipment are as stated above.",
        _S_BODY,
    ))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(
        f"<b>Signed by:</b> {signer}    <b>Date:</b> {sign_date}",
        _S_BODY,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 4 — TAX INVOICE ============
def _tax_invoice_number(awb: str) -> str:
    return f"TAX-{awb[-6:]}-{datetime.now(timezone.utc).strftime('%y%m%d')}"


def generate_tax_invoice(shipment: dict, user: dict) -> bytes:
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    subtotal = float(shipment.get("costPGK") or 0)
    # Sub-charges breakdown (notional split — total still = subtotal)
    freight_iata = round(subtotal * 0.85, 2)
    insurance = round(subtotal * 0.05, 2)
    duty = 0.0
    commercial_value_pgk = round(
        float(shipment.get("package", {}).get("declaredValueUSD") or 0) * 3.7, 2
    )
    pre_tax = freight_iata + insurance + duty + (subtotal - freight_iata - insurance - duty)
    gst = round(pre_tax * 0.10, 2)
    total = round(pre_tax + gst, 2)

    today = datetime.now(timezone.utc)
    due = (today + timedelta(days=14)).strftime("%Y-%m-%d")
    pkg = shipment.get("package", {}) or {}
    origin = shipment.get("origin", {}) or {}
    destination = shipment.get("destination", {}) or {}

    story = [_header_band("TAX INVOICE", awb), Spacer(1, 5 * mm)]

    # ===== DHL legal entity header =====
    story.append(Paragraph(
        "<b>DHL Express (PNG) Ltd</b> · Reimburse To: DHL Express (PNG) Ltd, "
        "Lvl 2, Defens Haus, Port Moresby, Papua New Guinea · "
        "<b>GST Reg No.</b> 500000000",
        _S_BODY,
    ))
    story.append(Spacer(1, 4 * mm))

    # ===== Invoice metadata =====
    story.append(Paragraph("INVOICE DETAILS", _S_SECTION))
    story.append(_kv_grid([
        ("Invoice Number", _tax_invoice_number(awb)),
        ("HAWB Number", awb),
        ("Account Number", (user or {}).get("accountNumber") or "—"),
        ("Invoice Date", today.strftime("%Y-%m-%d")),
        ("Payment Due Date", due),
        ("Service", _service_label(shipment.get("service", ""))),
        ("GST Rate", "10%"),
        ("Currency", "PGK"),
    ]))
    story.append(Spacer(1, 5 * mm))

    # ===== Bill To =====
    story.append(Paragraph("BILL TO", _S_SECTION))
    story.append(Paragraph(
        f"<b>{user.get('companyName', 'Customer')}</b><br/>"
        f"Attn: {user.get('firstName', '')} {user.get('lastName', '')}<br/>"
        f"Email: {user.get('email', '')}<br/>"
        f"Phone: {user.get('phone', '')}",
        _S_BODY,
    ))
    story.append(Spacer(1, 5 * mm))

    # ===== Shipment Details mini-block =====
    story.append(Paragraph("SHIPMENT DETAILS", _S_SECTION))
    story.append(_kv_grid([
        ("Origin", f"{origin.get('city', '')}, {origin.get('country', '')} ({origin.get('code', '')})"),
        ("Destination", f"{destination.get('city', '')}, {destination.get('country', '')} ({destination.get('code', '')})"),
        ("Pieces", str(pkg.get("pieces", "—"))),
        ("Weight", f"{pkg.get('weightKg', '—')} kg"),
        ("Contents", pkg.get("description", "—")),
        ("Assessed Value", f"USD {pkg.get('declaredValueUSD', 0):,.2f}"),
        ("Arrival Date", (shipment.get("actualDelivery") or shipment.get("estimatedDelivery") or "—")[:10]),
    ]))
    story.append(Spacer(1, 5 * mm))

    # ===== Charges =====
    story.append(Paragraph("BILLING DETAILS", _S_SECTION))
    rows = [
        ["Description", "Amount (PGK)"],
        ["Commercial Value", f"{commercial_value_pgk:,.2f}"],
        ["Freight (IATA)", f"{freight_iata:,.2f}"],
        ["Insurance", f"{insurance:,.2f}"],
        ["Duty", f"{duty:,.2f}"],
        [f"Other freight charges ({_service_label(shipment.get('service', ''))})",
         f"{(subtotal - freight_iata - insurance):,.2f}"],
    ]
    tbl = Table(rows, colWidths=[121 * mm, 55 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 3 * mm))

    totals = Table([
        ["Subtotal", f"PGK {pre_tax:,.2f}"],
        ["GST (10%)", f"PGK {gst:,.2f}"],
        ["Total Payable", f"PGK {total:,.2f}"],
    ], colWidths=[121 * mm, 55 * mm])
    totals.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("FONTSIZE", (0, 2), (-1, 2), 11),
        ("BACKGROUND", (0, 2), (-1, 2), DHL_YELLOW),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEABOVE", (0, 2), (-1, 2), 1, DHL_INK),
    ]))
    story.append(totals)
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph(
        "<b>Payment Terms:</b> Net 14 days from invoice date. "
        "Late payments may attract interest at the prevailing rate.",
        _S_BODY,
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "<i>This is a computer-generated invoice. No signature required. "
        "GST is charged at the prevailing rate of 10%.</i>",
        _S_DISCLAIMER,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 5 — INBOUND INVOICE ============
def _inbound_invoice_number(awb: str) -> str:
    return f"INB-{awb[-6:]}-{datetime.now(timezone.utc).strftime('%y%m%d')}"


def _irn(awb: str) -> str:
    """Mock 16-char Invoice Reference Number (deterministic per AWB+date)."""
    seed = f"{awb}-{datetime.now(timezone.utc).strftime('%Y%m%d')}"
    return hashlib.sha256(seed.encode()).hexdigest()[:16].upper()


def generate_inbound_invoice(shipment: dict, user: dict) -> bytes:
    """Receiver-side invoice — for inbound (imported) shipments. Charges
    listed are import duties/clearance fees on a notional basis."""
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    declared_usd = float(shipment.get("package", {}).get("declaredValueUSD") or 0)
    duty_pct = 0.05
    clearance_fee_pgk = 50.0
    declared_pgk = declared_usd * 3.7
    duty_pgk = round(declared_pgk * duty_pct, 2)
    advance_payment = 0.0
    pre_tax = duty_pgk + clearance_fee_pgk
    gst_pgk = round(pre_tax * 0.10, 2)
    total_pgk = round(pre_tax + gst_pgk - advance_payment, 2)

    today = datetime.now(timezone.utc)
    due = (today + timedelta(days=14)).strftime("%Y-%m-%d")
    pkg = shipment.get("package", {}) or {}
    origin = shipment.get("origin", {}) or {}
    destination = shipment.get("destination", {}) or {}
    receiver = shipment.get("receiver", {}) or {}

    story = [_header_band("INBOUND INVOICE", awb), Spacer(1, 4 * mm)]

    # ORIGINAL FOR RECIPIENT marker (top-right of content)
    story.append(Paragraph(
        '<para alignment="right"><font color="#D40511" size="8"><b>'
        'ORIGINAL FOR RECIPIENT</b></font></para>',
        _S_BODY,
    ))
    story.append(Spacer(1, 4 * mm))

    # ===== Invoice metadata =====
    story.append(Paragraph("INVOICE DETAILS", _S_SECTION))
    story.append(_kv_grid([
        ("Invoice Number", _inbound_invoice_number(awb)),
        ("HAWB Number", awb),
        ("Account Number", (user or {}).get("accountNumber") or "—"),
        ("Invoice Date", today.strftime("%Y-%m-%d")),
        ("Payment Due Date", due),
        ("Currency", "PGK"),
        ("Place of Supply", destination.get("country") or "—"),
    ]))
    story.append(Spacer(1, 5 * mm))

    # ===== Receiver / Importer of Record =====
    story.append(Paragraph("RECEIVER (IMPORTER OF RECORD)", _S_SECTION))
    story.append(_fmt_addr_block(receiver, "RECEIVER"))
    story.append(Spacer(1, 5 * mm))

    # ===== Shipment Details =====
    story.append(Paragraph("SHIPMENT DETAILS", _S_SECTION))
    story.append(_kv_grid([
        ("Contents", pkg.get("description") or "—"),
        ("Assessed Value", f"USD {declared_usd:,.2f}"),
        ("Origin", f"{origin.get('city', '')}, {origin.get('country', '')} ({origin.get('code', '')})"),
        ("Destination", f"{destination.get('city', '')}, {destination.get('country', '')} ({destination.get('code', '')})"),
        ("Pieces", str(pkg.get("pieces", "—"))),
        ("Weight", f"{pkg.get('weightKg', '—')} kg"),
        ("Arrival Date", (shipment.get("actualDelivery") or shipment.get("estimatedDelivery") or "—")[:10]),
        ("Service", _service_label(shipment.get("service", ""))),
    ]))
    story.append(Spacer(1, 5 * mm))

    # ===== Billing Details =====
    story.append(Paragraph("BILLING DETAILS", _S_SECTION))
    rows = [
        ["Description", "Amount (PGK)"],
        [f"Import duty ({int(duty_pct * 100)}% × declared value)", f"{duty_pgk:,.2f}"],
        ["Customs clearance fee", f"{clearance_fee_pgk:,.2f}"],
    ]
    tbl = Table(rows, colWidths=[121 * mm, 55 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 3 * mm))

    totals = Table([
        ["Subtotal", f"PGK {pre_tax:,.2f}"],
        ["GST (10%)", f"PGK {gst_pgk:,.2f}"],
        ["Advance Payment", f"PGK -{advance_payment:,.2f}"],
        ["Total Amount Payable on Arrival", f"PGK {total_pgk:,.2f}"],
    ], colWidths=[121 * mm, 55 * mm])
    totals.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("FONTNAME", (0, 3), (-1, 3), "Helvetica-Bold"),
        ("FONTSIZE", (0, 3), (-1, 3), 11),
        ("BACKGROUND", (0, 3), (-1, 3), DHL_YELLOW),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEABOVE", (0, 3), (-1, 3), 1, DHL_INK),
    ]))
    story.append(totals)
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph(
        "<b>Payment Terms:</b> Cash on delivery unless otherwise agreed. "
        "Total due on arrival of the consignment in the destination country.",
        _S_BODY,
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f"<b>IRN (Invoice Reference Number):</b> {_irn(awb)}",
        _S_BODY,
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "<i>This Inbound Invoice covers import-side duties and clearance "
        "charges payable to deliver the shipment to the consignee. "
        "Conversion rates and duty percentages are indicative for the demo.</i>",
        _S_DISCLAIMER,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 6 — SHIPMENT DECLARATION ============
def generate_shipment_declaration(shipment: dict, user: dict, customs_doc: Optional[dict] = None) -> bytes:
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)

    story = [_header_band("SHIPMENT DECLARATION", awb), Spacer(1, 6 * mm)]

    story.append(Paragraph(
        "I, the undersigned shipper, hereby certify that the contents of this "
        "shipment are accurately described below and that the declared value, "
        "country of origin, and commodity classification are true and correct.",
        _S_BODY,
    ))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(1, "Shipper Identification"))
    story.append(_fmt_addr_block(shipment.get("sender", {}), "SHIPPER"))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(2, "Consignee"))
    story.append(_fmt_addr_block(shipment.get("receiver", {}), "CONSIGNEE"))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(3, "Shipment Particulars"))
    story.append(_kv_grid(_common_shipment_kv(shipment)))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(4, "Export Declaration"))
    if customs_doc and customs_doc.get("items"):
        currency = customs_doc.get("currency", "USD")
        rows = [["#", "Description", "HS Code", "Qty", f"Unit Value ({currency})", "Origin"]]
        for i, it in enumerate(customs_doc["items"], 1):
            rows.append([
                str(i), it.get("description", "—"), it.get("hsCode", "—"),
                str(it.get("quantity", 1)), f"{it.get('unitValue', 0):,.2f}",
                it.get("countryOfOrigin", "—"),
            ])
        tbl = Table(rows, colWidths=[8 * mm, 70 * mm, 22 * mm, 14 * mm, 32 * mm, 30 * mm])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7.5),
            ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(tbl)
    else:
        story.append(Paragraph(
            "<i>(No customs declaration on file — basic shipment particulars "
            "above stand as the shipper's declaration for this consignment.)</i>",
            _S_DISCLAIMER,
        ))
    story.append(Spacer(1, 8 * mm))

    story.append(_section_title(5, "Reason for Export & Terms"))
    type_of_export = EXPORT_TYPE_LABEL.get(
        ((customs_doc or {}).get("exportType") or "").upper(), "Permanent"
    )
    story.append(_kv_grid([
        ("Reason for Export", _expand_reason((customs_doc or {}).get("reasonForExport"))),
        ("Type of Export", type_of_export),
        ("Terms of Trade", _expand_incoterms(
            (customs_doc or {}).get("termsOfTrade")
            or shipment.get("package", {}).get("termsOfTrade")
        )),
        ("Country of Origin", shipment.get("origin", {}).get("country", "PG")),
    ]))
    story.append(Spacer(1, 10 * mm))

    signer = (customs_doc or {}).get("signedBy") or f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or "Authorized Signatory"
    sign_date = (customs_doc or {}).get("signatureDate", "")
    if isinstance(sign_date, str) and len(sign_date) >= 10:
        sign_date = sign_date[:10]
    else:
        sign_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sig_tbl = Table([
        [Paragraph("<b>Shipper's Signature</b><br/><br/>_____________________________", _S_BODY),
         Paragraph(f"<b>Name</b><br/>{signer}", _S_BODY),
         Paragraph(f"<b>Date</b><br/>{sign_date}", _S_BODY)],
    ], colWidths=[70 * mm, 50 * mm, 40 * mm])
    sig_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(sig_tbl)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 7 — PROOF OF DELIVERY ============
def generate_pod(shipment: dict, user: dict) -> bytes:
    """Proof of Delivery — confirmation that the shipment was received.

    DHL Mapping: Tracking Service (§3) — post-delivery confirmation form.
    Fields per the reference POD: Service Area / Service / Shipment Status /
    Signed / Signature / Piece IDs / Reference / Picked Up date.
    """
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {}) or {}
    origin = shipment.get("origin", {}) or {}
    destination = shipment.get("destination", {}) or {}
    receiver = shipment.get("receiver", {}) or {}

    delivered = shipment.get("actualDelivery") or shipment.get("estimatedDelivery") or ""
    if isinstance(delivered, str) and len(delivered) >= 10:
        try:
            d = datetime.fromisoformat(delivered.replace("Z", "+00:00"))
            delivered_str = d.strftime("%d %b %Y at %H:%M")
        except Exception:
            delivered_str = delivered[:10]
    else:
        delivered_str = "—"
    status = shipment.get("status", "—").replace("_", " ").title()
    pieces = pkg.get("pieces") or 1
    piece_ids = ", ".join([f"{awb}-{i:03d}" for i in range(1, pieces + 1)])
    signed_by = (
        (shipment.get("deliverySignature") or {}).get("name")
        or receiver.get("name") or "—"
    )

    story = [_header_band("PROOF OF DELIVERY", awb), Spacer(1, 6 * mm)]

    story.append(Paragraph(
        f"<b>Dear Customer,</b><br/><br/>"
        f"This is a proof of delivery / statement of final status for the "
        f"shipment with waybill number <b>{awb}</b>. "
        f"Your shipment was <b>{status.lower()}</b> on <b>{delivered_str}</b>. "
        f"Thank you for choosing DHL Express.",
        _S_BODY,
    ))
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("DELIVERY DETAILS", _S_SECTION))
    story.append(_kv_grid([
        ("Shipment Status", status),
        ("Signed By", signed_by),
        ("Signature Date", delivered_str),
        ("Origin Service Area",
         f"{origin.get('city', '')} ({origin.get('code', '—')})"),
        ("Destination Service Area",
         f"{destination.get('city', '')} ({destination.get('code', '—')})"),
        ("Service", _service_label(shipment.get("service", ""))),
        ("Shipper's Reference", _shipper_reference(awb, shipment)),
        ("Piece ID(s)", piece_ids[:80]),
    ]))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("ADDITIONAL SHIPMENT DETAILS", _S_SECTION))
    story.append(_kv_grid([
        ("Total Pieces", str(pieces)),
        ("Total Weight", f"{pkg.get('weightKg', '—')} kg"),
        ("Contents", pkg.get("description") or "—"),
        ("Declared Value", f"USD {pkg.get('declaredValueUSD', 0):,.2f}"),
        ("Picked Up", (shipment.get("createdAt") or "")[:10] or "—"),
    ]))
    story.append(Spacer(1, 10 * mm))

    # Signature image block (printed area for hand signature)
    sig_box = Table([
        [Paragraph("<b>Receiver's Signature</b><br/><br/><br/><br/>"
                   "_____________________________", _S_BODY),
         Paragraph(f"<b>Name</b><br/>{signed_by}<br/><br/>"
                   f"<b>Date</b><br/>{delivered_str}", _S_BODY)],
    ], colWidths=[110 * mm, 70 * mm])
    sig_box.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(sig_box)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 8 — CERTIFICATE OF ORIGIN ============
def generate_certificate_of_origin(shipment: dict, user: dict,
                                   customs_doc: Optional[dict] = None) -> bytes:
    """Certificate of Origin — exporter declares goods are products of a
    specified country.

    DHL Mapping: §6 Customs supporting paperwork — Certificate of Origin.
    """
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {}) or {}
    sender = shipment.get("sender", {}) or {}
    receiver = shipment.get("receiver", {}) or {}
    origin_country = sender.get("country") or shipment.get("origin", {}).get("country") or "—"

    story = [_header_band("CERTIFICATE OF ORIGIN", awb), Spacer(1, 5 * mm)]

    # Top metadata
    story.append(_kv_grid([
        ("B/L or AWB Number", awb),
        ("Booking / Shipment Number",
         _shipper_reference(awb, shipment)),
        ("Invoice #", _proforma_invoice_number(awb).replace("PRO-", "INV-")),
        ("Issue Date", datetime.now(timezone.utc).strftime("%d %b %Y")),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("SHIPPER / EXPORTER", _S_SECTION))
    story.append(_fmt_addr_block(sender, "EXPORTER"))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("CONSIGNEE", _S_SECTION))
    story.append(_fmt_addr_block(receiver, "CONSIGNEE"))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("TRANSPORTATION & ROUTING", _S_SECTION))
    story.append(_kv_grid([
        ("Country of Origin", origin_country),
        ("Exporting Carrier", "DHL Express"),
        ("Transportation Method", "Air"),
        ("Port of Loading / Export", shipment.get("origin", {}).get("city", "—")),
        ("Place of Receipt", shipment.get("origin", {}).get("city", "—")),
        ("Place of Delivery", shipment.get("destination", {}).get("city", "—")),
        ("Foreign Port of Unloading", shipment.get("destination", {}).get("city", "—")),
    ]))
    story.append(Spacer(1, 5 * mm))

    # Goods description table
    story.append(Paragraph("DESCRIPTION OF GOODS", _S_SECTION))
    items = (customs_doc or {}).get("items") or []
    rows = [["#", "Description (Model/Serial)", "HS Code", "Pkgs", "Gross Wt (kg)", "Measurement"]]
    total_pkgs = pkg.get("pieces") or 1
    total_weight = pkg.get("weightKg") or 0
    dims = pkg.get("dimensions") or {}
    measurement = (
        f"{dims.get('l', dims.get('length', '?'))}×"
        f"{dims.get('w', dims.get('width', '?'))}×"
        f"{dims.get('h', dims.get('height', '?'))} cm"
        if dims else "—"
    )
    if items:
        for i, it in enumerate(items, 1):
            qty = it.get("quantity", 1)
            rows.append([
                str(i),
                it.get("description") or "—",
                it.get("hsCode") or "—",
                str(qty),
                f"{(total_weight / max(len(items), 1)):,.3f}",
                measurement if i == 1 else "—",
            ])
    else:
        rows.append([
            "1",
            pkg.get("description") or "General merchandise",
            pkg.get("hsCode") or "—",
            str(total_pkgs),
            f"{total_weight:,.3f}",
            measurement,
        ])
    items_tbl = Table(rows, colWidths=[8 * mm, 60 * mm, 22 * mm, 18 * mm, 28 * mm, 40 * mm])
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(items_tbl)
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph(
        f"The undersigned, for and on behalf of "
        f"<b>{sender.get('company', '—')}</b>, acknowledges that the goods "
        f"described above and being shipped on "
        f"<b>{datetime.now(timezone.utc).strftime('%d %b %Y')}</b> and "
        f"consigned as indicated are products of "
        f"<b>{origin_country}</b>.",
        _S_BODY,
    ))
    story.append(Spacer(1, 14 * mm))

    sig_tbl = Table([
        [Paragraph("<b>Signature of Owner / Agent</b><br/><br/><br/>"
                   "____________________________", _S_BODY),
         Paragraph(f"<b>Name</b><br/>"
                   f"{user.get('firstName', '')} {user.get('lastName', '')}",
                   _S_BODY),
         Paragraph(f"<b>Title</b><br/>Authorized Signatory<br/><br/>"
                   f"<b>Date</b><br/>"
                   f"{datetime.now(timezone.utc).strftime('%d %b %Y')}",
                   _S_BODY)],
    ], colWidths=[70 * mm, 60 * mm, 50 * mm])
    sig_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(sig_tbl)

    # Official-stamp area
    story.append(Spacer(1, 6 * mm))
    stamp = Table([[Paragraph(
        "<i>Official Chamber of Commerce stamp area</i><br/>"
        "(Reserved for the issuing authority's seal)",
        _S_DISCLAIMER,
    )]], colWidths=[90 * mm])
    stamp.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#9CA3AF")),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(stamp)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 9 — LETTER OF AUTHORIZATION ============
def generate_letter_of_authorization(shipment: dict, user: dict) -> bytes:
    """Letter of Authorization — customer authorizes DHL to handle customs
    declarations on their behalf.

    DHL Mapping: §6 Customs supporting paperwork — broker authorization.
    """
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    sender = shipment.get("sender", {}) or {}

    story = [_header_band("LETTER OF AUTHORIZATION", awb), Spacer(1, 6 * mm)]

    story.append(Paragraph("CONFIRMATION", _S_SECTION))
    story.append(Paragraph(
        f"We herewith confirm that <b>{sender.get('company') or '—'}</b> "
        f"agrees to approve and pay the charges marked below for the "
        f"following shipment(s):",
        _S_BODY,
    ))
    story.append(Spacer(1, 4 * mm))

    story.append(_kv_grid([
        ("Airwaybill (AWB) Number", awb),
        ("Origin", shipment.get("origin", {}).get("city", "—")),
        ("Destination", shipment.get("destination", {}).get("city", "—")),
    ]))
    story.append(Spacer(1, 5 * mm))

    # Charges to approve — three checkbox-style rows (☐/☒)
    story.append(Paragraph("CHARGES AUTHORIZED", _S_SECTION))
    rows = [
        ["☒", "All transport charges"],
        ["☒", "All duty and/or VAT charges"],
        ["☒", "Both transport charges and duty and/or VAT charges"],
    ]
    cb_tbl = Table(rows, colWidths=[10 * mm, 170 * mm])
    cb_tbl.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(cb_tbl)
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "<i>Besides the imposed duty and VAT, the charge may be increased "
        "with additional Customs Services as may be required to perform "
        "your Customs declaration.</i>",
        _S_DISCLAIMER,
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("PAYMENT / CONTACT INFORMATION", _S_SECTION))
    story.append(Paragraph(
        "Please bill these charges to our local or international DHL "
        "Express account number:",
        _S_BODY,
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(_kv_grid([
        ("DHL Account Number", (user or {}).get("accountNumber") or "—"),
        ("Company Name", sender.get("company") or "—"),
        ("Contact Name", f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or "—"),
        ("Contact Role", "Authorized Signatory"),
        ("Contact Phone", user.get("phone") or sender.get("phone") or "—"),
        ("Contact Email", user.get("email") or "—"),
    ]))
    story.append(Spacer(1, 12 * mm))

    sig_tbl = Table([
        [Paragraph("<b>Signature</b><br/><br/><br/>"
                   "____________________________", _S_BODY),
         Paragraph(f"<b>Name</b><br/>"
                   f"{user.get('firstName', '')} {user.get('lastName', '')}<br/><br/>"
                   f"<b>Date</b><br/>"
                   f"{datetime.now(timezone.utc).strftime('%d %b %Y')}",
                   _S_BODY)],
    ], colWidths=[100 * mm, 80 * mm])
    sig_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(Paragraph("SIGNATURE", _S_SECTION))
    story.append(Paragraph(
        "I have correctly filled all fields and hereby sign this document.",
        _S_BODY,
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(sig_tbl)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 10 — PACKING LIST ============
def generate_packing_list(shipment: dict, user: dict,
                          customs_doc: Optional[dict] = None) -> bytes:
    """Packing List — itemized list with weights and dimensions per line.

    DHL Mapping: §6 Customs supporting paperwork — Packing List.
    """
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {}) or {}
    sender = shipment.get("sender", {}) or {}
    receiver = shipment.get("receiver", {}) or {}

    story = [_header_band("PACKING LIST", awb), Spacer(1, 5 * mm)]

    story.append(_kv_grid([
        ("Air Waybill No.", awb),
        ("Export Date", datetime.now(timezone.utc).strftime("%d %b %Y")),
        ("Invoice No.", _proforma_invoice_number(awb).replace("PRO-", "INV-")),
        ("Total CBM (m³)", _calc_cbm(pkg)),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("SHIPPER / EXPORTER", _S_SECTION))
    story.append(_addr_kv_block(sender, contact_label="Contact",
                                tax_label="Tax ID",
                                tax_value=(user or {}).get("companyTaxId")))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("CONSIGNEE / SOLD TO", _S_SECTION))
    importer = ((customs_doc or {}).get("importer") or {}) if customs_doc else {}
    story.append(_addr_kv_block(receiver, contact_label="Contact",
                                tax_label="Tax ID",
                                tax_value=importer.get("taxId")))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("SHIPMENT DETAILS", _S_SECTION))
    origin = shipment.get("origin", {}) or {}
    destination = shipment.get("destination", {}) or {}
    story.append(_kv_grid([
        ("Country of Origin", origin.get("country") or "—"),
        ("Country of Destination", destination.get("country") or "—"),
        ("Port of Loading", origin.get("city") or "—"),
        ("Port of Discharge", destination.get("city") or "—"),
    ]))
    story.append(Spacer(1, 5 * mm))

    # Items table
    story.append(Paragraph("PACKED ITEMS", _S_SECTION))
    items = (customs_doc or {}).get("items") or []
    rows = [["Box #", "Qty Packages", "Description",
             "Net Wt (kg)", "Gross Wt (kg)", "Dimensions (cm)"]]
    total_weight = pkg.get("weightKg") or 0
    dims = pkg.get("dimensions") or {}
    dim_str = (
        f"{dims.get('l', dims.get('length', '?'))}×"
        f"{dims.get('w', dims.get('width', '?'))}×"
        f"{dims.get('h', dims.get('height', '?'))}"
        if dims else "—"
    )
    if items:
        per_line = total_weight / max(len(items), 1) if total_weight else 0
        for i, it in enumerate(items, 1):
            qty = it.get("quantity", 1)
            net = per_line * 0.95  # crude 5% packaging deduction
            gross = per_line
            rows.append([
                str(i), str(qty), it.get("description") or "—",
                f"{net:,.3f}" if net else "—",
                f"{gross:,.3f}" if gross else "—",
                dim_str,
            ])
    else:
        net = total_weight * 0.95 if total_weight else 0
        rows.append([
            "1", str(pkg.get("pieces") or 1),
            pkg.get("description") or "General merchandise",
            f"{net:,.3f}" if net else "—",
            f"{total_weight:,.3f}" if total_weight else "—",
            dim_str,
        ])
    rows.append([
        "TOTAL",
        str(sum((it.get("quantity") or 1) for it in items) or (pkg.get("pieces") or 1)),
        "",
        f"{(total_weight or 0) * 0.95:,.3f}",
        f"{total_weight or 0:,.3f}",
        "",
    ])
    pl_tbl = Table(rows, colWidths=[16 * mm, 22 * mm, 60 * mm, 26 * mm, 26 * mm, 32 * mm])
    pl_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), DHL_YELLOW),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(pl_tbl)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


def _calc_cbm(pkg: dict) -> str:
    dims = pkg.get("dimensions") or {}
    if not dims:
        return "—"
    l = dims.get("l") or dims.get("length") or 0
    w = dims.get("w") or dims.get("width") or 0
    h = dims.get("h") or dims.get("height") or 0
    try:
        cbm = (float(l) / 100.0) * (float(w) / 100.0) * (float(h) / 100.0)
        return f"{cbm:.4f}"
    except Exception:
        return "—"


# ============ DOCUMENT 11 — SHIPMENT RECEIPT ============
def generate_shipment_receipt(shipment: dict, user: dict) -> bytes:
    """Shipment Receipt — receipt slip with sender/receiver/charge summary.

    DHL Mapping: Internal — receipt issued at booking. Not a DHL XML
    operation, but a customer-facing artifact.
    """
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {}) or {}
    sender = shipment.get("sender", {}) or {}
    receiver = shipment.get("receiver", {}) or {}

    cost_pgk = float(shipment.get("costPGK") or 0)
    declared_usd = float(pkg.get("declaredValueUSD") or 0)
    dims = pkg.get("dimensions") or {}
    if dims:
        l = dims.get("l") or dims.get("length") or 0
        w = dims.get("w") or dims.get("width") or 0
        h = dims.get("h") or dims.get("height") or 0
        try:
            dim_weight = (float(l) * float(w) * float(h)) / 5000.0
        except Exception:
            dim_weight = 0
    else:
        dim_weight = 0
    actual_weight = float(pkg.get("weightKg") or 0)
    chargeable_weight = max(actual_weight, dim_weight)

    story = [_header_band("SHIPMENT RECEIPT", awb), Spacer(1, 5 * mm)]

    # Two-column shipment-from / shipment-to
    story.append(Paragraph("SHIPMENT PARTIES", _S_SECTION))
    story.append(_two_col_addr(
        _fmt_addr_block(sender, "SHIPMENT FROM"),
        _fmt_addr_block(receiver, "SHIPMENT TO"),
    ))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("SHIPMENT DETAILS", _S_SECTION))
    created = (shipment.get("createdAt") or "")[:10] or "—"
    eta = (shipment.get("estimatedDelivery") or "")[:10] or "—"
    story.append(_kv_grid([
        ("Shipment Date", created),
        ("Waybill Number", awb),
        ("Service Type", _service_label(shipment.get("service", ""))),
        ("Packaging Type",
         _expand_package_type(pkg.get("type"))),
        ("Number of Pieces", str(pkg.get("pieces") or 1)),
        ("Total Weight", f"{actual_weight:,.2f} kg"),
        ("Dimensional Weight", f"{dim_weight:,.2f} kg"),
        ("Chargeable Weight", f"{chargeable_weight:,.2f} kg"),
        ("Declared Value", f"USD {declared_usd:,.2f}"),
        ("Dutiable Status", "Dutiable" if declared_usd > 0 else "Non-Dutiable"),
        ("Estimated Delivery Date", eta),
        ("Terms of Trade",
         _expand_incoterms(pkg.get("termsOfTrade"))),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("BILLING INFORMATION", _S_SECTION))
    story.append(_kv_grid([
        ("Payment Type", "DHL Account Number"),
        ("Billing Account", (user or {}).get("accountNumber") or "—"),
        ("Duties & Taxes Account",
         (user or {}).get("dutyAccountNumber") or "Shipper"),
        ("Total Charge", f"PGK {cost_pgk:,.2f}"),
        ("Special Services", "Fuel Surcharge / Duties and Taxes Paid"),
    ]))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph(
        "<i>This charge is estimated until DHL re-weighs the shipment and "
        "may not include all fees and surcharges. Shipments paid by credit "
        "card: if the final billed amount exceeds the original pre-authorised "
        "amount, you will receive a second charge for the additional amount.</i>",
        _S_DISCLAIMER,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 12 — PAYMENT CONFIRMATION ============
def generate_payment_confirmation(shipment: dict, user: dict,
                                  payment: Optional[dict] = None) -> bytes:
    """Payment Confirmation — proof that a shipment's freight cost was paid.

    DHL Mapping: Internal billing — receipt for a payment processed via
    the `/api/payments/charge` endpoint or recorded by the back-office.
    """
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {}) or {}
    receiver = shipment.get("receiver", {}) or {}
    cost_pgk = float(shipment.get("costPGK") or 0)
    vat_rate = 0.10
    vat = round(cost_pgk * vat_rate, 2)
    total_with_vat = round(cost_pgk + vat, 2)

    pay_method = (payment or {}).get("method") or "DHL Account"
    pay_ref = (payment or {}).get("transactionId") or (
        f"TXN-{hashlib.sha256(awb.encode()).hexdigest()[:10].upper()}"
    )
    pay_status = (payment or {}).get("status") or "Paid"
    pay_date_iso = (payment or {}).get("paidAt") or datetime.now(timezone.utc).isoformat()
    try:
        pay_date = datetime.fromisoformat(pay_date_iso.replace("Z", "+00:00")).strftime("%d-%m-%Y %H:%M")
    except Exception:
        pay_date = datetime.now(timezone.utc).strftime("%d-%m-%Y %H:%M")

    story = [_header_band("PAYMENT CONFIRMATION", awb), Spacer(1, 5 * mm)]

    # Receipt header
    story.append(_kv_grid([
        ("Date", pay_date),
        ("Payment Reference", pay_ref),
        ("Status", pay_status),
        ("Method", pay_method),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("INVOICE FOR", _S_SECTION))
    story.append(Paragraph(
        f"<b>{user.get('companyName', 'Customer')}</b><br/>"
        f"{user.get('firstName', '')} {user.get('lastName', '')}<br/>"
        f"{user.get('phone', '—')}<br/>"
        f"{user.get('email', '—')}",
        _S_BODY,
    ))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("SHIPMENT REFERENCE", _S_SECTION))
    story.append(_kv_grid([
        ("Waybill Number", awb),
        ("Your Reference", _shipper_reference(awb, shipment)),
        ("Name Receiver", receiver.get("name") or "—"),
        ("Destination", shipment.get("destination", {}).get("country") or "—"),
        ("Services",
         f"{_service_label(shipment.get('service', ''))}, "
         f"Increased Liability" if (pkg.get('insuranceValueUSD') or 0) > 0
         else _service_label(shipment.get("service", ""))),
    ]))
    story.append(Spacer(1, 5 * mm))

    # VAT table
    story.append(Paragraph("CHARGES", _S_SECTION))
    rows = [
        ["VAT Rate", "Price (excl. VAT)", "VAT", "Total (incl. VAT)"],
        [f"{int(vat_rate * 100)}%",
         f"PGK {cost_pgk:,.2f}",
         f"PGK {vat:,.2f}",
         f"PGK {total_with_vat:,.2f}"],
        ["(Sub)totals",
         f"PGK {cost_pgk:,.2f}",
         f"PGK {vat:,.2f}",
         f"PGK {total_with_vat:,.2f}"],
    ]
    vat_tbl = Table(rows, colWidths=[35 * mm, 50 * mm, 30 * mm, 65 * mm])
    vat_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(vat_tbl)
    story.append(Spacer(1, 4 * mm))

    paid = Table([
        ["TOTAL AMOUNT PAID", f"PGK {total_with_vat:,.2f}"]
    ], colWidths=[121 * mm, 55 * mm])
    paid.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("BACKGROUND", (0, 0), (-1, -1), DHL_YELLOW),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(paid)
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph(
        "<i>The shipment costs were paid directly online at the purchase of "
        "the shipping label. Purchased shipping labels cannot be refunded. "
        "Our general terms and conditions apply to this purchase.</i>",
        _S_DISCLAIMER,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()

