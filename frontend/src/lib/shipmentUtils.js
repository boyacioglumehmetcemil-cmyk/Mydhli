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
  EXPRESS_WORLDWIDE: "Express Worldwide",
  EXPRESS_12_00: "Express 12:00",
  ECONOMY_SELECT: "Economy Select",
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
