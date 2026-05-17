/**
 * DHL Global Forwarding PNG — Shipment & related domain types
 *
 * Single source of truth for the mobile app. Mirrors the contract emitted by
 * /app/backend (FastAPI) and consumed by /app/frontend/src/* (no explicit TS
 * file on web — we derive from runtime usage in pages/Dashboard.jsx,
 * pages/ShipmentDetail.jsx, pages/Invoices.jsx, pages/Addresses.jsx, etc.).
 *
 * IMPORTANT
 * - Phase 8.3+ ocean model: primary statuses are AT_DEPOT and DELIVERED.
 *   Legacy IN_TRANSIT / OUT_FOR_DELIVERY / PICKED_UP / PENDING / ON_HOLD /
 *   EXCEPTION still exist on the wire for events[] (timeline) and the older
 *   shipper-account seed, so we keep them in the union for resilience —
 *   but UI only renders the two primary states.
 * - `pickupDaysRemaining`, `pickupOverdue`, `buyerPickupDeadline`,
 *   `atDepotSince` are present in the web contract but the backend does not
 *   yet populate them. shipmentUtils.getPickupBadge() derives them from
 *   `oceanSpecifics.depotStatus.since` + 5 business days when missing.
 *
 * No generate-documents type — that pipeline is forbidden by handover.
 */

// ─── Primary status (Phase 8.3+ ocean model) ─────────────────────────────────
export type PrimaryShipmentStatus = "AT_DEPOT" | "DELIVERED";

// Legacy statuses still emitted by /api/shipments for the shipper-account
// seed and by individual /events[] entries on every shipment timeline.
export type LegacyShipmentStatus =
  | "PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "ON_HOLD"
  | "EXCEPTION";

export type ShipmentStatus = PrimaryShipmentStatus | LegacyShipmentStatus;

export type ShipmentMode = "OCEAN" | "AIR" | "ROAD";

export type IncotermsCode =
  | "EXW" | "FCA" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP"
  | "FAS" | "FOB" | "CFR" | "CIF";

// ─── Generic location / port ─────────────────────────────────────────────────
export interface LocationCode {
  /** Human city, e.g. "Singapore" */
  city: string;
  /** Country name, e.g. "Singapore" */
  country: string;
  /** UN/LOCODE-ish identifier, e.g. "SGSIN" / "PGPOM" / "FJSUV" */
  code: string;
}

// ─── Sender / Receiver address (embedded on shipment) ────────────────────────
export interface ShipmentAddress {
  name: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  postalCode?: string;
}

// ─── Package payload ─────────────────────────────────────────────────────────
export interface PackageDimensions {
  l: number;
  w: number;
  h: number;
}

export interface ShipmentPackage {
  pieces: number;
  weightKg: number;
  dimensions?: PackageDimensions;
  description?: string;
  declaredValueUSD?: number;
}

// ─── Timeline event ──────────────────────────────────────────────────────────
export interface ShipmentEvent {
  timestamp: string;            // ISO
  status: ShipmentStatus;       // milestone status (may use legacy values)
  location: string;
  description: string;
  /** DHL milestone code (e.g. OC, DF, AF, AR, CC, DEP, OK) */
  code?: string;
}

// ─── Mode-specific specs ─────────────────────────────────────────────────────
export interface DepotStatus {
  /** Bonded warehouse name + bay (PNG / FJ specific in seed) */
  location: string;
  /** ISO date — when cargo entered the final depot. */
  since: string;
  /** Days the cargo has been at depot. */
  days: number;
  /** Internal triage priority. */
  priority: "MONITOR" | "ESCALATE" | "OVERDUE";
}

export interface OceanSpecifics {
  vessel: string;
  voyage: string;
  blNumber: string;
  containerNumber: string | null;
  containerType: string;        // e.g. "20FT_DRY", "40FT_HC", "LCL"
  sealNumber: string | null;
  freightTerm: string;          // e.g. "Prepaid (CIF)"
  /** Bill-of-lading originals printed, e.g. "3/3" */
  originals: string;
  goodsValueEur?: number;
  freightCostUsd?: number;
  /** ISO date */
  customsClearedDate?: string;
  finalDestination?: string;
  depotStatus: DepotStatus | null;

  // ── Derived fields (may be absent on the wire; getPickupBadge() fills them)
  /** Days left before the 5-business-day buyer pickup window closes. Negative when overdue. */
  pickupDaysRemaining?: number;
  /** True when `pickupDaysRemaining < 0`. */
  pickupOverdue?: boolean;
  /** ISO datetime — deadline = atDepotSince + 5 business days. */
  buyerPickupDeadline?: string;
  /** Alias of depotStatus.since at the top level — used by web Dashboard. */
  atDepotSince?: string;
}

export interface AirSpecifics {
  flightNumber?: string;
  airline?: string;
  mawbNumber?: string;
  hawbNumber?: string;
  etd?: string;                 // ISO
  eta?: string;                 // ISO
  goodsValueEur?: number;
  freightCostUsd?: number;
}

export interface RoadSpecifics {
  truckPlate?: string;
  driverName?: string;
  trailerType?: string;
  crossBorder?: boolean;
}

// ─── Shipment summary (list endpoint) ────────────────────────────────────────
export interface ShipmentSummary {
  awb: string;
  status: ShipmentStatus;
  service: string;
  origin: LocationCode;
  destination: LocationCode;
  receiverName: string;
  receiverCity: string;
  costPGK?: number;
  createdAt: string;
  estimatedDelivery?: string | null;
  eventsCount: number;
  mode: ShipmentMode;
  bookingReference?: string;
  etd?: string;
  eta?: string;
  originPort?: string;
  destinationPort?: string;
  actualDelivery?: string | null;
  oceanSpecifics?: OceanSpecifics | null;
  airSpecifics?: AirSpecifics | null;
  roadSpecifics?: RoadSpecifics | null;
}

// ─── Shipment full detail ────────────────────────────────────────────────────
export interface Shipment {
  awb: string;
  userId: string;
  sender: ShipmentAddress;
  receiver: ShipmentAddress;
  package: ShipmentPackage;
  service: string;
  status: ShipmentStatus;
  origin: LocationCode;
  destination: LocationCode;
  events: ShipmentEvent[];
  estimatedDelivery?: string | null;
  actualDelivery?: string | null;
  costPGK?: number;
  createdAt: string;
  updatedAt?: string;
  mode: ShipmentMode;
  bookingReference?: string;
  incoterms?: IncotermsCode | string;
  commodity?: string;
  hsCode?: string;
  cargoDescription?: string;
  originPort?: string;
  destinationPort?: string;
  etd?: string;
  eta?: string;
  airSpecifics?: AirSpecifics | null;
  oceanSpecifics?: OceanSpecifics | null;
  roadSpecifics?: RoadSpecifics | null;
  co2EstimateKg?: number;
}

// ─── Paginated list response ─────────────────────────────────────────────────
export interface ShipmentListResponse {
  items: ShipmentSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Parties / Address Book (Phase 8.4 rename to Parties) ───────────────────
export type PartyRole = "SHIPPER" | "CONSIGNEE" | "NOTIFY";

export interface Party {
  id: string;
  userId?: string;
  /** Phase 8.4 v2 explicit role. */
  role?: PartyRole;
  /** Legacy boolean flags (kept by backend for backward compat). */
  isDefaultSender?: boolean;
  isDefaultReceiver?: boolean;
  name: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Invoice (virtual ledger) ────────────────────────────────────────────────
export type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE" | "PENDING";

export interface Invoice {
  invoiceNumber: string;
  shipmentRef?: string;
  userId?: string;
  issueDate: string;            // ISO
  dueDate?: string | null;      // ISO — null for unpaid AT_DEPOT shipments awaiting deadline
  status: InvoiceStatus;
  /** Total in USD (Phase 8.x switched to USD). */
  totalUSD?: number;
  /** Legacy PGK total kept by the older shipper-account seed. */
  totalPGK?: number;
  /** Optional virtual-ledger metadata */
  origin?: string;
  destination?: string;
  vessel?: string;
  payee?: string;
  createdAt?: string;
}

// ─── Documents (Phase 8.3 module) ────────────────────────────────────────────
export type DocumentType =
  // Transport
  | "HBL" | "MBL" | "HAWB" | "MAWB" | "CMR"
  // Commercial
  | "COMMERCIAL_INVOICE" | "PACKING_LIST" | "PROFORMA_INVOICE" | "QUOTE_RATE_SHEET"
  // Customs / Origin
  | "CERTIFICATE_OF_ORIGIN" | "CUSTOMS_DECLARATION" | "IMPORT_EXPORT_PERMIT"
  // Operational
  | "DELIVERY_ORDER" | "PROOF_OF_DELIVERY" | "ARRIVAL_NOTICE" | "PRE_ALERT"
  | "BOOKING_CONFIRMATION" | "DHL_SHIPPING_FORM" | "WAREHOUSE_RECEIPT"
  | "PENDING_ACTION_NOTE"
  // Special
  | "INSURANCE_CERTIFICATE" | "DGD" | "FUMIGATION_CERT" | "PHYTOSANITARY_CERT"
  // Catch-all
  | "OTHER";

export type DocumentStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export interface ShipmentDocument {
  id: string;
  shipmentRef?: string;
  documentType: DocumentType;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  status: DocumentStatus;
  uploadedBy?: string;
  uploadedAt?: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  notes?: string;
  isDemoSeed?: boolean;
  tags?: string[];
}

// ─── Notifications ───────────────────────────────────────────────────────────
export type NotificationKind =
  | "AT_DEPOT_OVERDUE"
  | "AT_DEPOT_ARRIVAL"
  | "INVOICE_DUE"
  | "INVOICE_PAID"
  | "DOCUMENT_REQUIRED"
  | "DOCUMENT_APPROVED"
  | "BOOKING_CONFIRMED"
  | "SHIPMENT_UPDATE"
  | "SYSTEM";

export interface NotificationItem {
  id: string;
  userId?: string;
  /** Phase 8.4 normalised — either field may be present on the wire. */
  kind?: NotificationKind | string;
  type?: NotificationKind | string;
  title: string;
  body?: string;
  subtitle?: string;
  shipmentRef?: string;
  link?: string;
  read?: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page?: number;
  pageSize?: number;
  unreadCount?: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  phone?: string;
  country?: string;
  createdAt?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
}
