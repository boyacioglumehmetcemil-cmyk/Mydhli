/**
 * Shipment helpers — single source of truth for status labels, colours,
 * route formatting and the AT_DEPOT buyer-pickup business rule.
 *
 * Mirrors /app/frontend/src/lib/shipmentUtils.js wherever applicable. Phase
 * 8.3+ promotes AT_DEPOT and DELIVERED to primary statuses; the legacy
 * IN_TRANSIT / OUT_FOR_DELIVERY / PICKED_UP / PENDING / ON_HOLD / EXCEPTION
 * values are kept for back-compat with timeline events and the older
 * shipper-account seed.
 */
import { Colors } from '../constants/colors';
import type {
  ShipmentStatus,
  ShipmentSummary,
  Shipment,
  OceanSpecifics,
  PrimaryShipmentStatus,
} from '../types/shipment';

// ─── Primary status set (Phase 8.3+ Ocean Freight) ──────────────────────────
export const PRIMARY_STATUSES: PrimaryShipmentStatus[] = ['AT_DEPOT', 'DELIVERED'];

// ─── Label / colour tables ──────────────────────────────────────────────────
// Kept as Record<string, …> so existing screens that index by raw status
// string don't break before Phase 2 refactors them.
export const STATUS_LABELS: Record<string, string> = {
  // Primary
  AT_DEPOT: 'At Depot',
  DELIVERED: 'Delivered',
  // Legacy / sub-state — surfaced inside timelines, never as a primary tab.
  PENDING: 'Pending',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  ON_HOLD: 'On Hold',
  EXCEPTION: 'Exception',
};

export interface StatusTone {
  bg: string;
  text: string;
  dot: string;
  /** Whether this state is operationally "actionable" (drives KPIs). */
  actionable: boolean;
}

export const STATUS_COLORS: Record<string, StatusTone> = {
  // Primary ─────────────────────────────────────────────────────────────────
  DELIVERED: {
    bg: Colors.green100,
    text: Colors.green900,
    dot: Colors.green600,
    actionable: false,
  },
  AT_DEPOT: {
    // Amber tone — matches web .bg-amber-50 / .text-amber-900 used in
    // /app/frontend/src/lib/shipmentUtils.js#STATUS_TONES.AT_DEPOT.
    bg: '#FFFBEB',
    text: '#78350F',
    dot: '#F59E0B',
    actionable: true,
  },
  // Legacy / sub-state ──────────────────────────────────────────────────────
  IN_TRANSIT: { bg: '#FFF8D6', text: Colors.dhlInk, dot: Colors.dhlYellow, actionable: true },
  OUT_FOR_DELIVERY: { bg: '#FFF8D6', text: Colors.dhlInk, dot: Colors.dhlYellow, actionable: true },
  PICKED_UP: { bg: '#FFF8D6', text: Colors.dhlInk, dot: Colors.dhlYellow, actionable: true },
  PENDING: { bg: Colors.gray100, text: Colors.gray700, dot: Colors.gray400, actionable: false },
  ON_HOLD: { bg: Colors.red100, text: Colors.dhlRed, dot: Colors.dhlRed, actionable: true },
  EXCEPTION: { bg: Colors.red100, text: Colors.dhlRed, dot: Colors.dhlRed, actionable: true },
};

// ─── Service labels ─────────────────────────────────────────────────────────
// Phase 8.x rebranded service names — kept aligned with web
// shipmentUtils.js#SERVICE_LABELS plus the freight rotation used in dashboard
// "recent shipments" cards.
export const SERVICE_LABELS: Record<string, string> = {
  // Legacy keys kept for backwards-compat with older shipper seed entries.
  EXPRESS_WORLDWIDE: 'Air Priority',
  EXPRESS_12_00: 'Air Economy',
  ECONOMY_SELECT: 'Ocean FCL',
  // Phase 8.3+ ocean container / explicit freight services.
  '20FT_DRY': "Ocean FCL — 20' Standard",
  '40FT_DRY': "Ocean FCL — 40' Standard",
  '40FT_HC': "Ocean FCL — 40' High Cube",
  LCL: 'Ocean LCL',
  AIR_PRIORITY: 'Air Priority',
  AIR_ECONOMY: 'Air Economy',
  ROAD_DIRECT: 'Road Direct',
};

export const FREIGHT_SERVICE_ROTATION = [
  'OCEAN FCL',
  'AIR PRIORITY',
  'AIR ECONOMY',
  'OCEAN LCL',
  'ROAD DIRECT',
] as const;

/** Stable per-AWB freight service label (mirrors web freightServiceFor). */
export const freightServiceFor = (awb: string): string => {
  const key = String(awb || '');
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FREIGHT_SERVICE_ROTATION[h % FREIGHT_SERVICE_ROTATION.length];
};

// ─── Progress percentages ───────────────────────────────────────────────────
export const STATUS_PROGRESS: Record<string, number> = {
  PENDING: 5,
  PICKED_UP: 18,
  IN_TRANSIT: 55,
  OUT_FOR_DELIVERY: 85,
  AT_DEPOT: 70,
  DELIVERED: 100,
  ON_HOLD: 40,
  EXCEPTION: 40,
};

// ─── Resilient getters (Phase 2 UIs should prefer these) ───────────────────
export const getStatusLabel = (status?: ShipmentStatus | string): string => {
  if (!status) return '—';
  return STATUS_LABELS[status] || String(status);
};

export const getStatusColor = (status?: ShipmentStatus | string): StatusTone => {
  if (!status) return STATUS_COLORS.PENDING;
  return STATUS_COLORS[status] || STATUS_COLORS.PENDING;
};

export const isPrimaryStatus = (status?: ShipmentStatus | string): boolean =>
  !!status && (PRIMARY_STATUSES as string[]).includes(status);

// ─── AT_DEPOT business rule: buyer pickup window (5 business days) ─────────
// Web spec (handover): "AT_DEPOT business logic: final depot + 5 business
// gün deadline, pickupDaysRemaining, pickupOverdue rozetleri".
//
// The backend stores `oceanSpecifics.depotStatus.since` (ISO date when the
// cargo entered the bonded warehouse). It does NOT yet populate
// `pickupDaysRemaining` / `pickupOverdue` / `buyerPickupDeadline` /
// `atDepotSince` — the web app reads those defensively. Mobile derives them
// here so AT_DEPOT badges always render correctly.

/** Adds N business days (Mon–Fri) to a date. */
export const addBusinessDays = (start: Date, days: number): Date => {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d;
};

/** Counts business days from `start` up to (but not including) `end`. Sign
 *  follows the chronological direction (end < start → negative). */
export const businessDaysBetween = (start: Date, end: Date): number => {
  if (start.getTime() === end.getTime()) return 0;
  const reverse = end < start;
  const [a, b] = reverse ? [end, start] : [start, end];
  let count = 0;
  const cursor = new Date(a);
  while (cursor < b) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return reverse ? -count : count;
};

export interface PickupBadge {
  /** Short label shown on the badge ("3 days remaining" / "2 days overdue"). */
  text: string;
  /** Full sentence label for accessibility. */
  longText: string;
  /** Background tone (mobile uses style="backgroundColor"). */
  bg: string;
  /** Foreground / text colour. */
  fg: string;
  /** Border colour for outlined chips. */
  border: string;
  /** True when window has lapsed. */
  overdue: boolean;
  /** True when within ≤2 business days of deadline (or already overdue). */
  urgent: boolean;
  /** Derived business-day countdown (negative when overdue). */
  daysRemaining: number;
  /** ISO date of the deadline (depot.since + 5 business days). */
  deadlineISO: string | null;
}

/**
 * Computes the buyer-pickup badge for an AT_DEPOT shipment.
 *
 * Order of precedence for each field:
 *   1. Explicit value on `oceanSpecifics` (if backend ever populates it).
 *   2. Derived from `oceanSpecifics.depotStatus.since` + 5 business days.
 *
 * Returns `null` when the shipment isn't AT_DEPOT or has no depot timestamp.
 */
export const getPickupBadge = (
  shipment: Pick<Shipment, 'status' | 'oceanSpecifics'> | ShipmentSummary | null | undefined,
): PickupBadge | null => {
  if (!shipment) return null;
  if (shipment.status !== 'AT_DEPOT') return null;

  const spec = (shipment.oceanSpecifics || null) as OceanSpecifics | null;
  if (!spec) return null;

  const sinceISO = spec.atDepotSince || spec.depotStatus?.since || null;
  if (!sinceISO) return null;

  const since = new Date(sinceISO);
  if (Number.isNaN(since.getTime())) return null;

  // Deadline: prefer explicit, else compute since + 5 business days.
  const deadline = spec.buyerPickupDeadline
    ? new Date(spec.buyerPickupDeadline)
    : addBusinessDays(since, 5);

  // Days remaining: prefer explicit, else businessDaysBetween(now, deadline).
  const now = new Date();
  const daysRemaining = typeof spec.pickupDaysRemaining === 'number'
    ? spec.pickupDaysRemaining
    : businessDaysBetween(now, deadline);
  const overdue = typeof spec.pickupOverdue === 'boolean'
    ? spec.pickupOverdue
    : daysRemaining < 0;
  const urgent = overdue || daysRemaining <= 2;

  const absDays = Math.abs(daysRemaining);
  const text = overdue
    ? `${absDays} day${absDays === 1 ? '' : 's'} overdue`
    : `${absDays} day${absDays === 1 ? '' : 's'} remaining`;
  const longText = overdue
    ? `Buyer pickup window closed ${absDays} business day${absDays === 1 ? '' : 's'} ago`
    : `Buyer must collect within ${absDays} business day${absDays === 1 ? '' : 's'}`;

  // Colour tokens: overdue = DHL red, urgent = amber, otherwise neutral amber.
  const palette = overdue
    ? { bg: Colors.red100, fg: Colors.dhlRed, border: Colors.dhlRed }
    : urgent
      ? { bg: '#FEF3C7', fg: '#92400E', border: '#F59E0B' }
      : { bg: '#FFFBEB', fg: '#78350F', border: '#F59E0B' };

  return {
    text,
    longText,
    ...palette,
    overdue,
    urgent,
    daysRemaining,
    deadlineISO: deadline.toISOString(),
  };
};

// ─── Route formatting ───────────────────────────────────────────────────────
/** "Singapore → Port Moresby" style route label. */
export const formatRoute = (
  shipment: Pick<Shipment, 'origin' | 'destination'> | ShipmentSummary | null | undefined,
): string => {
  if (!shipment) return '—';
  const o = shipment.origin?.city || shipment.origin?.code || '—';
  const d = shipment.destination?.city || shipment.destination?.code || '—';
  return `${o} → ${d}`;
};

/** Short port-code route, e.g. "SGSIN → PGPOM". */
export const formatRouteCodes = (
  shipment: Pick<Shipment, 'origin' | 'destination'> | ShipmentSummary | null | undefined,
): string => {
  if (!shipment) return '—';
  const o = shipment.origin?.code || shipment.origin?.city || '—';
  const d = shipment.destination?.code || shipment.destination?.city || '—';
  return `${o} → ${d}`;
};

// ─── Date / currency formatters ─────────────────────────────────────────────
export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

/** Legacy PGK formatter — kept for older shipper-account screens. */
export const formatPGK = (n?: number | null): string => {
  const val = Number(n || 0);
  return `K ${val.toFixed(2)}`;
};

/** Phase 8.x preferred currency formatter (USD ledger). */
export const formatUSD = (n?: number | null): string => {
  const val = Number(n || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};
