// Shared mapping for the Documents module. Keeps the backend enum, the
// human-readable label and the lucide-react icon name in one place so the
// UploadDocumentModal dropdown, the DocumentsSection row icons and the
// status filter chips never drift out of sync.
//
// Backend source of truth: /app/backend/documents_module.py → DOCUMENT_TYPES
import {
  Plane, Ship, Truck, Package,
  FileText, ClipboardList, FileCheck, Stamp,
  CheckCircle, ShieldCheck, AlertTriangle, Leaf, Bug,
  Receipt, BookOpen, File as FileIcon,
} from "lucide-react";

export const DOCUMENT_TYPES = [
  // Transport documents — A
  { value: "HBL",                   label: "House Bill of Lading",        group: "Transport",  Icon: Ship },
  { value: "MBL",                   label: "Master Bill of Lading",       group: "Transport",  Icon: Ship },
  { value: "HAWB",                  label: "House Air Waybill",           group: "Transport",  Icon: Plane },
  { value: "MAWB",                  label: "Master Air Waybill",          group: "Transport",  Icon: Plane },
  { value: "CMR",                   label: "CMR / Road Waybill",          group: "Transport",  Icon: Truck },

  // Commercial — B
  { value: "COMMERCIAL_INVOICE",    label: "Commercial Invoice",          group: "Commercial", Icon: Receipt },
  { value: "PACKING_LIST",          label: "Packing List",                group: "Commercial", Icon: ClipboardList },
  { value: "PROFORMA_INVOICE",      label: "Proforma Invoice",            group: "Commercial", Icon: FileText },

  // Customs / Origin — C
  { value: "CERTIFICATE_OF_ORIGIN", label: "Certificate of Origin",       group: "Customs",    Icon: Stamp },
  { value: "CUSTOMS_DECLARATION",   label: "Customs Declaration (SAD)",   group: "Customs",    Icon: FileCheck },
  { value: "IMPORT_EXPORT_PERMIT",  label: "Import / Export Permit",      group: "Customs",    Icon: BookOpen },

  // Operational — D
  { value: "DELIVERY_ORDER",        label: "Delivery Order",              group: "Operational", Icon: Package },
  { value: "PROOF_OF_DELIVERY",     label: "Proof of Delivery",           group: "Operational", Icon: CheckCircle },
  { value: "ARRIVAL_NOTICE",        label: "Arrival Notice",              group: "Operational", Icon: FileText },
  { value: "PRE_ALERT",             label: "Pre-Alert",                   group: "Operational", Icon: FileText },
  { value: "BOOKING_CONFIRMATION",  label: "Booking Confirmation",        group: "Operational", Icon: FileText },

  // Special / optional — E
  { value: "INSURANCE_CERTIFICATE", label: "Insurance Certificate",       group: "Special",    Icon: ShieldCheck },
  { value: "DGD",                   label: "Dangerous Goods Declaration", group: "Special",    Icon: AlertTriangle },
  { value: "FUMIGATION_CERT",       label: "Fumigation Certificate",      group: "Special",    Icon: Bug },
  { value: "PHYTOSANITARY_CERT",    label: "Phytosanitary Certificate",   group: "Special",    Icon: Leaf },

  // Quotes — F
  { value: "QUOTE_RATE_SHEET",      label: "Quote / Rate Sheet",          group: "Commercial", Icon: FileText },

  // Catch-all
  { value: "OTHER",                 label: "Other",                       group: "Other",      Icon: FileIcon },
];

export const DOCUMENT_TYPE_LABELS = Object.fromEntries(
  DOCUMENT_TYPES.map((d) => [d.value, d.label])
);

export const DOCUMENT_TYPE_ICONS = Object.fromEntries(
  DOCUMENT_TYPES.map((d) => [d.value, d.Icon])
);

export const DOCUMENT_GROUPS = ["Transport", "Commercial", "Customs", "Operational", "Special", "Other"];

export const DOCUMENT_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED"];

// Mirrors the backend validator. Keep in sync with documents_module.py.
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
