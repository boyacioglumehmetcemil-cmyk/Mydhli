import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Filter, X, ChevronLeft, ChevronRight,
  PackageOpen, Loader2, ArrowRight, Plane, Ship, Truck,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, formatDate } from "@/lib/shipmentUtils";
import api from "@/lib/api";
import { toast } from "sonner";
import { useCountry } from "@/contexts/CountryContext";

const PAGE_SIZE = 20;

const MODE_FILTERS = [
  { key: "ALL",   label: "All modes",  Icon: null },
  { key: "AIR",   label: "Air",        Icon: Plane },
  { key: "OCEAN", label: "Ocean",      Icon: Ship },
  { key: "ROAD",  label: "Road",       Icon: Truck },
];

const MODE_ICON = { AIR: Plane, OCEAN: Ship, ROAD: Truck };
const MODE_ACCENT = {
  AIR:   "bg-dhl-yellow text-dhl-ink",
  OCEAN: "bg-dhl-red text-white",
  ROAD:  "bg-dhl-ink text-dhl-yellow",
};

const Shipments = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(params.get("search") || "");
  const [search, setSearch] = useState(params.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(params.get("status") || "ALL");
  const [modeFilter, setModeFilter] = useState(params.get("mode") || "ALL");
  const [dateFrom, setDateFrom] = useState(params.get("from") || "");
  const [dateTo, setDateTo] = useState(params.get("to") || "");
  const { formatCurrency } = useCountry();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = { page, pageSize: PAGE_SIZE };
      if (search) query.search = search;
      if (statusFilter !== "ALL") query.status = statusFilter;
      if (modeFilter !== "ALL") query.mode = modeFilter;
      if (dateFrom) query.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        query.dateTo = d.toISOString();
      }
      const res = await api.get("/bookings", { params: query });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error("Unable to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, modeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchItems();
    const next = {};
    if (search) next.search = search;
    if (statusFilter !== "ALL") next.status = statusFilter;
    if (modeFilter !== "ALL") next.mode = modeFilter;
    if (dateFrom) next.from = dateFrom;
    if (dateTo) next.to = dateTo;
    if (page !== 1) next.page = String(page);
    setParams(next, { replace: true });
  }, [fetchItems, search, statusFilter, modeFilter, dateFrom, dateTo, page, setParams]);

  const onSearchSubmit = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };
  const resetFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter("ALL");
    setModeFilter("ALL"); setDateFrom(""); setDateTo(""); setPage(1);
  };
  const hasActiveFilters = search || statusFilter !== "ALL" || modeFilter !== "ALL" || dateFrom || dateTo;

  return (
    <div className="max-w-7xl mx-auto" data-testid="shipments-page">
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-dhl-red mb-2">myDHLi</div>
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-dhl-text leading-tight tracking-tight">
          My bookings
        </h1>
        <p className="text-sm text-dhl-muted mt-2">
          Search, filter and open any booking for a full chain-of-custody timeline.
        </p>
      </div>

      {/* Mode filter chips */}
      <div className="flex flex-wrap gap-2 mb-4" data-testid="shipments-mode-chips">
        {MODE_FILTERS.map(m => {
          const active = modeFilter === m.key;
          return (
            <button
              key={m.key}
              type="button"
              data-testid={`mode-chip-${m.key.toLowerCase()}`}
              onClick={() => { setModeFilter(m.key); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 h-9 text-xs font-bold rounded-full border-2 transition-colors ${
                active ? "bg-dhl-yellow text-dhl-ink border-dhl-ink" : "bg-white text-dhl-muted border-dhl-border hover:border-dhl-ink"
              }`}
            >
              {m.Icon && <m.Icon className="w-3.5 h-3.5" />}
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-dhl-border rounded-lg p-4 lg:p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <form onSubmit={onSearchSubmit} className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dhl-muted pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              data-testid="shipments-search-input"
              placeholder="AWB, HAWB, HBL, container, booking ref"
              className="pl-9 h-11 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-md"
            />
          </form>

          <div className="md:col-span-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger data-testid="shipments-status-filter"
                className="h-11 bg-dhl-panel border-2 border-dhl-border focus:border-dhl-yellow focus:ring-0 rounded-md">
                <Filter className="w-4 h-4 mr-2 text-dhl-muted" />
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-dhl-border rounded-md">
                <SelectItem value="ALL">All statuses</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Input type="date" value={dateFrom} data-testid="shipments-date-from"
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-11 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-md" />
          </div>
          <div className="md:col-span-2">
            <Input type="date" value={dateTo} data-testid="shipments-date-to"
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-11 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-md" />
          </div>

          <div className="md:col-span-1 flex items-center">
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} data-testid="shipments-reset-filters"
                className="text-xs font-bold uppercase tracking-wider text-dhl-red hover:underline whitespace-nowrap flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-dhl-muted">
          <span data-testid="shipments-count">
            <span className="font-bold text-dhl-text">{total}</span> booking{total === 1 ? "" : "s"}
            {hasActiveFilters && " matching your filters"}
          </span>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white border border-dhl-border rounded-lg">
        {loading ? (
          <div className="py-24 text-center" data-testid="shipments-loading">
            <Loader2 className="w-8 h-8 text-dhl-yellow mx-auto mb-3 animate-spin" />
            <p className="text-sm text-dhl-muted">Loading bookings…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 px-6 text-center" data-testid="shipments-empty">
            <div className="w-20 h-20 mx-auto mb-5 border-2 border-dashed border-dhl-border flex items-center justify-center rounded-lg">
              <PackageOpen className="w-10 h-10 text-dhl-muted" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-xl font-bold text-dhl-text mb-2">No bookings match your filters</h3>
            <p className="text-sm text-dhl-muted mb-5">Try clearing filters or adjusting your search.</p>
            {hasActiveFilters && (
              <Button data-testid="shipments-empty-reset" onClick={resetFilters}
                className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold rounded-md text-xs px-6 border-2 border-dhl-ink">
                Reset filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto" data-testid="shipments-table">
              <table className="w-full text-sm">
                <thead className="bg-dhl-panel border-b border-dhl-border">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Booking ref</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Mode</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Receiver</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Route</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Status</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">ETD</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">ETA</th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Cost</th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => {
                    const Icon = MODE_ICON[s.mode] || Plane;
                    return (
                      <tr key={s.awb} data-testid={`shipment-row-${s.awb}`}
                        onClick={() => navigate(`/dashboard/shipments/${s.awb}`)}
                        className="border-b border-dhl-border last:border-b-0 cursor-pointer hover:bg-dhl-yellow/10 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-dhl-text text-[13px]">{s.bookingReference || s.awb}</div>
                          {s.bookingReference && <div className="font-mono text-[10px] text-dhl-muted">{s.awb}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <span data-testid={`row-mode-${s.mode || "AIR"}`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${MODE_ACCENT[s.mode] || MODE_ACCENT.AIR}`}>
                            <Icon className="w-3 h-3" />
                            {s.mode || "AIR"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-dhl-text">{s.receiverName}</div>
                          <div className="text-xs text-dhl-muted">{s.receiverCity}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="font-bold text-dhl-text">{s.originPort || s.origin.code}</span>
                            <ArrowRight className="w-3 h-3 text-dhl-red" />
                            <span className="font-bold text-dhl-text">{s.destinationPort || s.destination.code}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={s.status} size="sm" /></td>
                        <td className="px-5 py-4 text-dhl-muted text-xs">{s.etd ? formatDate(s.etd) : "—"}</td>
                        <td className="px-5 py-4 text-dhl-muted text-xs">{s.eta ? formatDate(s.eta) : "—"}</td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-dhl-text">{formatCurrency(s.costPGK)}</td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-xs font-bold uppercase tracking-wider text-dhl-red">View →</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-dhl-border" data-testid="shipments-cards">
              {items.map((s) => {
                const Icon = MODE_ICON[s.mode] || Plane;
                return (
                  <button type="button" key={s.awb} data-testid={`shipment-card-${s.awb}`}
                    onClick={() => navigate(`/dashboard/shipments/${s.awb}`)}
                    className="w-full text-left p-4 hover:bg-dhl-yellow/5 transition-colors">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div>
                        <div className="font-mono font-bold text-dhl-text text-[13px]">{s.bookingReference || s.awb}</div>
                        {s.bookingReference && <div className="font-mono text-[10px] text-dhl-muted">{s.awb}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${MODE_ACCENT[s.mode] || MODE_ACCENT.AIR}`}>
                          <Icon className="w-3 h-3" /> {s.mode || "AIR"}
                        </span>
                        <StatusBadge status={s.status} size="sm" />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-dhl-text mb-1">{s.receiverName}</div>
                    <div className="flex items-center gap-2 text-xs font-mono text-dhl-muted mb-2">
                      <span className="font-bold text-dhl-text">{s.originPort || s.origin.code}</span>
                      <ArrowRight className="w-3 h-3 text-dhl-red" />
                      <span className="font-bold text-dhl-text">{s.destinationPort || s.destination.code}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dhl-muted">ETA {s.eta ? formatDate(s.eta) : "—"}</span>
                      <span className="font-mono font-bold text-dhl-text">{formatCurrency(s.costPGK)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div data-testid="shipments-pagination"
                className="flex items-center justify-between px-5 py-4 border-t border-dhl-border bg-dhl-panel rounded-b-lg">
                <span className="text-xs text-dhl-muted">
                  Page <span className="font-bold text-dhl-text">{page}</span> of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" data-testid="shipments-page-prev"
                    onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 h-9 border border-dhl-border bg-white text-xs font-bold uppercase tracking-wider text-dhl-text hover:border-dhl-ink disabled:opacity-40 disabled:cursor-not-allowed rounded-md">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button type="button" data-testid="shipments-page-next"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="inline-flex items-center gap-1 px-3 h-9 border border-dhl-border bg-white text-xs font-bold uppercase tracking-wider text-dhl-text hover:border-dhl-ink disabled:opacity-40 disabled:cursor-not-allowed rounded-md">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Shipments;
