# EMERGENT HANDOVER — DHL Ocean Freight Master Logbook

**Project:** Full operations documentation pack for 57 ocean-freight shipments dispatched from Singapore
to Pacific transit ports (Papua New Guinea / Fiji) between December 2021 and February 2026.

**Owner:** DHL PNG Forwarder Operations
**Forwarder:** DHL Global Forwarding (Singapore) — Ocean Freight & Project Cargo Division
**Status snapshot date:** 17 May 2026

---

## 1. Fleet at a glance

- **Total shipments:** 57
- **Delivered:** 31 (54%)
- **In depot (pending instructions):** 26 (46%)
- **Total goods value:** EUR 8,869,000
- **Total freight billed:** USD 269,180

## 2. Parties

| Role | Entity |
|---|---|
| Seller — machinery | BOMAG GmbH (Hellerwald, 56154 Boppard, Germany) |
| Seller — engine parts | MAN Energy Solutions SE (Stadtbachstraße 1, 86153 Augsburg, Germany) |
| Buyer — machinery | Pacific Heavy Machinery Pte Ltd (Terminal Avenue, Singapore) |
| Buyer — engine parts | Marine Power Solutions Singapore Pte Ltd (50 Tuas Crescent, Singapore) |
| Forwarder | DHL Global Forwarding Singapore — Ocean Freight & Project Cargo Division |

## 3. Cost matrix (Singapore origin)

| Container | Destination | Freight (USD) | Port / Lashing (USD) | Total (USD) |
|---|---|---|---|---|
| 20ft Standard FCL | Port Moresby (PNG) | 3,200 | 450 | **3,650** |
| 20ft Standard FCL | Port of Suva (Fiji) | 3,800 | 520 | **4,320** |
| 40ft Flat Rack    | Port Moresby (PNG) | 6,400 | 850 | **7,250** |
| 40ft Flat Rack    | Port of Suva (Fiji) | 7,100 | 950 | **8,050** |

## 4. Folder structure

```
00_MASTER/                                  ← project-level files
  00_Master_Logbook_Dashboard.xlsx          ← Excel: KPI dashboard, all shipments, depot watch, cost matrix
  01_Executive_Summary.docx                 ← Executive summary for leadership
  EMERGENT_HANDOVER.md                      ← THIS FILE
  SHIPMENT_INDEX.csv                        ← machine-readable index of all 57 shipments
  PENDING_ACTIONS.md                        ← prioritised list of 26 depot shipments
  master_logbook.csv / .json                ← raw enriched data

DHL-SWB-001_Delivered/                      ← one folder per shipment
  DHL-SWB-001_01_Commercial_Invoice.docx
  DHL-SWB-001_02_Packing_List.docx
  DHL-SWB-001_03_Bill_of_Lading.docx
  DHL-SWB-001_04_Booking_Confirmation.docx
  DHL-SWB-001_05_DHL_Shipping_Form.docx
  DHL-SWB-001_06_DHL_Customs_Document.docx
  DHL-SWB-001_07_Arrival_Notice.docx
  DHL-SWB-001_08_Proof_of_Delivery.docx
  (8 documents for delivered shipments)

DHL-SWB-029_Depot/
  DHL-SWB-029_01_Commercial_Invoice.docx
  ... (06 same as above) ...
  DHL-SWB-029_07_Arrival_Notice.docx
  DHL-SWB-029_08_Warehouse_Receipt.docx
  DHL-SWB-029_09_Pending_Action_Note.docx
  (9 documents for depot shipments; POD replaced by Warehouse Receipt + Pending Note)
```

## 5. Document templates produced

| # | Document | Delivered set | Depot set |
|---|---|---|---|
| 01 | Commercial Invoice | ✓ | ✓ |
| 02 | Packing List | ✓ | ✓ |
| 03 | Bill of Lading (Sea Waybill) | ✓ | ✓ |
| 04 | Booking Confirmation | ✓ | ✓ |
| 05 | DHL Shipping Form | ✓ | ✓ |
| 06 | DHL Customs Document | ✓ | ✓ |
| 07 | Arrival Notice | ✓ | ✓ |
| 08 | Proof of Delivery | ✓ (delivered only) | – |
| 08 | Warehouse Receipt / Storage Report | – | ✓ (depot only) |
| 09 | Pending Action Note — Final Destination Shipment | – | ✓ (depot only) |

Every document carries the same header, accent palette, signature block and full traceability to the
DHL-SWB number, the Bill of Lading number, container/seal, vessel & voyage.

## 6. Open issues for follow-up

1. **26 depot shipments** are awaiting written shipping instructions from the consignee. Priority bands and
   per-shipment detail are in `PENDING_ACTIONS.md`.
2. **CRITICAL shipments (>365 days in storage)** require formal demand letters — the Executive Summary lists
   the first 12.
3. **Re-export documents** for depot shipments should be drafted in anticipation of consignee instructions;
   the Commercial Invoice and Packing List in each depot folder are already valid starting points.

## 7. How to extend

- The raw data is in `master_logbook.csv` (one row per shipment). To add a new shipment, append a row and
  re-run `enrich.py` and `generate_docs.py`.
- All document templates are in `/operasyon_paketi/generate_docs.py`. To add a new document type, add a
  builder function and register it in `DOC_BUILDERS_DELIVERED` / `DOC_BUILDERS_DEPOT`.
- Master dashboard generator: `/operasyon_paketi/build_master.py`.

---

*Generated 17 May 2026 12:19 CET. All documents are draft templates; original signatures
and physical stamps are required before any document is submitted to customs, banks, or insurers.*
