"""PDF generation utilities — shipping labels, invoices, customs docs.
Uses reportlab + qrcode + python-barcode (Code128).
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4, A6
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as PlatyImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib.utils import ImageReader
import barcode
from barcode.writer import ImageWriter
import qrcode
from datetime import datetime

DHL_YELLOW = colors.HexColor("#FFCC00")
DHL_RED = colors.HexColor("#D40511")
DHL_INK = colors.HexColor("#1A1A1A")


def _barcode_png(code: str) -> BytesIO:
    """Generate a Code128 barcode PNG into a BytesIO."""
    buf = BytesIO()
    bc = barcode.get("code128", code, writer=ImageWriter())
    bc.write(buf, options={"module_height": 12.0, "module_width": 0.4, "font_size": 8, "text_distance": 2})
    buf.seek(0)
    return buf


def _qr_png(data: str) -> BytesIO:
    buf = BytesIO()
    qr = qrcode.QRCode(box_size=4, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def _safe(d, key, default=""):
    """Return d[key] if present and non-None, else default."""
    if not isinstance(d, dict):
        return default
    v = d.get(key)
    return default if v is None else v


# ============ SHIPPING LABEL (A6 portrait) ============
def render_shipping_label(shipment: dict, track_url: str) -> bytes:
    """Generate an A6 portrait shipping label PDF. Tolerant of missing
    or None optional fields on any shipment record."""
    buf = BytesIO()
    W, H = A6  # 105 x 148 mm
    c = canvas.Canvas(buf, pagesize=A6)

    # Yellow header bar — taller (24mm, +33%) for a more prominent brand band
    c.setFillColor(DHL_YELLOW)
    c.rect(0, H - 24 * mm, W, 24 * mm, fill=1, stroke=0)
    c.setFillColor(DHL_INK)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(6 * mm, H - 13 * mm, "DHL")
    c.setFillColor(DHL_RED)
    c.drawString(22 * mm, H - 13 * mm, "Express")
    c.setFillColor(DHL_INK)
    c.setFont("Helvetica", 7)
    c.drawString(6 * mm, H - 20 * mm, "Demo Shipping Label · Not for actual carrier use")

    awb = str(_safe(shipment, "awb", "—"))
    service = str(_safe(shipment, "service", "")).replace("_", " ") or "—"
    origin = shipment.get("origin") or {}
    dest = shipment.get("destination") or {}
    o_code = _safe(origin, "code", "—")
    d_code = _safe(dest, "code", "—")

    # Service + origin/dest (just below the taller yellow band)
    y = H - 30 * mm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(6 * mm, y, f"Service: {service}")
    c.drawRightString(W - 6 * mm, y, f"{o_code} → {d_code}")
    y -= 4 * mm
    c.setStrokeColor(DHL_INK)
    c.setLineWidth(0.5)
    c.line(6 * mm, y, W - 6 * mm, y)

    # Sender block
    y -= 5 * mm
    c.setFont("Helvetica-Bold", 7)
    c.drawString(6 * mm, y, "FROM")
    c.setFont("Helvetica", 8)
    y -= 4 * mm
    s = shipment.get("sender") or {}
    s_city_line = f"{_safe(s, 'city')}, {_safe(s, 'country')} {_safe(s, 'postalCode')}".strip(", ")
    for line in [
        _safe(s, "name"), _safe(s, "company"), _safe(s, "address"),
        s_city_line, _safe(s, "phone"),
    ]:
        if line:
            c.drawString(6 * mm, y, str(line)[:50])
            y -= 3.5 * mm

    # Receiver block (larger, prominent)
    y -= 2 * mm
    c.setStrokeColor(DHL_INK)
    c.setLineWidth(0.5)
    c.line(6 * mm, y, W - 6 * mm, y)
    y -= 5 * mm
    c.setFont("Helvetica-Bold", 7)
    c.drawString(6 * mm, y, "TO")
    c.setFont("Helvetica-Bold", 11)
    y -= 5 * mm
    r = shipment.get("receiver") or {}
    c.drawString(6 * mm, y, str(_safe(r, "name", "—"))[:35])
    y -= 4.5 * mm
    c.setFont("Helvetica", 9)
    c.drawString(6 * mm, y, str(_safe(r, "company"))[:40])
    y -= 4 * mm
    c.setFont("Helvetica", 8)
    c.drawString(6 * mm, y, str(_safe(r, "address"))[:50])
    y -= 4 * mm
    c.setFont("Helvetica-Bold", 10)
    r_city_line = f"{_safe(r, 'city')}, {_safe(r, 'country')} {_safe(r, 'postalCode')}".strip(", ")
    c.drawString(6 * mm, y, r_city_line)
    y -= 4 * mm
    c.setFont("Helvetica", 8)
    c.drawString(6 * mm, y, str(_safe(r, "phone")))

    # Package info
    y -= 5 * mm
    c.setStrokeColor(DHL_INK)
    c.line(6 * mm, y, W - 6 * mm, y)
    y -= 4 * mm
    pkg = shipment.get("package") or {}
    c.setFont("Helvetica-Bold", 7)
    c.drawString(6 * mm, y, "PIECES")
    c.drawString(25 * mm, y, "WEIGHT")
    c.drawString(50 * mm, y, "DECLARED VALUE")
    y -= 4 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(6 * mm, y, str(_safe(pkg, "pieces", "—")))
    weight = _safe(pkg, "weightKg", 0)
    c.drawString(25 * mm, y, f"{weight} kg")
    declared = _safe(pkg, "declaredValueUSD", 0)
    c.drawString(50 * mm, y, f"USD {float(declared):.0f}")

    # Barcode (skip cleanly if AWB invalid). Lifted to y=18mm so there's
    # ~7mm clearance between the barcode bottom and the AWB text below it.
    try:
        bc_buf = _barcode_png(awb)
        c.drawImage(ImageReader(bc_buf),
                    6 * mm, 18 * mm, width=70 * mm, height=18 * mm,
                    preserveAspectRatio=True, mask='auto')
    except Exception:
        pass

    # AWB number text (baseline at y=7mm; sits clearly below the barcode)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(6 * mm, 7 * mm, f"AWB {awb}")

    # QR code (links to public track page) — aligned with barcode top edge
    try:
        qr_buf = _qr_png(track_url)
        c.drawImage(ImageReader(qr_buf),
                    W - 30 * mm, 12 * mm, width=24 * mm, height=24 * mm,
                    preserveAspectRatio=True, mask='auto')
    except Exception:
        pass

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.getvalue()


# ============ INVOICE PDF ============
def render_invoice(invoice: dict, user: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=18 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=22, textColor=DHL_INK, leading=24)
    small = ParagraphStyle("sm", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#666"))
    mono = ParagraphStyle("mono", parent=styles["Normal"], fontName="Courier", fontSize=9)
    label = ParagraphStyle("lb", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=colors.HexColor("#666"))

    story = []

    # Header band
    hdr = Table([
        [Paragraph("<font color='#1A1A1A'><b>DHL</b></font> <font color='#D40511'><b>Express</b></font>", h1),
         Paragraph(f"<b>INVOICE</b><br/><font color='#666' size='9'>{invoice['invoiceNumber']}</font>", h1)]
    ], colWidths=[100 * mm, 70 * mm])
    hdr.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), DHL_YELLOW),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(hdr)
    story.append(Spacer(1, 8 * mm))

    # Billing details
    issue = invoice["issueDate"][:10] if isinstance(invoice["issueDate"], str) else invoice["issueDate"].isoformat()[:10]
    due = invoice["dueDate"][:10] if isinstance(invoice["dueDate"], str) else invoice["dueDate"].isoformat()[:10]
    bill = Table([
        [Paragraph("BILL TO", label), Paragraph("ISSUE DATE", label), Paragraph("DUE DATE", label), Paragraph("STATUS", label)],
        [
            Paragraph(f"<b>{user.get('companyName', 'Customer')}</b><br/>"
                      f"{user.get('firstName', '')} {user.get('lastName', '')}<br/>"
                      f"{user.get('email', '')}<br/>{user.get('phone', '')}", styles["Normal"]),
            Paragraph(issue, styles["Normal"]),
            Paragraph(due, styles["Normal"]),
            Paragraph(f"<b><font color='{'#16a34a' if invoice['status'] == 'PAID' else '#D40511'}'>{invoice['status']}</font></b>", styles["Normal"]),
        ],
    ], colWidths=[80 * mm, 30 * mm, 30 * mm, 30 * mm])
    bill.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
    ]))
    story.append(bill)
    story.append(Spacer(1, 8 * mm))

    # Line items
    rows = [["AWB", "DESCRIPTION", "AMOUNT (PGK)"]]
    for li in invoice["lineItems"]:
        rows.append([li["shipmentAwb"], li["description"], f"{li['costPGK']:,.2f}"])
    items_tbl = Table(rows, colWidths=[35 * mm, 100 * mm, 35 * mm])
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(items_tbl)
    story.append(Spacer(1, 6 * mm))

    # Totals
    totals = Table([
        ["Subtotal", f"PGK {invoice['subtotalPGK']:,.2f}"],
        ["GST (10%)", f"PGK {invoice['taxPGK']:,.2f}"],
        ["Total Due", f"PGK {invoice['totalPGK']:,.2f}"],
    ], colWidths=[135 * mm, 35 * mm])
    totals.setStyle(TableStyle([
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 12),
        ("LINEABOVE", (0, -1), (-1, -1), 1, DHL_INK),
        ("TOPPADDING", (0, -1), (-1, -1), 6),
        ("TEXTCOLOR", (0, -1), (-1, -1), DHL_RED),
    ]))
    story.append(totals)

    story.append(Spacer(1, 14 * mm))
    story.append(Paragraph(
        "Pay this invoice through your MyDHL Express account, or scan the QR below to pay online.<br/>"
        "Demo build — payment, GST, and reference numbers are simulated.",
        small,
    ))
    story.append(Spacer(1, 4 * mm))
    qr_buf = _qr_png(f"https://demo.dhlpng.com/pay/{invoice['invoiceNumber']}")
    story.append(PlatyImage(qr_buf, width=28 * mm, height=28 * mm))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ CUSTOMS DOCUMENT PDF ============
DOC_TITLES = {
    "COMMERCIAL_INVOICE": "Commercial Invoice",
    "PACKING_LIST": "Packing List",
    "EXPORT_DECLARATION": "Export Declaration",
}


def render_customs_doc(doc_record: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=18 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=18, textColor=DHL_INK)
    label = ParagraphStyle("lb", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=colors.HexColor("#666"))
    title = DOC_TITLES.get(doc_record["docType"], doc_record["docType"])

    story = []
    hdr = Table([
        [Paragraph("<font color='#1A1A1A'><b>DHL</b></font> <font color='#D40511'><b>Express</b></font>", h1),
         Paragraph(f"<b>{title}</b><br/><font size='9' color='#666'>Customs Documentation · Demo</font>", h1)]
    ], colWidths=[80 * mm, 90 * mm])
    hdr.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, 0), DHL_YELLOW), ("LEFTPADDING", (0, 0), (-1, -1), 10),
                             ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                             ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(hdr)
    story.append(Spacer(1, 8 * mm))

    # Exporter / Importer
    exp_obj = doc_record["exporter"]
    imp_obj = doc_record["importer"]
    eximp = Table([
        [Paragraph("EXPORTER", label), Paragraph("IMPORTER", label)],
        [
            Paragraph(f"<b>{exp_obj.get('name', '')}</b><br/>{exp_obj.get('company', '')}<br/>"
                      f"{exp_obj.get('address', '')}<br/>{exp_obj.get('city', '')}, {exp_obj.get('country', '')}", styles["Normal"]),
            Paragraph(f"<b>{imp_obj.get('name', '')}</b><br/>{imp_obj.get('company', '')}<br/>"
                      f"{imp_obj.get('address', '')}<br/>{imp_obj.get('city', '')}, {imp_obj.get('country', '')}", styles["Normal"]),
        ],
    ], colWidths=[85 * mm, 85 * mm])
    eximp.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(eximp)
    story.append(Spacer(1, 8 * mm))

    # Items
    rows = [["#", "DESCRIPTION", "HS CODE", "QTY", "UNIT VALUE", "WEIGHT", "ORIGIN"]]
    for i, it in enumerate(doc_record.get("items", []), 1):
        rows.append([
            str(i), it.get("description", ""), it.get("hsCode", ""),
            str(it.get("quantity", "")), f"{doc_record.get('currency', 'USD')} {it.get('unitValue', 0):,.2f}",
            f"{it.get('weightKg', 0)} kg", it.get("countryOfOrigin", "")
        ])
    tbl = Table(rows, colWidths=[10 * mm, 55 * mm, 22 * mm, 12 * mm, 28 * mm, 18 * mm, 25 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(f"<b>Total declared value: {doc_record.get('currency', 'USD')} {doc_record.get('totalValueUSD', 0):,.2f}</b>", styles["Normal"]))
    story.append(Spacer(1, 16 * mm))
    story.append(Paragraph(
        f"<b>Signed by:</b> {doc_record.get('signedBy', '')}   <b>Date:</b> {(doc_record.get('signatureDate') or '')[:10]}",
        styles["Normal"]
    ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ============ REPORTS PDF (simple table dump) ============
def render_report(overview: dict, user: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                            topMargin=18 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=18, textColor=DHL_INK)
    label = ParagraphStyle("lb", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=colors.HexColor("#666"))

    story = [
        Paragraph(f"<font color='#1A1A1A'><b>DHL</b></font> <font color='#D40511'><b>Express</b></font> · Account Report", h1),
        Paragraph(f"Generated for: <b>{user.get('companyName', 'Customer')}</b> · {datetime.utcnow().strftime('%d %b %Y')}", styles["Normal"]),
        Spacer(1, 10 * mm),

        Paragraph("MONTHLY SPEND (LAST 6 MONTHS)", label),
        Spacer(1, 2 * mm),
    ]
    rows = [["Month", "Total (PGK)"]]
    for m in overview.get("monthlySpend", []):
        rows.append([m["month"], f"{m['totalPGK']:,.2f}"])
    t = Table(rows, colWidths=[80 * mm, 60 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("SHIPMENTS BY SERVICE", label))
    story.append(Spacer(1, 2 * mm))
    rows = [["Service", "Shipments", "Total (PGK)"]]
    for s in overview.get("shipmentsByService", []):
        rows.append([s["service"].replace("_", " "), str(s["count"]), f"{s['totalPGK']:,.2f}"])
    t = Table(rows, colWidths=[80 * mm, 30 * mm, 50 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("TOP DESTINATIONS", label))
    story.append(Spacer(1, 2 * mm))
    rows = [["City", "Country", "Shipments", "Spend (PGK)"]]
    for d in overview.get("topDestinations", []):
        rows.append([d["city"], d["country"], str(d["count"]), f"{d['totalPGK']:,.2f}"])
    t = Table(rows, colWidths=[60 * mm, 30 * mm, 30 * mm, 40 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DHL_INK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("ALIGN", (-2, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()
