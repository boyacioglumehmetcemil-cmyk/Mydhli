// Notifications full-list page — surfaces every notification the user has
// received, with read/unread filtering, mark-all-read, and a row click that
// jumps to the linked shipment. Designed to match the row rhythm of
// DocumentsGlobal so the dashboard feels typographically consistent.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, BellRing, AlertTriangle, CheckCircle, FileText,
  ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import useTitle from "@/hooks/useTitle";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const KIND_ICON = {
  alert:    AlertTriangle,
  status:   CheckCircle,
  document: FileText,
};
const KIND_TONE = {
  alert:    "text-dhl-red",
  status:   "text-green-700",
  document: "text-dhl-text",
};

const fmt = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const Notifications = () => {
  useTitle("Notifications · myDHLi");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");

  const load = () => {
    setLoading(true);
    api.get("/notifications", { params: { pageSize: 50 } })
      .then((r) => setItems(r.data.items || r.data || []))
      .catch(() => toast.error("Unable to load notifications."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      load();
    } catch {
      toast.error("Failed to mark as read.");
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      toast.success("All notifications marked as read.");
      load();
    } catch {
      toast.error("Failed.");
    }
  };

  const filtered = items.filter((n) => {
    if (tab === "UNREAD") return !n.readAt;
    if (tab === "READ")   return !!n.readAt;
    return true;
  });
  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="notifications-page">
      <nav className="text-xs text-dhl-muted mb-3" aria-label="Breadcrumb">
        <Link to="/dashboard" className="hover:text-dhl-ink">Dashboard</Link>
        <ChevronRight className="inline w-3 h-3 mx-1" />
        <span className="text-dhl-text font-bold">Notifications</span>
      </nav>

      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-dhl-text">Notifications</h1>
          <p className="text-sm text-dhl-muted mt-1">
            Shipment, pickup deadline and document activity across your account.
          </p>
        </div>
        <Button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          data-testid="notif-mark-all-read"
          className="h-10 bg-white text-dhl-ink hover:bg-dhl-yellow rounded-md font-bold uppercase tracking-wider text-[11px] border-2 border-dhl-ink disabled:opacity-40 px-4"
        >
          Mark all as read
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6" data-testid="notif-tabs">
        {[
          { key: "ALL",    label: `All (${items.length})` },
          { key: "UNREAD", label: `Unread (${unreadCount})` },
          { key: "READ",   label: `Read (${items.length - unreadCount})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-testid={`notif-tab-${t.key.toLowerCase()}`}
            className={`inline-flex items-center px-3 h-8 text-[11px] font-bold uppercase tracking-wider rounded-full border-2 transition-colors ${
              tab === t.key
                ? "bg-dhl-yellow text-dhl-ink border-dhl-ink"
                : "bg-white text-dhl-muted border-dhl-border hover:border-dhl-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="bg-white border border-dhl-border rounded-lg">
        {loading ? (
          <div className="py-16 text-center" data-testid="notif-loading">
            <Loader2 className="w-7 h-7 text-dhl-yellow mx-auto mb-2 animate-spin" />
            <p className="text-xs text-dhl-muted">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-6 text-center" data-testid="notif-empty">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-dhl-border flex items-center justify-center rounded-lg">
              <Bell className="w-8 h-8 text-dhl-muted" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-base font-bold text-dhl-text mb-1">No notifications</h3>
            <p className="text-xs text-dhl-muted">You're all caught up. New shipment events will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-dhl-border" data-testid="notif-list">
            {filtered.map((n) => {
              const Icon = KIND_ICON[n.kind] || BellRing;
              const tone = KIND_TONE[n.kind] || "text-dhl-text";
              const isUnread = !n.readAt;
              return (
                <li
                  key={n.id}
                  data-testid={`notif-row-${n.id}`}
                  className={`grid grid-cols-12 gap-3 items-start px-5 py-4 hover:bg-dhl-yellow/5 transition-colors ${
                    isUnread ? "bg-dhl-yellow/10" : ""
                  }`}
                >
                  <div className="col-span-1 pt-0.5">
                    <Icon className={`w-5 h-5 ${tone}`} />
                  </div>
                  <div className="col-span-9 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-bold truncate ${isUnread ? "text-dhl-text" : "text-dhl-muted"}`}>
                        {n.title}
                      </h3>
                      {isUnread && (
                        <span className="inline-block w-2 h-2 rounded-full bg-dhl-red" aria-hidden="true" />
                      )}
                    </div>
                    {n.body && <p className="text-xs text-dhl-muted leading-relaxed">{n.body}</p>}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-dhl-muted">
                      <span>{fmt(n.createdAt)}</span>
                      {n.awb && (
                        <>
                          <span>·</span>
                          <Link to={`/dashboard/shipments/${n.awb}`} className="font-mono font-bold text-dhl-red hover:underline">
                            {n.awb}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-right whitespace-nowrap">
                    {isUnread ? (
                      <button
                        onClick={() => markRead(n.id)}
                        data-testid={`notif-mark-${n.id}`}
                        className="text-[11px] font-bold text-dhl-red hover:underline"
                      >
                        Mark read
                      </button>
                    ) : (
                      <span className="text-[10px] text-dhl-muted">Read</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
