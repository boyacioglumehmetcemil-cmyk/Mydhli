import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  Wallet,
  CircleDollarSign,
  Send,
  Search,
  Calculator,
  CalendarClock,
  PackageOpen,
  Container,
  Plane,
  Timer,
  ShieldAlert,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import MiniSparkline from "@/components/MiniSparkline";
import useTitle from "@/hooks/useTitle";
import api from "@/lib/api";
import { formatDate, formatPGK, freightServiceFor } from "@/lib/shipmentUtils";

const ACTIVE_STATUSES = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"];

// Deterministic 7-day mock sparkline data for visual storytelling
const sparkData = {
  active: [3, 4, 6, 5, 8, 12, 15],
  pickups: [0, 1, 0, 2, 1, 0, 0],
  spend: [0, 0, 0, 1200, 880, 3400, 9100],
  balance: [4200, 3800, 3500, 2900, 2100, 1500, 0],
  teu: [4, 5, 6, 6, 7, 9, 12],
  air: [120, 180, 240, 220, 310, 380, 420],
  transit: [5.2, 5.1, 4.9, 4.8, 4.6, 4.5, 4.4],
  holds: [0, 1, 1, 2, 1, 1, 0],
};

const KpiCard = ({ icon: Icon, label, value, suffix, accent, sub, loading, testId, spark, sparkColor }) => (
  <div
    data-testid={testId || `kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}
    className="group bg-white border border-dhl-border p-6 relative transition-all hover:border-dhl-yellow hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-dhl-yellow scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
    <div className="flex items-start justify-between mb-5">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-dhl-muted">
        {label}
      </div>
      <div className={`w-9 h-9 flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" strokeWidth={2} />
      </div>
    </div>
    <div className="font-display text-5xl font-black text-dhl-text leading-none tabular-nums tracking-tight">
      {loading ? <Loader2 className="w-7 h-7 animate-spin text-dhl-muted" /> : value}
      {!loading && suffix && (
        <span className="text-base font-bold text-dhl-muted ml-1.5">{suffix}</span>
      )}
    </div>
    {spark && !loading && (
      <div className="mt-3 -mx-1">
        <MiniSparkline data={spark} color={sparkColor || "#FFCC00"} height={26} />
      </div>
    )}
    <div className="mt-2 text-[11px] text-dhl-muted">{sub || "—"}</div>
  </div>
);

const QuickAction = ({ icon: Icon, label, sub, onClick, testId }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    className="group text-left bg-white border-2 border-dhl-border p-6 transition-all hover:border-dhl-ink hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#FFCC00] flex flex-col items-start"
  >
    <div className="w-10 h-10 bg-dhl-yellow flex items-center justify-center mb-5 group-hover:bg-dhl-ink transition-colors">
      <Icon className="w-5 h-5 text-dhl-ink group-hover:text-dhl-yellow" strokeWidth={2} />
    </div>
    <div className="font-display font-bold text-lg text-dhl-text mb-1">{label}</div>
    <div className="text-xs text-dhl-muted">{sub}</div>
    <div className="mt-4 inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-dhl-red opacity-0 group-hover:opacity-100 transition-opacity">
      Open <ArrowRight className="ml-1 w-3 h-3" />
    </div>
  </button>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useTitle("Dashboard");

  const [stats, setStats] = useState({ active: 0, monthSpend: 0, total: 0, loading: true });
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fetch recent shipments (last 5)
    api
      .get("/shipments", { params: { page: 1, pageSize: 5 } })
      .then((res) => {
        if (mounted) setRecent(res.data.items);
      })
      .catch(() => {})
      .finally(() => mounted && setRecentLoading(false));

    // Fetch active count + this month spend
    Promise.all(
      ACTIVE_STATUSES.map((st) =>
        api.get("/shipments", { params: { status: st, page: 1, pageSize: 1 } }),
      ),
    )
      .then((responses) => {
        if (!mounted) return;
        const active = responses.reduce((acc, r) => acc + (r.data?.total || 0), 0);
        setStats((s) => ({ ...s, active, loading: false }));
      })
      .catch(() => mounted && setStats((s) => ({ ...s, loading: false })));

    // For "this month spend": fetch up to 100 latest, sum costPGK of those created in current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    api
      .get("/shipments", { params: { dateFrom: monthStart, page: 1, pageSize: 100 } })
      .then((res) => {
        if (!mounted) return;
        const monthSpend = res.data.items.reduce((sum, it) => sum + (it.costPGK || 0), 0);
        const total = res.data.total;
        setStats((s) => ({ ...s, monthSpend, total }));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const comingSoon = (feature) =>
    toast.info(`${feature} comes online in the next phase`, {
      description: "Phase 3 wires up the full module.",
    });

  const quickShip = () => navigate("/dashboard/ship");
  const quickQuote = () => navigate("/dashboard/quote");
  const quickPickup = () => navigate("/dashboard/pickup");

  return (
    <div className="max-w-7xl mx-auto" data-testid="dashboard-page">
      {/* Welcome */}
      <div className="mb-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-dhl-red mb-2">
          myDHLi · Freight Forwarding
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter">
          Welcome back, {user?.firstName || "there"}.
        </h1>
        <p className="text-sm text-dhl-muted mt-2">
          Air, ocean and road freight at a glance. Open a booking to see milestones,
          documents and the full chain of custody.
        </p>
      </div>

      {/* KPI cards — operational */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <KpiCard
          icon={Package}
          label="Active Bookings"
          value={stats.active}
          accent="bg-dhl-yellow text-dhl-ink"
          loading={stats.loading}
          sub={stats.active > 0 ? "Moving right now" : "No active bookings"}
          spark={sparkData.active}
          sparkColor="#FFCC00"
        />
        <KpiCard
          icon={Truck}
          label="Awaiting Pickup"
          value="0"
          accent="bg-dhl-ink text-dhl-yellow"
          sub="No collections scheduled"
          spark={sparkData.pickups}
          sparkColor="#1A1A1A"
        />
        <KpiCard
          icon={CircleDollarSign}
          label="This Month Spend"
          value={Number(stats.monthSpend || 0).toFixed(0)}
          suffix="PGK"
          accent="bg-dhl-red text-white"
          sub={stats.monthSpend > 0 ? "Current billing period" : "No charges yet"}
          spark={sparkData.spend}
          sparkColor="#D40511"
        />
        <KpiCard
          icon={Wallet}
          label="Outstanding Balance"
          value="0"
          suffix="PGK"
          accent="bg-dhl-panel text-dhl-text border border-dhl-border"
          sub="Open invoices"
          spark={sparkData.balance}
          sparkColor="#666666"
        />
      </div>

      {/* KPI cards — freight forwarding (mock data; Phase 8.2 wires live values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <KpiCard
          icon={Container}
          label="TEU in Transit"
          value="12"
          accent="bg-dhl-yellow text-dhl-ink"
          sub="Ocean FCL · 20'/40'/HC mix"
          spark={sparkData.teu}
          sparkColor="#FFCC00"
          testId="kpi-teu-in-transit"
        />
        <KpiCard
          icon={Plane}
          label="Air Tonnage MTD"
          value="420"
          suffix="kg"
          accent="bg-dhl-ink text-dhl-yellow"
          sub="Air priority + economy"
          spark={sparkData.air}
          sparkColor="#1A1A1A"
          testId="kpi-air-tonnage-mtd"
        />
        <KpiCard
          icon={Timer}
          label="Avg Transit Days"
          value="4.4"
          accent="bg-dhl-red text-white"
          sub="Across all modes · 30-day"
          spark={sparkData.transit}
          sparkColor="#D40511"
          testId="kpi-avg-transit-days"
        />
        <KpiCard
          icon={ShieldAlert}
          label="Customs Holds"
          value="0"
          accent="bg-dhl-panel text-dhl-text border border-dhl-border"
          sub="Awaiting broker action"
          spark={sparkData.holds}
          sparkColor="#666666"
          testId="kpi-customs-holds"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted mb-1">
              Quick Actions
            </div>
            <h2 className="font-display text-2xl font-black text-dhl-text">What's next?</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <QuickAction
            icon={Send}
            label="Book Shipment"
            sub="Air · Ocean · Road freight"
            onClick={quickShip}
            testId="quick-ship-now"
          />
          <QuickAction
            icon={Search}
            label="Track"
            sub="HAWB · BL · Container No."
            onClick={() => navigate("/track")}
            testId="quick-track"
          />
          <QuickAction
            icon={Calculator}
            label="Quote & Compare"
            sub="Rate freight in seconds"
            onClick={quickQuote}
            testId="quick-quote"
          />
          <QuickAction
            icon={CalendarClock}
            label="Schedule Pickup"
            sub="Book a courier visit"
            onClick={quickPickup}
            testId="quick-pickup"
          />
        </div>
      </div>

      {/* Recent shipments */}
      <div className="bg-white border border-dhl-border">
        <div className="border-b border-dhl-border px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted">
              Activity
            </div>
            <h3 className="font-display text-lg font-bold text-dhl-text mt-0.5">
              Recent Shipments
            </h3>
          </div>
          <button
            type="button"
            data-testid="view-all-shipments"
            onClick={() => navigate("/dashboard/shipments")}
            className="text-xs font-bold uppercase tracking-wider text-dhl-red hover:underline"
          >
            View All →
          </button>
        </div>

        {recentLoading ? (
          <div className="px-6 py-16 text-center" data-testid="recent-shipments-loading">
            <Loader2 className="w-7 h-7 text-dhl-yellow mx-auto mb-3 animate-spin" />
            <p className="text-sm text-dhl-muted">Loading recent shipments…</p>
          </div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-20 flex flex-col items-center text-center" data-testid="recent-shipments-empty">
            <div className="w-20 h-20 mb-6 border-2 border-dashed border-dhl-border flex items-center justify-center">
              <PackageOpen className="w-10 h-10 text-dhl-muted" strokeWidth={1.5} />
            </div>
            <h4 className="font-display text-xl font-bold text-dhl-text mb-2">
              No shipments yet.
            </h4>
            <p className="text-sm text-dhl-muted max-w-sm mb-6">
              Once you create your first shipment, it'll show up here with live status and
              proof-of-delivery.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto" data-testid="recent-shipments-table">
              <table className="w-full text-sm">
                <thead className="bg-dhl-panel border-b border-dhl-border">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                      AWB
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                      Service
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                      Receiver
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                      Route
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                      Created
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr
                      key={s.awb}
                      data-testid={`recent-row-${s.awb}`}
                      onClick={() => navigate(`/dashboard/shipments/${s.awb}`)}
                      className="border-b border-dhl-border last:border-b-0 cursor-pointer hover:bg-dhl-yellow/10 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono font-bold text-dhl-text">
                        {s.awb}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider bg-dhl-ink text-dhl-yellow font-mono">
                          {freightServiceFor(s.awb)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-dhl-text">{s.receiverName}</div>
                        <div className="text-xs text-dhl-muted">{s.receiverCity}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-dhl-text">{s.origin.code}</span>
                          <ArrowRight className="w-3 h-3 text-dhl-red" />
                          <span className="font-bold text-dhl-text">{s.destination.code}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={s.status} size="sm" />
                      </td>
                      <td className="px-5 py-3 text-dhl-muted">{formatDate(s.createdAt)}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-dhl-text">
                        {formatPGK(s.costPGK)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-dhl-border" data-testid="recent-shipments-cards">
              {recent.map((s) => (
                <button
                  type="button"
                  key={s.awb}
                  onClick={() => navigate(`/dashboard/shipments/${s.awb}`)}
                  className="w-full text-left p-4 hover:bg-dhl-yellow/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-mono font-bold text-dhl-text">{s.awb}</div>
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                  <div className="text-sm font-medium text-dhl-text mb-1">{s.receiverName}</div>
                  <div className="flex items-center gap-2 text-xs font-mono text-dhl-muted">
                    <span className="font-bold text-dhl-text">{s.origin.code}</span>
                    <ArrowRight className="w-3 h-3 text-dhl-red" />
                    <span className="font-bold text-dhl-text">{s.destination.code}</span>
                    <span className="ml-auto font-mono font-bold text-dhl-text">{formatPGK(s.costPGK)}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
