"""Programmatic generator for the 9 master forwarding document templates.

Why generate instead of hand-craft?
-----------------------------------
The pitch demo needs 9 templates that share a consistent freight-forwarding
layout but differ in title + fields. Writing 9 .docx files by hand and
keeping them in sync is brittle; generating them from a single Python
description makes the whole template library reproducible.

Template structure (every doc)
------------------------------
  ┌─────────────────────────────────────────────────────────────┐
  │  [LOGO IMG]    {{ document_title }}              {{ ref }}  │  ← header band
  ├─────────────────────────────────────────────────────────────┤
  │  PARTIES (2-column table: shipper | consignee | notify)     │
  │  SHIPMENT INFO (vessel / voyage / route / dates)            │
  │  CARGO (description / HS / weight / containers)             │
  │  FREIGHT TERMS                                              │
  │  Footer: Demo Forwarding Co. — Pitch Demo Use Only          │
  └─────────────────────────────────────────────────────────────┘

Placeholders are docxtpl-style Jinja2: ``{{ shipment.ref_number }}``.
"""
from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


OUT_DIR = Path(__file__).resolve().parent.parent / "templates" / "forwarding"
OUT_DIR.mkdir(parents=True, exist_ok=True)
LOGO = Path("/app/uploads/dhl_brand_assets/dhl_global_forwarding_clean.png")

# DHL brand red for accent text only (no DHL wordmark in body).
DHL_RED = RGBColor(0xD4, 0x05, 0x11)
INK = RGBColor(0x33, 0x33, 0x33)
MUTED = RGBColor(0x66, 0x66, 0x66)


# ── Per-document descriptors ──────────────────────────────────────────────
DOC_SPECS = {
    "hbl_template.docx": {
        "title": "HOUSE BILL OF LADING",
        "subtitle": "(Non-Negotiable Sea Waybill copy)",
        "ref_label": "HBL No.",
        "ref_field": "{{ shipment.bl_number or shipment.ref_number }}",
        "show_vessel": True, "show_container": True, "show_freight": True,
        "show_air": False, "show_arrival": False, "show_pod_signature": False,
        "show_originals": True,
    },
    "mbl_template.docx": {
        "title": "MASTER BILL OF LADING",
        "subtitle": "Ocean / Multimodal",
        "ref_label": "MBL No.",
        "ref_field": "{{ shipment.master_bl_number or shipment.bl_number }}",
        "show_vessel": True, "show_container": True, "show_freight": True,
        "show_air": False, "show_arrival": False, "show_pod_signature": False,
        "show_originals": True,
    },
    "hawb_template.docx": {
        "title": "HOUSE AIR WAYBILL",
        "subtitle": "Non-Negotiable",
        "ref_label": "HAWB No.",
        "ref_field": "{{ shipment.hawb_number or shipment.ref_number }}",
        "show_vessel": False, "show_container": False, "show_freight": True,
        "show_air": True, "show_arrival": False, "show_pod_signature": False,
        "show_originals": True,
    },
    "mawb_template.docx": {
        "title": "MASTER AIR WAYBILL",
        "subtitle": "IATA Standard Format",
        "ref_label": "MAWB No.",
        "ref_field": "{{ shipment.mawb_number or shipment.ref_number }}",
        "show_vessel": False, "show_container": False, "show_freight": True,
        "show_air": True, "show_arrival": False, "show_pod_signature": False,
        "show_originals": True,
    },
    "commercial_invoice_template.docx": {
        "title": "COMMERCIAL INVOICE",
        "subtitle": "For Customs Clearance Purposes",
        "ref_label": "Invoice No.",
        "ref_field": "{{ shipment.invoice_number or shipment.ref_number }}",
        "show_vessel": True, "show_container": False, "show_freight": True,
        "show_air": False, "show_arrival": False, "show_pod_signature": False,
        "show_originals": False,
    },
    "packing_list_template.docx": {
        "title": "PACKING LIST",
        "subtitle": "Cargo Description & Measurements",
        "ref_label": "Packing List No.",
        "ref_field": "{{ shipment.packing_list_number or shipment.ref_number }}",
        "show_vessel": True, "show_container": True, "show_freight": False,
        "show_air": False, "show_arrival": False, "show_pod_signature": False,
        "show_originals": False,
    },
    "booking_confirmation_template.docx": {
        "title": "BOOKING CONFIRMATION",
        "subtitle": "Confirmed shipment booking & sailing schedule",
        "ref_label": "Booking No.",
        "ref_field": "{{ shipment.booking_number or shipment.ref_number }}",
        "show_vessel": True, "show_container": True, "show_freight": True,
        "show_air": False, "show_arrival": False, "show_pod_signature": False,
        "show_originals": False,
    },
    "arrival_notice_template.docx": {
        "title": "ARRIVAL NOTICE",
        "subtitle": "Vessel arrival & charges due notification",
        "ref_label": "Notice No.",
        "ref_field": "{{ shipment.arrival_notice_number or shipment.ref_number }}",
        "show_vessel": True, "show_container": True, "show_freight": True,
        "show_air": False, "show_arrival": True, "show_pod_signature": False,
        "show_originals": False,
    },
    "proof_of_delivery_template.docx": {
        "title": "PROOF OF DELIVERY",
        "subtitle": "Cargo received in good order & condition",
        "ref_label": "POD No.",
        "ref_field": "{{ shipment.pod_number or shipment.ref_number }}",
        "show_vessel": True, "show_container": True, "show_freight": False,
        "show_air": False, "show_arrival": False, "show_pod_signature": True,
        "show_originals": False,
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────
def _set_cell_bg(cell, hex_color: str):
    """Tint a table cell background."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color.lstrip('#'))
    tc_pr.append(shd)


def _set_borders(table, color="999999", size="4"):
    """Add light hairline borders to every cell of `table`."""
    tbl = table._tbl
    tblPr = tbl.find(qn('w:tblPr'))
    if tblPr is None:
        tblPr = OxmlElement('w:tblPr')
        tbl.insert(0, tblPr)
    tblBorders = OxmlElement('w:tblBorders')
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement(f"w:{edge}")
        e.set(qn("w:val"), "single")
        e.set(qn("w:sz"), size)
        e.set(qn("w:color"), color)
        tblBorders.append(e)
    tblPr.append(tblBorders)


def _label(cell, text, *, color=MUTED, bold=False, size=8):
    p = cell.paragraphs[0]
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold


def _value(cell, text, *, color=INK, bold=False, size=10):
    p = cell.add_paragraph() if cell.paragraphs[0].text else cell.paragraphs[0]
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold


def _kv(table, row_idx, label, jinja_value, *, full_width=False):
    cells = table.rows[row_idx].cells
    if full_width:
        a = cells[0]
        a.merge(cells[-1])
    a = cells[0]
    a.text = ""
    _label(a, label.upper(), bold=True)
    _value(a, jinja_value, size=10)


def _section_heading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text.upper())
    run.font.size = Pt(9)
    run.font.bold = True
    run.font.color.rgb = DHL_RED
    # bottom border under heading
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot = OxmlElement('w:bottom')
    bot.set(qn('w:val'), 'single')
    bot.set(qn('w:sz'), '4')
    bot.set(qn('w:space'), '1')
    bot.set(qn('w:color'), 'D40511')
    pBdr.append(bot)
    pPr.append(pBdr)


# ── Builder ───────────────────────────────────────────────────────────────
def build_template(filename: str, spec: dict):
    doc = Document()
    # narrow margins
    for s in doc.sections:
        s.top_margin = Cm(1.4)
        s.bottom_margin = Cm(1.4)
        s.left_margin = Cm(1.6)
        s.right_margin = Cm(1.6)

    # ── Header band: logo + title + ref ────────────────────────────────
    header_tbl = doc.add_table(rows=1, cols=3)
    header_tbl.autofit = False
    widths = [Cm(4.5), Cm(8.5), Cm(4.5)]
    for i, w in enumerate(widths):
        header_tbl.columns[i].width = w
        header_tbl.rows[0].cells[i].width = w

    # Logo cell
    logo_cell = header_tbl.rows[0].cells[0]
    logo_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    if LOGO.exists():
        p = logo_cell.paragraphs[0]
        p.add_run().add_picture(str(LOGO), height=Cm(1.4))
    else:
        _label(logo_cell, "FORWARDING DEMO", bold=True, size=12, color=DHL_RED)

    # Title cell
    title_cell = header_tbl.rows[0].cells[1]
    title_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = title_cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(spec["title"])
    run.font.size = Pt(18)
    run.font.bold = True
    run.font.color.rgb = INK
    p2 = title_cell.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = p2.add_run(spec["subtitle"])
    r2.font.size = Pt(8)
    r2.font.italic = True
    r2.font.color.rgb = MUTED

    # Ref cell
    ref_cell = header_tbl.rows[0].cells[2]
    ref_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    _set_cell_bg(ref_cell, "F5F5F5")
    p = ref_cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    _label(ref_cell, spec["ref_label"], bold=True, size=8)
    rp = ref_cell.add_paragraph()
    rp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rr = rp.add_run(spec["ref_field"])
    rr.font.size = Pt(12)
    rr.font.bold = True
    rr.font.color.rgb = DHL_RED
    rp2 = ref_cell.add_paragraph()
    rp2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rr2 = rp2.add_run("Issued: {{ shipment.issue_date }}")
    rr2.font.size = Pt(7)
    rr2.font.color.rgb = MUTED

    # ── Parties section ───────────────────────────────────────────────
    _section_heading(doc, "Parties")
    parties = doc.add_table(rows=1, cols=3)
    parties.autofit = True
    _set_borders(parties)
    headers = ["SHIPPER", "CONSIGNEE", "NOTIFY PARTY"]
    keys = ["shipper", "consignee", "notify_party"]
    for i, (h, k) in enumerate(zip(headers, keys)):
        cell = parties.rows[0].cells[i]
        _set_cell_bg(cell, "FAFAFA")
        _label(cell, h, bold=True, size=8, color=DHL_RED)
        for line, jinja in [
            ("", f"{{{{ shipment.{k}.company or '—' }}}}"),
            ("", f"{{{{ shipment.{k}.name or '' }}}}"),
            ("", f"{{{{ shipment.{k}.address or '' }}}}"),
            ("", f"{{{{ shipment.{k}.city or '' }}}}, {{{{ shipment.{k}.country or '' }}}}"),
        ]:
            p = cell.add_paragraph()
            run = p.add_run(jinja)
            run.font.size = Pt(9)
            run.font.color.rgb = INK

    # ── Shipment info section ─────────────────────────────────────────
    _section_heading(doc, "Shipment Information")
    info = doc.add_table(rows=4, cols=4)
    info.autofit = True
    _set_borders(info)
    rows = []
    rows.append([
        ("Port of Loading (POL)", "{{ shipment.pol_name }} ({{ shipment.pol_code }})"),
        ("Port of Discharge (POD)", "{{ shipment.pod_name }} ({{ shipment.pod_code }})"),
    ])
    if spec["show_vessel"]:
        rows.append([
            ("Vessel / Voyage", "{{ shipment.vessel or '—' }} / {{ shipment.voyage or '—' }}"),
            ("ETD / ETA", "{{ shipment.etd or '—' }} / {{ shipment.eta or '—' }}"),
        ])
    elif spec["show_air"]:
        rows.append([
            ("Flight", "{{ shipment.flight or '—' }}"),
            ("Departure / Arrival", "{{ shipment.etd or '—' }} / {{ shipment.eta or '—' }}"),
        ])
    else:
        rows.append([
            ("Movement Mode", "{{ shipment.mode or '—' }}"),
            ("ETD / ETA", "{{ shipment.etd or '—' }} / {{ shipment.eta or '—' }}"),
        ])

    rows.append([
        ("Place of Receipt", "{{ shipment.place_of_receipt or shipment.pol_name }}"),
        ("Place of Delivery", "{{ shipment.place_of_delivery or shipment.pod_name }}"),
    ])
    if spec.get("show_originals"):
        rows.append([
            ("Number of Originals", "{{ shipment.originals or '3/3' }}"),
            ("Document Date", "{{ shipment.issue_date }}"),
        ])
    elif spec.get("show_arrival"):
        rows.append([
            ("Arrival Date", "{{ shipment.eta }}"),
            ("Free Storage Until", "{{ shipment.free_storage_until or '—' }}"),
        ])
    else:
        rows.append([
            ("Incoterms", "{{ shipment.incoterms or '—' }}"),
            ("Document Date", "{{ shipment.issue_date }}"),
        ])

    for ri, pair in enumerate(rows):
        for ci, (lab, val) in enumerate(pair):
            cell = info.rows[ri].cells[ci * 2]
            _label(cell, lab.upper(), bold=True, size=7)
            cell2 = info.rows[ri].cells[ci * 2 + 1]
            _value(cell2, val, size=9)

    # ── Cargo / line items ────────────────────────────────────────────
    _section_heading(doc, "Cargo & Description of Goods")
    cargo = doc.add_table(rows=3, cols=2)
    cargo.autofit = True
    _set_borders(cargo)
    cargo_rows = [
        ("Description of Goods", "{{ shipment.cargo.description or '—' }}"),
        ("HS Code", "{{ shipment.cargo.hs_code or '—' }}"),
        ("Gross Weight (kg) / Volume (cbm)",
         "{{ shipment.cargo.weight_kg or '—' }} / {{ shipment.cargo.volume_cbm or '—' }}"),
    ]
    for i, (lab, val) in enumerate(cargo_rows):
        c0 = cargo.rows[i].cells[0]
        _set_cell_bg(c0, "FAFAFA")
        _label(c0, lab.upper(), bold=True, size=8)
        c1 = cargo.rows[i].cells[1]
        _value(c1, val, size=10)

    if spec["show_container"]:
        _section_heading(doc, "Container / Equipment")
        cont = doc.add_table(rows=2, cols=3)
        cont.autofit = True
        _set_borders(cont)
        for i, lab in enumerate(["Container No.", "Type", "Seal"]):
            c = cont.rows[0].cells[i]
            _set_cell_bg(c, "FAFAFA")
            _label(c, lab.upper(), bold=True, size=8)
        cont.rows[1].cells[0].text = ""
        _value(cont.rows[1].cells[0], "{{ shipment.container.number or '—' }}", size=10, bold=True)
        cont.rows[1].cells[1].text = ""
        _value(cont.rows[1].cells[1], "{{ shipment.container.type or '—' }}", size=10)
        cont.rows[1].cells[2].text = ""
        _value(cont.rows[1].cells[2], "{{ shipment.container.seal or '—' }}", size=10)

    if spec["show_freight"]:
        _section_heading(doc, "Freight & Charges")
        freight = doc.add_table(rows=1, cols=3)
        freight.autofit = True
        _set_borders(freight)
        for i, (lab, val) in enumerate([
            ("Freight Amount",
             "{{ '%.2f' | format(shipment.freight.amount) }} {{ shipment.freight.currency }}"),
            ("Freight Terms", "{{ shipment.freight.terms or 'Prepaid' }}"),
            ("Payment Method", "{{ shipment.freight.payment or 'On account' }}"),
        ]):
            c = freight.rows[0].cells[i]
            _set_cell_bg(c, "FAFAFA")
            _label(c, lab.upper(), bold=True, size=8)
            _value(c, val, size=10, bold=True)

    if spec["show_pod_signature"]:
        _section_heading(doc, "Acknowledgement")
        sig = doc.add_table(rows=2, cols=2)
        sig.autofit = True
        _set_borders(sig)
        for i, lab in enumerate(["Received by (Name)", "Date & Signature"]):
            c = sig.rows[0].cells[i]
            _set_cell_bg(c, "FAFAFA")
            _label(c, lab.upper(), bold=True, size=8)
        _value(sig.rows[1].cells[0], "{{ shipment.consignee.name or '—' }}", size=10)
        _value(sig.rows[1].cells[1], "{{ shipment.delivery_date or '—' }}", size=10)

    # ── Footer ──────────────────────────────────────────────────────
    foot = doc.add_paragraph()
    foot.paragraph_format.space_before = Pt(18)
    foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = foot.add_run("Demo Forwarding Co. — Pitch Demo Use Only. Generated automatically from a sample template. Not a binding commercial instrument.")
    r.font.size = Pt(7)
    r.font.italic = True
    r.font.color.rgb = MUTED

    out = OUT_DIR / filename
    doc.save(out)
    return out


def main():
    print(f"Output dir: {OUT_DIR}")
    print(f"Logo path:  {LOGO}  (exists={LOGO.exists()})")
    for filename, spec in DOC_SPECS.items():
        out = build_template(filename, spec)
        print(f"  ✓ {filename}  ({out.stat().st_size} bytes)")
    print(f"\nGenerated {len(DOC_SPECS)} templates.")


if __name__ == "__main__":
    main()
