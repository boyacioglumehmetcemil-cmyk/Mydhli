"""Shipping document PDF generators.

Six original A4-portrait document templates auto-populated from a shipment
record. The layouts are our own — not pixel-replicas of any carrier's form.
All generators return PDF bytes.

DHL Mapping (collectively): supports DHL XML Services Guide §5 Shipment
Validation (Dutiable block) + §7 Label Image. Tax / Inbound / Proforma
invoices are internal SaaS-billing layer additions not in the DHL spec.
"""
from io import BytesIO
from datetime import datetime, timezone
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
    """Yellow header band with brand + doc type title + AWB barcode."""
    bc_buf = _barcode_png(awb)
    bc_img = PlatyImage(bc_buf, width=58 * mm, height=14 * mm)
    left_html = (
        "<font color='#1A1A1A'><b>DHL</b></font> "
        "<font color='#D40511'><b>Express</b></font><br/>"
        "<font size='7' color='#666'>Demo Document — for pitch & prototyping only</font>"
    )
    right_html = (
        f"<font size='15'><b>{doc_type}</b></font><br/>"
        f"<font size='9' color='#666'>AWB {awb}</font>"
    )
    tbl = Table(
        [[Paragraph(left_html, _S_BRAND), Paragraph(right_html, _S_TITLE), bc_img]],
        colWidths=[60 * mm, 50 * mm, 60 * mm],
    )
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), DHL_YELLOW),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
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
    """Create a BaseDocTemplate that prints footer info on every page."""
    buf = BytesIO()

    def _draw_footer(canv, _doc):
        canv.saveState()
        canv.setStrokeColor(colors.HexColor("#E5E7EB"))
        canv.setLineWidth(0.5)
        canv.line(13 * mm, 14 * mm, A4[0] - 13 * mm, 14 * mm)
        canv.setFont("Helvetica", 7)
        canv.setFillColor(colors.HexColor("#666"))
        gen_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        canv.drawString(13 * mm, 10 * mm, f"Generated {gen_ts}  ·  AWB {awb}  ·  DHL Express (Demo)")
        canv.setFont("Helvetica-Oblique", 6.5)
        canv.setFillColor(colors.HexColor("#999"))
        canv.drawRightString(A4[0] - 13 * mm, 10 * mm,
                             "Demo Document — for pitch and prototyping only")
        canv.setFont("Helvetica", 7)
        canv.setFillColor(colors.HexColor("#666"))
        canv.drawRightString(A4[0] - 13 * mm, 6 * mm, f"Page {canv.getPageNumber()}")
        canv.restoreState()

    doc = BaseDocTemplate(
        buf, pagesize=A4,
        leftMargin=13 * mm, rightMargin=13 * mm,
        topMargin=13 * mm, bottomMargin=18 * mm,
        title="DHL Express Shipment Document",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin,
                  doc.width, doc.height, id="content")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=_draw_footer)])
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
def generate_air_waybill(shipment: dict, user: dict) -> bytes:
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    story = [_header_band("AIR WAYBILL", awb), Spacer(1, 6 * mm)]

    story.append(_section_title(1, "Shipper & Consignee"))
    story.append(_two_col_addr(
        _fmt_addr_block(shipment.get("sender", {}), "SHIPPER"),
        _fmt_addr_block(shipment.get("receiver", {}), "CONSIGNEE"),
    ))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(2, "Routing & Service"))
    story.append(_kv_grid(_common_shipment_kv(shipment)))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(3, "Charges"))
    cost = shipment.get("costPGK") or 0
    story.append(_kv_grid([
        ("Freight Charge", _money(cost)),
        ("Terms of Trade", "DAP (Delivered At Place)"),
        ("Currency", "PGK"),
    ]))
    story.append(Spacer(1, 5 * mm))

    # Tracking QR
    qr_buf = _qr_png(f"https://tracking.dhl-demo.local/{awb}")
    qr_img = PlatyImage(qr_buf, width=28 * mm, height=28 * mm)
    sign = Paragraph(
        "<b>Shipper's Signature</b><br/><br/><br/>"
        "_________________________<br/>"
        f"<font size='8' color='#666'>{user.get('firstName', '')} {user.get('lastName', '')}, "
        f"{user.get('companyName', '')}</font>",
        _S_BODY,
    )
    foot_tbl = Table([[sign, qr_img]], colWidths=[125 * mm, 32 * mm])
    foot_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(_section_title(4, "Signature & Tracking"))
    story.append(foot_tbl)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 2 — PROFORMA INVOICE ============
def generate_proforma_invoice(shipment: dict, user: dict) -> bytes:
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {})
    qty = pkg.get("pieces", 1)
    unit_value_usd = pkg.get("declaredValueUSD", 0)
    subtotal_usd = qty * unit_value_usd

    story = [_header_band("PROFORMA INVOICE", awb), Spacer(1, 6 * mm)]

    story.append(_section_title(1, "Seller & Buyer"))
    story.append(_two_col_addr(
        _fmt_addr_block(shipment.get("sender", {}), "SELLER"),
        _fmt_addr_block(shipment.get("receiver", {}), "BUYER"),
    ))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(2, "Shipment Reference"))
    story.append(_kv_grid([
        ("Air Waybill No.", awb),
        ("Date of Issue", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        ("Currency", "USD"),
        ("Terms of Trade", "FOB (Free On Board)"),
        ("Reason for Export", "Commercial sale"),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(3, "Estimated Goods"))
    rows = [
        ["#", "Description", "HS Code", "Qty", "Unit Value (USD)", "Line Total (USD)"],
        ["1",
         pkg.get("description", "General merchandise"),
         pkg.get("hsCode", "9999.99"),
         str(qty),
         f"{unit_value_usd:,.2f}",
         f"{subtotal_usd:,.2f}"],
    ]
    items_tbl = Table(rows, colWidths=[10 * mm, 70 * mm, 22 * mm, 14 * mm, 30 * mm, 30 * mm])
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
    story.append(Spacer(1, 4 * mm))
    total_tbl = Table([
        ["Estimated Total Value", f"USD {subtotal_usd:,.2f}"]
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
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph(
        "<i>This Proforma Invoice is a non-binding pre-shipment estimate. "
        "Final values and totals will be confirmed on the Commercial Invoice "
        "issued at dispatch.</i>",
        _S_DISCLAIMER,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 3 — COMMERCIAL INVOICE ============
def generate_commercial_invoice(shipment: dict, user: dict, customs_doc: Optional[dict] = None) -> bytes:
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    pkg = shipment.get("package", {})

    story = [_header_band("COMMERCIAL INVOICE", awb), Spacer(1, 6 * mm)]

    story.append(_section_title(1, "Exporter & Importer"))
    if customs_doc:
        exp = customs_doc.get("exporter") or shipment.get("sender", {})
        imp = customs_doc.get("importer") or shipment.get("receiver", {})
    else:
        exp = shipment.get("sender", {})
        imp = shipment.get("receiver", {})
    story.append(_two_col_addr(
        _fmt_addr_block(exp, "EXPORTER"),
        _fmt_addr_block(imp, "IMPORTER"),
    ))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(2, "Shipment Reference"))
    currency = (customs_doc or {}).get("currency", "USD")
    story.append(_kv_grid([
        ("Air Waybill No.", awb),
        ("Invoice Date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        ("Country of Origin", shipment.get("origin", {}).get("country", "PG")),
        ("Currency", currency),
        ("Terms of Trade", "DAP (Delivered At Place)"),
        ("Reason for Export", "Commercial sale"),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(3, "Goods Declaration"))
    items = (customs_doc or {}).get("items") or []
    rows = [["#", "Description", "HS Code", "Qty", f"Unit Value ({currency})", "Origin", f"Total ({currency})"]]
    grand = 0.0
    if items:
        for i, it in enumerate(items, 1):
            qty = it.get("quantity", 1)
            uv = it.get("unitValue", 0.0)
            line = qty * uv
            grand += line
            rows.append([
                str(i), it.get("description", "—"), it.get("hsCode", "—"),
                str(qty), f"{uv:,.2f}", it.get("countryOfOrigin", "—"),
                f"{line:,.2f}",
            ])
    else:
        # Fallback to package data
        qty = pkg.get("pieces", 1)
        uv = pkg.get("declaredValueUSD", 0.0)
        grand = qty * uv
        rows.append([
            "1", pkg.get("description", "General merchandise"), pkg.get("hsCode", "9999.99"),
            str(qty), f"{uv:,.2f}", shipment.get("origin", {}).get("country", "PG"),
            f"{grand:,.2f}",
        ])
    items_tbl = Table(rows, colWidths=[8 * mm, 56 * mm, 20 * mm, 12 * mm, 26 * mm, 18 * mm, 26 * mm])
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
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
def generate_tax_invoice(shipment: dict, user: dict) -> bytes:
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    subtotal = float(shipment.get("costPGK") or 0)
    gst = round(subtotal * 0.10, 2)
    total = round(subtotal + gst, 2)

    story = [_header_band("TAX INVOICE", awb), Spacer(1, 6 * mm)]

    story.append(_section_title(1, "Bill To"))
    bill_to = Paragraph(
        f"<b>{user.get('companyName', 'Customer')}</b><br/>"
        f"{user.get('firstName', '')} {user.get('lastName', '')}<br/>"
        f"{user.get('email', '')}<br/>"
        f"Tel: {user.get('phone', '')}",
        _S_BODY,
    )
    story.append(bill_to)
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(2, "Invoice Details"))
    story.append(_kv_grid([
        ("Invoice Date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        ("Air Waybill No.", awb),
        ("Service", _service_label(shipment.get("service", ""))),
        ("Origin", f"{shipment.get('origin', {}).get('city', '')}, {shipment.get('origin', {}).get('country', '')}"),
        ("Destination", f"{shipment.get('destination', {}).get('city', '')}, {shipment.get('destination', {}).get('country', '')}"),
        ("Currency", "PGK"),
        ("GST Rate", "10%"),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(3, "Charges"))
    rows = [
        ["Description", "Amount (PGK)"],
        [f"International freight — {_service_label(shipment.get('service', ''))} ({awb})", f"{subtotal:,.2f}"],
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
        ["Subtotal", f"PGK {subtotal:,.2f}"],
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
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph(
        "<i>This Tax Invoice is issued for the freight services described "
        "above. GST is charged at the prevailing rate of 10%.</i>",
        _S_DISCLAIMER,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ DOCUMENT 5 — INBOUND INVOICE ============
def generate_inbound_invoice(shipment: dict, user: dict) -> bytes:
    """Receiver-side invoice — for inbound (imported) shipments. Charges
    listed are import duties/clearance fees on a notional basis."""
    awb = shipment.get("awb", "—")
    doc, buf = _build_doc(awb)
    declared_usd = float(shipment.get("package", {}).get("declaredValueUSD") or 0)
    duty_pct = 0.05
    clearance_fee_pgk = 50.0
    declared_pgk = declared_usd * 3.7  # rough USD→PGK
    duty_pgk = round(declared_pgk * duty_pct, 2)
    gst_pgk = round((duty_pgk + clearance_fee_pgk) * 0.10, 2)
    total_pgk = round(duty_pgk + clearance_fee_pgk + gst_pgk, 2)

    story = [_header_band("INBOUND INVOICE", awb), Spacer(1, 6 * mm)]

    story.append(_section_title(1, "Receiver (Importer of Record)"))
    story.append(_fmt_addr_block(shipment.get("receiver", {}), "RECEIVER"))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(2, "Inbound Shipment"))
    story.append(_kv_grid([
        ("Air Waybill No.", awb),
        ("Arrival Date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        ("Origin", f"{shipment.get('origin', {}).get('city', '')}, {shipment.get('origin', {}).get('country', '')}"),
        ("Destination", f"{shipment.get('destination', {}).get('city', '')}, {shipment.get('destination', {}).get('country', '')}"),
        ("Service", _service_label(shipment.get("service", ""))),
        ("Declared Value", f"USD {declared_usd:,.2f}"),
        ("Currency", "PGK"),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title(3, "Duties & Charges"))
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
        ["Subtotal", f"PGK {(duty_pgk + clearance_fee_pgk):,.2f}"],
        ["GST (10%)", f"PGK {gst_pgk:,.2f}"],
        ["Total Payable on Arrival", f"PGK {total_pgk:,.2f}"],
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
    story.append(Spacer(1, 8 * mm))

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
    story.append(_kv_grid([
        ("Reason for Export", "Commercial sale"),
        ("Terms of Trade", "DAP (Delivered At Place)"),
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
