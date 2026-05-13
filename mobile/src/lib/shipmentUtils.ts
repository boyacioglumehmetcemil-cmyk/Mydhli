import { Colors } from '../constants/colors';

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  ON_HOLD: 'On Hold',
  EXCEPTION: 'Exception',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  DELIVERED: { bg: Colors.green100, text: Colors.green900, dot: Colors.green600 },
  IN_TRANSIT: { bg: '#FFF8D6', text: Colors.dhlInk, dot: Colors.dhlYellow },
  OUT_FOR_DELIVERY: { bg: '#FFF8D6', text: Colors.dhlInk, dot: Colors.dhlYellow },
  PICKED_UP: { bg: '#FFF8D6', text: Colors.dhlInk, dot: Colors.dhlYellow },
  PENDING: { bg: Colors.gray100, text: Colors.gray700, dot: Colors.gray400 },
  ON_HOLD: { bg: Colors.red100, text: Colors.dhlRed, dot: Colors.dhlRed },
  EXCEPTION: { bg: Colors.red100, text: Colors.dhlRed, dot: Colors.dhlRed },
};

export const SERVICE_LABELS: Record<string, string> = {
  EXPRESS_WORLDWIDE: 'Express Worldwide',
  EXPRESS_12_00: 'Express 12:00',
  ECONOMY_SELECT: 'Economy Select',
};

export const STATUS_PROGRESS: Record<string, number> = {
  PENDING: 5,
  PICKED_UP: 18,
  IN_TRANSIT: 55,
  OUT_FOR_DELIVERY: 85,
  DELIVERED: 100,
  ON_HOLD: 40,
  EXCEPTION: 40,
};

export const formatDate = (iso?: string): string => {
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

export const formatDateTime = (iso?: string): string => {
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

export const formatPGK = (n?: number): string => {
  const val = Number(n || 0);
  return `K ${val.toFixed(2)}`;
};
