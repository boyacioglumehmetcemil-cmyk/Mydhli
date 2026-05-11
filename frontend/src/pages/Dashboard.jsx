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
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const KpiCard = ({ icon: Icon, label, value, suffix, accent }) => (
  <div
    data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}
    className="group bg-white border border-dhl-border p-6 relative transition-all hover:border-dhl-yellow"
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
    <div className="font-display text-5xl font-black text-dhl-text leading-none">
      {value}
      {suffix && (
        <span className="text-base font-bold text-dhl-muted ml-1.5">{suffix}</span>
      )}
    </div>
    <div className="mt-3 text-[11px] text-dhl-muted">No activity yet</div>
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

  const comingSoon = (feature) =>
    toast.info(`${feature} comes online in the next phase`, {
      description: "Phase 2 wires up the full module. Stay tuned!",
    });

  return (
    <div className="max-w-7xl mx-auto" data-testid="dashboard-page">
      {/* Welcome */}
      <div className="mb-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-dhl-red mb-2">
          MyDHL Express · Dashboard
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter">
          Welcome back, {user?.firstName || "there"}.
        </h1>
        <p className="text-sm text-dhl-muted mt-2">
          Here's a snapshot of your account. New modules — tracking, shipping, quotes — go live
          in the next phase.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <KpiCard
          icon={Package}
          label="Active Shipments"
          value="0"
          accent="bg-dhl-yellow text-dhl-ink"
        />
        <KpiCard
          icon={Truck}
          label="Pending Pickups"
          value="0"
          accent="bg-dhl-ink text-dhl-yellow"
        />
        <KpiCard
          icon={CircleDollarSign}
          label="This Month Spend"
          value="0"
          suffix="PGK"
          accent="bg-dhl-red text-white"
        />
        <KpiCard
          icon={Wallet}
          label="Account Balance"
          value="0"
          suffix="PGK"
          accent="bg-dhl-panel text-dhl-text border border-dhl-border"
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
            label="Ship Now"
            sub="Create a new shipment"
            onClick={() => comingSoon("Ship Now")}
            testId="quick-ship-now"
          />
          <QuickAction
            icon={Search}
            label="Track"
            sub="Look up an AWB"
            onClick={() => comingSoon("Track")}
            testId="quick-track"
          />
          <QuickAction
            icon={Calculator}
            label="Get Quote"
            sub="Estimate rates instantly"
            onClick={() => comingSoon("Get Quote")}
            testId="quick-quote"
          />
          <QuickAction
            icon={CalendarClock}
            label="Schedule Pickup"
            sub="Book a courier visit"
            onClick={() => comingSoon("Schedule Pickup")}
            testId="quick-pickup"
          />
        </div>
      </div>

      {/* Recent shipments — empty state */}
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
            View All
          </button>
        </div>
        <div className="px-6 py-20 flex flex-col items-center text-center" data-testid="recent-shipments-empty">
          <div className="w-20 h-20 mb-6 border-2 border-dashed border-dhl-border flex items-center justify-center">
            <PackageOpen className="w-10 h-10 text-dhl-muted" strokeWidth={1.5} />
          </div>
          <h4 className="font-display text-xl font-bold text-dhl-text mb-2">
            No shipments yet.
          </h4>
          <p className="text-sm text-dhl-muted max-w-sm mb-6">
            Once you create your first shipment, it'll show up here with live status,
            timestamps and proof-of-delivery.
          </p>
          <button
            type="button"
            data-testid="empty-state-ship-now"
            onClick={() => comingSoon("Ship Now")}
            className="inline-flex items-center h-11 px-6 bg-dhl-ink text-white font-bold uppercase tracking-wider text-xs hover:bg-dhl-red transition-colors"
          >
            Create Your First Shipment
            <ArrowRight className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
