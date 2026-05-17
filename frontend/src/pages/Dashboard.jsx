/**
 * Dashboard — post-login welcome surface for myDHLi (pitch demo).
 *
 * Composition (top → bottom):
 *   1. Service alert band   — dismissable amber strip (in-component state)
 *   2. Page heading
 *   3. "Share your account" info card (dismissable)
 *   4. Action tab bar       — 5 tabs over a dark slate panel
 *   5. Two lists (drafts + in-transit) in the 8-column main column
 *   6. Right sidebar        — My shipments / Track / My pickups / Quick links
 *
 * Data sources are unchanged: we still read `/api/auth/me` via useAuth() and
 * fetch recent shipments via /api/shipments. KPI endpoints are NOT removed
 * — they remain available to other pages (Reports, Invoices, etc.).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarClock,
  Calculator,
  ChevronRight,
  History,
  Inbox,
  Star,
  Truck,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { COUNTRIES, flagFor } from "@/data/countries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import useTitle from "@/hooks/useTitle";
import api from "@/lib/api";
import { formatDate } from "@/lib/shipmentUtils";

const IN_TRANSIT_STATUSES = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "AT_DEPOT", "DELIVERED"];

/* ─── Section 1: Service alert band ────────────────────────────────────── */
const ServiceAlertBand = () => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      data-testid="dashboard-service-alert"
      className="bg-amber-50 border-y border-amber-200 py-3 px-6"
    >
      <div className="max-w-[1280px] mx-auto flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
        <p className="text-sm text-amber-900 flex-1">
          Service notice — extended transit times reported on selected lanes this week.{" "}
          <Link
            to="/help"
            className="text-sm font-bold text-dhl-red underline underline-offset-4 hover:text-dhl-red-dark"
            data-testid="dashboard-service-alert-learn"
          >
            Learn more
          </Link>
        </p>
        <button
          type="button"
          aria-label="Dismiss service notice"
          data-testid="dashboard-service-alert-close"
          onClick={() => setDismissed(true)}
          className="text-amber-700 hover:text-amber-900 p-1 rounded-md hover:bg-amber-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ─── Section 3: "Share your account" card ────────────────────────────── */
const ShareAccountCard = () => {
  const [hidden, setHidden] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  if (hidden) return null;
  return (
    <div
      data-testid="dashboard-account-share-card"
      className="relative bg-stone-100 border border-stone-200 rounded-lg p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 pr-6">
        <UsersRound className="w-5 h-5 text-stone-600 shrink-0 mt-0.5 sm:mt-0" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-dhl-ink">Share your account</div>
          <div className="text-sm text-stone-600">
            Authorize teammates to create bookings, manage rates and view shipments on your behalf.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:gap-5 shrink-0">
        <label className="text-xs text-stone-500 cursor-pointer inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="accent-stone-600 w-3.5 h-3.5"
            data-testid="dashboard-account-share-dontshow"
          />
          Don't show again
        </label>
        <button
          type="button"
          data-testid="dashboard-account-share-grant"
          className="border border-stone-400 text-sm font-bold px-4 h-9 rounded-md hover:bg-white transition"
        >
          Grant access
        </button>
      </div>
      <button
        type="button"
        aria-label="Dismiss share-account card"
        data-testid="dashboard-account-share-close"
        onClick={() => setHidden(true)}
        className="absolute top-2 right-2 p-1 rounded-md text-stone-500 hover:bg-stone-200"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ─── Section 4: Action tab bar ───────────────────────────────────────── */
// Sorted country list memoised once at module scope — feeds the routing
// form's two <select> elements without rebuilding on every keystroke.
const COUNTRY_OPTIONS = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

const TAB_TRIGGER =
  "inline-flex items-center justify-center text-sm font-bold h-12 px-4 shrink-0 " +
  "rounded-t-md rounded-b-none border-b-0 transition-colors whitespace-nowrap " +
  "bg-white text-dhl-ink/80 hover:bg-stone-100 " +
  "data-[state=active]:bg-dhl-yellow data-[state=active]:text-dhl-ink";

const PlaceholderTab = ({ icon: Icon, title, body, ctaLabel, ctaTo, ctaTestId }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-stone-700 inline-flex items-center justify-center">
          <Icon className="w-5 h-5 text-dhl-yellow" />
        </div>
        <div className="font-display text-xl font-bold text-white">{title}</div>
      </div>
      <p className="text-sm text-stone-300 max-w-xl">{body}</p>
      <button
        type="button"
        onClick={() => navigate(ctaTo)}
        data-testid={ctaTestId}
        className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-6 rounded-md transition inline-flex items-center gap-2"
      >
        {ctaLabel} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const RoutingForm = () => {
  const navigate = useNavigate();
  const { country } = useCountry();
  // Origin defaults to the user's selected country; destination is left
  // blank so the picker prompts an explicit choice.
  const [originCountry, setOriginCountry] = useState(country.code);
  const [originAddress, setOriginAddress] = useState("");
  const [destCountry, setDestCountry] = useState("");
  const [destAddress, setDestAddress] = useState("");

  const swap = () => {
    setOriginCountry(destCountry);
    setOriginAddress(destAddress);
    setDestCountry(originCountry);
    setDestAddress(originAddress);
  };

  const goNext = () => {
    // Hand off to the existing ShipNow page. We pass origin/dest via query
    // string so when ShipNow is wired to read them the prefill is one-shot.
    const qs = new URLSearchParams();
    if (originCountry) qs.set("from", originCountry);
    if (destCountry) qs.set("to", destCountry);
    navigate(`/dashboard/ship${qs.toString() ? `?${qs.toString()}` : ""}`);
  };

  const fieldShell =
    "h-11 w-full bg-stone-700 text-white border border-stone-600 rounded-md px-3 text-sm " +
    "placeholder:text-stone-400 focus:border-dhl-yellow focus:ring-2 focus:ring-dhl-yellow/20 outline-none";

  const renderRow = (label, badgeChar, badgeAccent, cVal, setC, aVal, setA, addrTid, ctryTid) => (
    <div className="flex items-start gap-4">
      <div
        className={`w-8 h-8 rounded-full border-2 ${badgeAccent} font-bold text-sm flex items-center justify-center shrink-0 mt-7`}
        aria-hidden="true"
      >
        {badgeChar}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-300 mb-1.5">
            {label === "From" ? "Country / Territory (origin)" : "Country / Territory (destination)"}
          </div>
          <select
            value={cVal}
            onChange={(e) => setC(e.target.value)}
            data-testid={ctryTid}
            className={fieldShell + " appearance-none cursor-pointer"}
          >
            <option value="" className="bg-stone-800 text-stone-300">Select a country…</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code} className="bg-stone-800 text-white">
                {flagFor(c.code)}  {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-300 mb-1.5">
            {label === "From" ? "From (city or postcode)" : "To (city or postcode)"}
          </div>
          <input
            type="text"
            value={aVal}
            onChange={(e) => setA(e.target.value)}
            placeholder={label === "From" ? "Origin city or postcode" : "Destination city or postcode"}
            data-testid={addrTid}
            className={fieldShell}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {renderRow(
        "From",
        "A",
        "border-dhl-yellow text-dhl-yellow",
        originCountry,
        setOriginCountry,
        originAddress,
        setOriginAddress,
        "routing-from-address",
        "routing-from-country"
      )}

      <div className="flex items-center justify-between ml-1">
        <div
          className="w-0.5 border-l-2 border-dotted border-stone-500 h-6 ml-4"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={swap}
          data-testid="routing-swap"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-dhl-yellow border border-dhl-yellow rounded-full px-3 h-7 hover:bg-dhl-yellow hover:text-dhl-ink transition"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          Swap
        </button>
      </div>

      {renderRow(
        "To",
        "B",
        "border-stone-400 text-stone-300",
        destCountry,
        setDestCountry,
        destAddress,
        setDestAddress,
        "routing-to-address",
        "routing-to-country"
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={goNext}
          data-testid="dashboard-routing-next"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-8 rounded-md transition inline-flex items-center gap-2"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ActionTabs = () => (
  <Tabs defaultValue="create" className="w-full">
    <TabsList
      data-testid="dashboard-action-tabs"
      className="w-full h-auto p-0 bg-transparent rounded-none gap-1 flex flex-nowrap overflow-x-auto scrollbar-thin justify-start"
    >
      <TabsTrigger value="create" className={TAB_TRIGGER} data-testid="action-tab-create">
        Create a new shipment
      </TabsTrigger>
      <TabsTrigger value="favorite" className={TAB_TRIGGER} data-testid="action-tab-favorite">
        Reuse a favorite
      </TabsTrigger>
      <TabsTrigger value="past" className={TAB_TRIGGER} data-testid="action-tab-past">
        Reuse a past shipment
      </TabsTrigger>
      <TabsTrigger value="pickup" className={TAB_TRIGGER} data-testid="action-tab-pickup">
        Schedule a pickup
      </TabsTrigger>
      <TabsTrigger value="quote" className={TAB_TRIGGER} data-testid="action-tab-quote">
        Get a quote
      </TabsTrigger>
    </TabsList>

    <div
      data-testid="dashboard-action-panel"
      className="bg-stone-800 text-white rounded-b-md rounded-tr-md p-6 lg:p-8 mt-0"
    >
      <TabsContent value="create" className="mt-0">
        <RoutingForm />
      </TabsContent>
      <TabsContent value="favorite" className="mt-0">
        <PlaceholderTab
          icon={Star}
          title="Reuse a favorite"
          body="Saved shipments and addresses appear here. Save your first shipment to start reusing it."
          ctaLabel="Browse favorites"
          ctaTo="/dashboard/shipments"
          ctaTestId="action-favorite-cta"
        />
      </TabsContent>
      <TabsContent value="past" className="mt-0">
        <PlaceholderTab
          icon={History}
          title="Reuse a past shipment"
          body="Open a recent shipment and clone its origin, destination and service to start a new booking."
          ctaLabel="View shipment history"
          ctaTo="/dashboard/shipments"
          ctaTestId="action-past-cta"
        />
      </TabsContent>
      <TabsContent value="pickup" className="mt-0">
        <PlaceholderTab
          icon={CalendarClock}
          title="Schedule a pickup"
          body="Schedule a pickup for the next pre-carriage leg — confirmation lands in your inbox."
          ctaLabel="Schedule pickup"
          ctaTo="/dashboard/pickup"
          ctaTestId="action-pickup-cta"
        />
      </TabsContent>
      <TabsContent value="quote" className="mt-0">
        <PlaceholderTab
          icon={Calculator}
          title="Get a quote"
          body="Compare air, ocean and road rates across modes before you commit to a booking."
          ctaLabel="Open quote tool"
          ctaTo="/dashboard/quote"
          ctaTestId="action-quote-cta"
        />
      </TabsContent>
    </div>
  </Tabs>
);

/* ─── Section 5: shipments lists in the main column ───────────────────── */
const FolderListCard = ({ folderLabel, testId, children }) => (
  <div className="mb-8">
    <div className="inline-block bg-dhl-yellow text-dhl-ink text-xs font-bold px-3 py-1.5 rounded-t-md">
      {folderLabel}
    </div>
    <div
      data-testid={testId}
      className="bg-white rounded-b-md rounded-tr-md border border-stone-200 p-6"
    >
      {children}
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center text-center py-10">
    <Icon className="w-8 h-8 text-stone-300 mb-3" />
    <p className="text-sm text-stone-500">{text}</p>
  </div>
);

const InTransitRow = ({ shipment, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={`in-transit-row-${shipment.awb}`}
    className="w-full grid grid-cols-12 items-center gap-3 px-3 py-3 -mx-3 rounded-md hover:bg-stone-50 text-left"
  >
    <span className="col-span-2 text-xs font-mono text-stone-500">
      {formatDate(shipment.createdAt)}
    </span>
    <span className="col-span-3 font-mono font-bold text-sm text-dhl-ink truncate">
      {shipment.awb}
    </span>
    <span className="col-span-4 text-sm text-stone-700 truncate">
      <span className="font-mono font-semibold">{shipment.origin.code}</span>
      <span className="mx-2 text-stone-400">→</span>
      <span className="font-mono font-semibold">{shipment.destination.code}</span>
    </span>
    <span className="col-span-3 flex justify-end">
      <StatusBadge status={shipment.status} size="sm" />
    </span>
  </button>
);

/* ─── Section 6: right sidebar cards ──────────────────────────────────── */
const SidebarCard = ({ title, testId, children }) => (
  <div
    data-testid={testId}
    className="bg-white border border-stone-200 rounded-lg p-5"
  >
    <h3 className="text-sm font-bold text-dhl-ink mb-3">{title}</h3>
    {children}
  </div>
);

const TrackSidebarCard = () => {
  const navigate = useNavigate();
  const [refs, setRefs] = useState("");
  const submit = () => {
    const first = refs
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (!first) return;
    navigate(`/track/${encodeURIComponent(first)}`);
  };
  return (
    <SidebarCard title="Track a shipment" testId="dashboard-sidebar-track">
      <Textarea
        value={refs}
        onChange={(e) => setRefs(e.target.value)}
        rows={3}
        placeholder="Paste up to 10 references — one per line or comma-separated."
        data-testid="dashboard-sidebar-track-input"
        className="mb-3 text-sm min-h-[80px] resize-none bg-stone-50 border-stone-300 focus-visible:border-dhl-red focus-visible:ring-2 focus-visible:ring-dhl-red/20"
      />
      <button
        type="button"
        onClick={submit}
        data-testid="dashboard-sidebar-track-submit"
        className="h-10 w-full rounded-md text-sm font-bold bg-dhl-red text-white hover:bg-dhl-red-dark transition"
      >
        Track now
      </button>
    </SidebarCard>
  );
};

/* ─── Page ────────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useTitle("Dashboard");

  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    api
      .get("/shipments", { params: { page: 1, pageSize: 10 } })
      .then((res) => {
        if (!mounted) return;
        setRecent(res.data.items || []);
        setTotalCount(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => mounted && setRecentLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Filter to active / in-transit statuses for Section 5b. The drafts list
  // (5a) has no backing endpoint yet — it shows the empty state and we'll
  // wire it in a follow-up phase.
  // TODO: replace with a real /shipments?status=DRAFT call when the backend
  // surfaces drafts.
  const inTransit = useMemo(
    () => recent.filter((s) => IN_TRANSIT_STATUSES.includes(s.status)).slice(0, 5),
    [recent]
  );

  return (
    <div data-testid="dashboard-page" className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8">
      {/* Service alert — escapes <main>'s padding via negative margins above so
          the band can run full-bleed end to end. */}
      <ServiceAlertBand />

      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 pt-8 pb-12">
        {/* Page heading */}
        <header className="pb-4">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-dhl-ink">
            Welcome to myDHLi{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Quote, book, document and track every leg of your supply chain.
          </p>
        </header>

        {/* Share-account info card */}
        <ShareAccountCard />

        {/* Outer grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main column */}
          <div className="lg:col-span-8 min-w-0">
            <ActionTabs />

            <div className="mt-10">
              <div className="mb-2">
                <h2 className="text-xl font-bold text-dhl-ink">Shipments requiring action</h2>
                <p className="text-sm text-stone-500">
                  Bookings drafted but not yet handed off to DHL Global Forwarding.
                </p>
              </div>
              <FolderListCard folderLabel="My drafts" testId="dashboard-drafts-card">
                <EmptyState icon={Inbox} text="No drafts waiting on you." />
              </FolderListCard>

              <div className="mb-2">
                <h2 className="text-xl font-bold text-dhl-ink">Recent shipments</h2>
                <p className="text-sm text-stone-500">
                  Your latest bookings with DHL Global Forwarding — pre-carriage, on-water, at depot or delivered.
                </p>
              </div>
              <FolderListCard folderLabel="Open shipments" testId="dashboard-intransit-card">
                {recentLoading ? (
                  <div className="py-10 text-center text-sm text-stone-500">Loading shipments…</div>
                ) : inTransit.length === 0 ? (
                  <EmptyState icon={Truck} text="No shipments on file yet." />
                ) : (
                  <div className="divide-y divide-stone-100">
                    {inTransit.map((s) => (
                      <InTransitRow
                        key={s.awb}
                        shipment={s}
                        onClick={() => navigate(`/dashboard/shipments/${s.awb}`)}
                      />
                    ))}
                  </div>
                )}
              </FolderListCard>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
            <SidebarCard title="My shipments" testId="dashboard-sidebar-shipments">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 mb-3">
                Activity from the last 90 days.
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-3xl font-bold text-dhl-ink leading-none">
                    {recentLoading ? "—" : totalCount}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">Total on file</div>
                </div>
                <Link
                  to="/dashboard/shipments"
                  data-testid="dashboard-sidebar-shipments-link"
                  className="text-sm font-bold text-dhl-red hover:text-dhl-red-dark inline-flex items-center gap-1"
                >
                  View all shipments <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </SidebarCard>

            <TrackSidebarCard />

            <SidebarCard title="My pickups" testId="dashboard-sidebar-pickups">
              <div className="divide-y divide-stone-100">
                <div className="py-2">
                  <div className="text-sm font-semibold text-dhl-ink">Upcoming</div>
                  <div className="text-xs text-stone-500">No pickups scheduled.</div>
                </div>
                <div className="py-2">
                  <div className="text-sm font-semibold text-dhl-ink">Previous</div>
                  <div className="text-xs text-stone-500">No prior pickups on file.</div>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Link
                  to="/dashboard/pickups"
                  data-testid="dashboard-sidebar-pickups-link"
                  className="text-xs text-stone-500 hover:text-dhl-ink inline-flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </SidebarCard>

            <SidebarCard title="Quick links" testId="dashboard-sidebar-quicklinks">
              <button
                type="button"
                data-testid="dashboard-sidebar-quicklinks-edit"
                className="border border-stone-300 h-9 w-full text-sm font-bold rounded-md hover:bg-stone-50 transition"
              >
                Add or edit quick links
              </button>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
