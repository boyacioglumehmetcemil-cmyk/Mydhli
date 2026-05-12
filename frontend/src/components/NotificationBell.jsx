import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Package, Truck, Receipt, AlertCircle, Loader2, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

const TYPE_ICON = {
  SHIPMENT_DELIVERED: Package,
  OUT_FOR_DELIVERY: Truck,
  IN_TRANSIT: Truck,
  PICKUP_CONFIRMED: Truck,
  INVOICE_PAID: Receipt,
  SERVICE_UPDATE: AlertCircle,
};

function relativeTime(iso) {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const r = await api.get("/notifications/unread-count");
      setUnread(r.data?.unread || 0);
    } catch {/* ignore */}
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/notifications?pageSize=8");
      setItems(r.data?.items || []);
      setUnread(r.data?.unread || 0);
    } catch {/* ignore */}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  // Poll unread count every 60s while mounted
  useEffect(() => {
    const id = setInterval(fetchCount, 60000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Open/close + outside-click + ESC
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchList();
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      setUnread(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Couldn't mark as read");
    }
  };

  const handleClickItem = async (n) => {
    if (!n.readAt) {
      try {
        await api.post(`/notifications/${n.id}/read`);
        setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
        setUnread((u) => Math.max(0, u - 1));
      } catch {/* ignore */}
    }
    setOpen(false);
    if (n.awb) navigate(`/dashboard/shipments/${n.awb}`);
    else if (n.invoiceNumber) navigate(`/dashboard/invoices`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        data-testid="notification-bell"
        className="relative h-10 w-10 hover:bg-dhl-panel"
        onClick={toggle}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-dhl-text" />
        {unread > 0 && (
          <span
            data-testid="notification-bell-badge"
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-dhl-red text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div
          data-testid="notification-dropdown"
          className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-32px)] bg-white border border-dhl-border shadow-xl z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dhl-border">
            <div className="font-bold text-sm text-dhl-text">Notifications</div>
            <button
              type="button"
              data-testid="notification-mark-all-read"
              onClick={markAllRead}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0EA5B7] hover:text-[#0B8C9C] disabled:text-dhl-muted disabled:cursor-default transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all as read
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[440px] overflow-y-auto">
            {loading && (
              <div className="px-4 py-10 flex justify-center text-dhl-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="px-4 py-10 text-center text-dhl-muted text-xs">
                You're all caught up.
              </div>
            )}
            {!loading && items.map((n) => {
              const Icon = TYPE_ICON[n.type] || AlertCircle;
              const isUnread = !n.readAt;
              return (
                <button
                  type="button"
                  key={n.id}
                  data-testid={`notification-item-${n.id}`}
                  onClick={() => handleClickItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-dhl-border last:border-b-0 hover:bg-dhl-panel transition-colors flex gap-3 items-start ${isUnread ? "bg-[#FFFDE7]" : ""}`}
                >
                  {/* Unread dot */}
                  <div className="pt-1 w-2 flex-shrink-0">
                    {isUnread && (
                      <span className="block w-2 h-2 bg-dhl-yellow rounded-full" />
                    )}
                  </div>
                  <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-dhl-panel border border-dhl-border">
                    <Icon className="w-4 h-4 text-dhl-text" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[13px] leading-tight truncate ${isUnread ? "font-bold text-dhl-text" : "font-semibold text-dhl-text"}`}>
                      {n.title}
                    </div>
                    <div className="text-[11px] text-dhl-muted mt-0.5 truncate">
                      {n.subtitle}
                    </div>
                    <div className="text-[10px] text-dhl-muted mt-1">
                      {relativeTime(n.createdAt)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-dhl-border px-4 py-2.5 text-center">
            <button
              type="button"
              data-testid="notification-view-all"
              onClick={() => { setOpen(false); toast.info("Full inbox coming soon"); }}
              className="text-[11px] font-semibold text-[#0EA5B7] hover:text-[#0B8C9C] transition-colors"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
