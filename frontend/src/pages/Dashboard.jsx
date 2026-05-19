/**
 * Dashboard — myDHLi-style OTP overview surface.
 *
 * Word reference: image1 "On-Time Performance (OTP)".
 *
 * Layout (top → bottom):
 *   - PageBanner with timer icon + "On-Time Performance (OTP)"
 *   - Filter chips row (ORG/DEST filters, Languages — visual only, no behaviour)
 *   - Two-column body:
 *       LEFT  (240px): Bookmarks + Filters stack
 *       RIGHT (flex): Top row of 3 KPI/gauge cards + lanes bar chart card
 *                     Bottom row monthly/weekly trend chart + lanes by volume
 *   - Footer note (default period)
 *
 * Data: all live data has been zeroed out pending logbook integration. Every
 * widget shows its empty-state surface (— or "No data yet") but the structure
 * mirrors the real OTP screen exactly so the visual remains 99% identical.
 */
import { useState } from "react";
import {
  Timer,
  Bookmark,
  ChevronDown,
  Filter,
  Search,
  Maximize2,
  Globe,
} from "lucide-react";
import PageBanner from "@/components/PageBanner";
import useTitle from "@/hooks/useTitle";

/* ───────────────────── Gauge card (Gross OTP / Net OTP) ───────────────────── */
const GaugeCard = ({ label, value, suffix = "" }) => {
  return (
    <div className="bg-white border border-dhl-border rounded-sm p-5 flex flex-col" data-testid={`gauge-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="text-sm font-semibold text-dhl-ink mb-3">{label}</div>
      {/* Gauge SVG — semi-circle, grey track + yellow fill */}
      <div className="flex-1 flex items-center justify-center my-2">
        <svg viewBox="0 0 200 110" className="w-full max-w-[200px]">
          {/* track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E0DED9"
            strokeWidth="14"
            strokeLinecap="butt"
          />
          {/* fill — 0 (empty) */}
          {value != null && value > 0 && (
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#FFCC00"
              strokeWidth="14"
              strokeLinecap="butt"
              strokeDasharray={`${(value / 100) * 251.3} 251.3`}
            />
          )}
          {/* center value */}
          <text x="100" y="85" textAnchor="middle" className="fill-dhl-ink font-display font-bold" fontSize="28">
            {value != null ? value : "—"}{suffix}
          </text>
          <text x="100" y="105" textAnchor="middle" className="fill-dhl-muted" fontSize="11">
            {label}
          </text>
          {/* scale labels */}
          <text x="20" y="115" textAnchor="middle" className="fill-dhl-muted" fontSize="9">0</text>
          <text x="180" y="115" textAnchor="middle" className="fill-dhl-muted" fontSize="9">100</text>
        </svg>
      </div>
      <div className="text-[11px] italic text-dhl-muted text-center mt-2">All Modes of Transport</div>
    </div>
  );
};

/* ───────────────────── KPI card (Total / Measurable / %) ───────────────────── */
const KpiCard = ({ label, value }) => (
  <div className="bg-white border border-dhl-border rounded-sm p-4 flex flex-col justify-between min-h-[88px]" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
    <div className="text-xs text-dhl-muted">{label}</div>
    <div className="text-3xl font-display font-bold text-dhl-yellow-dark tabular-nums">
      {value == null ? "—" : value.toLocaleString()}
    </div>
  </div>
);

/* ───────────────────── Empty chart card ───────────────────── */
const ChartCard = ({ title, height = "h-64", children }) => (
  <div className="bg-white border border-dhl-border rounded-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-dhl-ink">{title}</h3>
      <Maximize2 className="w-3.5 h-3.5 text-dhl-muted" />
    </div>
    <div className={`${height} flex items-center justify-center text-sm text-dhl-muted italic`}>
      {children || "No data yet"}
    </div>
  </div>
);

/* ───────────────────── Filter button (left rail) ───────────────────── */
const FilterBtn = ({ label, active = false }) => (
  <button
    type="button"
    className={
      "w-full text-left text-xs font-semibold py-2.5 px-3 border rounded-sm transition-colors " +
      (active
        ? "border-dhl-yellow bg-dhl-yellow/10 text-dhl-ink"
        : "border-dhl-border bg-white text-dhl-ink hover:bg-dhl-panel")
    }
  >
    {label}
    {active && <span className="block h-0.5 bg-dhl-yellow mt-1" />}
  </button>
);

const Dashboard = () => {
  useTitle("On-Time Performance (OTP) — myDHLi");
  const [activeFilter, setActiveFilter] = useState("Tradelane Base");

  // All values are intentionally null while seed data is offline. Logbook
  // integration will populate these via existing /api/reports endpoints.
  const data = {
    grossOtp: null,
    netOtp: null,
    totalShipments: null,
    measurableShipments: null,
    measurablePercent: null,
  };

  return (
    <>
      <PageBanner title="On-Time Performance (OTP)" icon={Timer} data-testid="dashboard-page-banner" />

      {/* Filter chips row — visual only */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-dhl-border rounded-sm bg-white text-xs text-dhl-ink hover:bg-dhl-panel">
          <Search className="w-3.5 h-3.5" /> Search
        </button>
        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-dhl-border rounded-sm bg-white text-xs text-dhl-ink hover:bg-dhl-panel">
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
        <div className="w-px h-5 bg-dhl-border" />
        <div className="text-[11px] uppercase tracking-wider text-dhl-muted border-b-2 border-dhl-yellow pb-1 font-semibold inline-flex flex-col">
          <span className="text-dhl-ink">ORG/DEST filters</span>
          <span className="text-[10px] text-dhl-muted normal-case font-normal">Origin · Destination</span>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-dhl-muted pb-1 font-semibold inline-flex flex-col">
          <span className="text-dhl-ink inline-flex items-center gap-1"><Globe className="w-3 h-3" /> Languages</span>
          <span className="text-[10px] text-dhl-muted normal-case font-normal">en</span>
        </div>
      </div>

      {/* Body — left rail (Bookmarks + Filters) + right content grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* ─── Left rail (240px equivalent) ─── */}
        <aside className="col-span-12 lg:col-span-3 xl:col-span-2 space-y-5">
          <div>
            <h2 className="font-display font-bold text-lg text-dhl-ink mb-2">Bookmarks</h2>
            <button type="button" className="inline-flex items-center justify-between w-full text-sm text-dhl-ink border border-dhl-border bg-white rounded-sm px-3 py-2 hover:bg-dhl-panel">
              <span className="inline-flex items-center gap-2"><Bookmark className="w-3.5 h-3.5 text-dhl-muted" /> Bookmarks</span>
              <ChevronDown className="w-3.5 h-3.5 text-dhl-muted" />
            </button>
          </div>

          <div>
            <h2 className="font-display font-bold text-lg text-dhl-ink mb-3">Filters</h2>
            <div className="space-y-2">
              {[
                "Shipment Status",
                "Bill To - Division",
                "Bill To - Account",
                "Bill To - Region",
                "Bill To - Country / Region",
                "Month",
                "Mode of Transport",
                "Tradelane Base",
                "Tradelane Selection",
                "Shipper / Consignee",
              ].map((f) => (
                <FilterBtn key={f} label={f} active={f === activeFilter} />
              ))}
            </div>
          </div>
        </aside>

        {/* ─── Right content (KPI row + charts) ─── */}
        <div className="col-span-12 lg:col-span-9 xl:col-span-10 space-y-5">
          {/* Top row: Gross OTP | Net OTP | KPIs | Lanes by Nb of Shipments */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <GaugeCard label="Gross OTP" value={data.grossOtp} />
            <GaugeCard label="Net OTP" value={data.netOtp} />
            <div className="space-y-3">
              <KpiCard label="Total Shipments" value={data.totalShipments} />
              <KpiCard label="Measurable Shipments" value={data.measurableShipments} />
              <KpiCard label="% of Measurable Shipments" value={data.measurablePercent} />
            </div>
            <ChartCard title="Lanes by Nb of Shipments" height="h-72" />
          </div>

          {/* Bottom row: Monthly/Weekly Trend | Lanes by Volume */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <ChartCard title="Monthly/Weekly Trend" height="h-72" />
            </div>
            <ChartCard title="Lanes by Volume" height="h-72">
              Please select one Mode of Transport
            </ChartCard>
          </div>

          {/* Footer note */}
          <div className="flex items-start justify-between gap-4 text-[11px] text-dhl-muted pt-3 border-t border-dhl-border">
            <p className="flex-1">
              Default Period: data will appear here once shipments are logged. Please note,
              all shipments of the current month are subject to change.
            </p>
            <span className="shrink-0">Last Data Reload: —</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
