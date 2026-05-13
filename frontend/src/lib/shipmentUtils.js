/* Shipment status colors + labels — single source of truth. */
export const STATUS_LABELS = {
  PENDING: "Pending",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  ON_HOLD: "On Hold",
  EXCEPTION: "Exception",
};

export const STATUS_TONES = {
  DELIVERED: {
    bg: "bg-green-100",
    text: "text-green-900",
    border: "border-green-600",
    dot: "bg-green-600",
    banner: "bg-green-600",
    bannerText: "text-white",
  },
  IN_TRANSIT: {
    bg: "bg-dhl-yellow/30",
    text: "text-dhl-ink",
    border: "border-dhl-yellow",
    dot: "bg-dhl-yellow",
    banner: "bg-dhl-yellow",
    bannerText: "text-dhl-ink",
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-dhl-yellow/30",
    text: "text-dhl-ink",
    border: "border-dhl-yellow",
    dot: "bg-dhl-yellow",
    banner: "bg-dhl-yellow",
    bannerText: "text-dhl-ink",
  },
  PICKED_UP: {
    bg: "bg-dhl-yellow/20",
    text: "text-dhl-ink",
    border: "border-dhl-yellow",
    dot: "bg-dhl-yellow",
    banner: "bg-dhl-yellow",
    bannerText: "text-dhl-ink",
  },
  PENDING: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-400",
    dot: "bg-gray-400",
    banner: "bg-gray-500",
    bannerText: "text-white",
  },
  ON_HOLD: {
    bg: "bg-red-100",
    text: "text-dhl-red",
    border: "border-dhl-red",
    dot: "bg-dhl-red",
    banner: "bg-dhl-red",
    bannerText: "text-white",
  },
  EXCEPTION: {
    bg: "bg-red-100",
    text: "text-dhl-red",
    border: "border-dhl-red",
    dot: "bg-dhl-red",
    banner: "bg-dhl-red",
    bannerText: "text-white",
  },
};

export const SERVICE_LABELS = {
  // Legacy keys kept for backwards-compat with existing seeded shipments. The
  // pitch is now DHL Global Forwarding — freight, not parcel — so the visible
  // label is the freight service name. The underlying enum / seed isn't
  // changed in Phase 8.1 (label-only sweep).
  EXPRESS_WORLDWIDE: "Air Priority",
  EXPRESS_12_00: "Air Economy",
  ECONOMY_SELECT: "Ocean FCL",
};

// Rotated mock freight services used in dashboard recent-shipments preview and
// other "Service" columns. Index by AWB hash for stable per-row labels.
export const FREIGHT_SERVICE_ROTATION = [
  "OCEAN FCL",
  "AIR PRIORITY",
  "AIR ECONOMY",
  "OCEAN LCL",
  "ROAD DIRECT",
];

export const freightServiceFor = (awb) => {
  const key = String(awb || "");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FREIGHT_SERVICE_ROTATION[h % FREIGHT_SERVICE_ROTATION.length];
};

// Approximate progress percentage by status (for the route bar)
export const STATUS_PROGRESS = {
  PENDING: 5,
  PICKED_UP: 18,
  IN_TRANSIT: 55,
  OUT_FOR_DELIVERY: 85,
  DELIVERED: 100,
  ON_HOLD: 40,
  EXCEPTION: 40,
};

export const formatDate = (iso, opts = {}) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...opts,
    });
  } catch {
    return iso;
  }
};

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const formatPGK = (n) =>
  new Intl.NumberFormat("en-PG", {
    style: "currency",
    currency: "PGK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));
