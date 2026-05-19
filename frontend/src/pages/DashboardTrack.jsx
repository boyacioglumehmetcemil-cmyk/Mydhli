import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, PackageX, RefreshCcw, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TrackingDetail from "@/components/TrackingDetail";
import api from "@/lib/api";
import useTitle from "@/hooks/useTitle";
import PageBanner from "@/components/PageBanner";

// ─────────────────────────────────────────────────────────────────────────────
// /dashboard/track — authenticated tracking surface.
// Keeps users inside the portal chrome (sidebar + header), unlike the public
// /track page which uses the marketing layout. We accept a `?ref=` query
// param so links from the dashboard search bar / notifications work.
// ─────────────────────────────────────────────────────────────────────────────

const DashboardTrack = () => {
  useTitle("Track & Trace · Dashboard");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = params.get("ref") || params.get("awb") || "";

  const [input, setInput] = useState(initial);
  const [activeRef, setActiveRef] = useState(initial);
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeRef) fetchShipment(activeRef);
    else {
      setShipment(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRef]);

  const fetchShipment = async (ref) => {
    setLoading(true);
    setError(null);
    setShipment(null);
    try {
      const res = await api.get(`/track/${encodeURIComponent(ref.trim().toUpperCase())}`);
      setShipment(res.data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setError({ kind: "notfound", ref: ref.trim().toUpperCase() });
      } else {
        setError({ kind: "network" });
        toast.error("Unable to fetch tracking. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const first = input
      .split(/[\s,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (!first) {
      toast.error("Enter a tracking reference");
      return;
    }
    const upper = first.toUpperCase();
    setActiveRef(upper);
    setParams({ ref: upper });
  };

  const clear = () => {
    setInput("");
    setActiveRef("");
    setParams({});
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid="dashboard-track-page">
      <PageBanner
        title="Track & Trace"
        icon={Search}
        data-testid="dashboard-track-banner"
        action={
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/shipments")}
            data-testid="dashboard-track-all-shipments"
            className="h-9 rounded-md border border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white font-bold uppercase tracking-wider text-[11px] px-3"
          >
            <FileSearch className="w-3.5 h-3.5 mr-1.5" /> All bookings
          </Button>
        }
      />

      {/* Search band */}
      <form
        onSubmit={submit}
        data-testid="dashboard-track-form"
        className="bg-white border border-dhl-border p-5 mb-6"
      >
        <label className="block text-xs font-bold uppercase tracking-wider text-dhl-text mb-2">
          Tracking reference
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dhl-muted pointer-events-none" />
            <Input
              data-testid="dashboard-track-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. DHL-SWB-029 · HBL · MBL · AWB · Container · Booking ref"
              className="pl-9 h-12 bg-white border-dhl-border focus-visible:ring-dhl-yellow focus-visible:border-dhl-yellow rounded-sm font-mono text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            data-testid="dashboard-track-submit"
            className="h-12 px-8 bg-dhl-red text-white hover:bg-dhl-red-dark rounded-sm font-bold uppercase tracking-wider text-xs disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
          </Button>
          {activeRef && (
            <Button
              type="button"
              variant="ghost"
              onClick={clear}
              data-testid="dashboard-track-clear"
              className="h-12 px-4 rounded-sm font-bold uppercase tracking-wider text-xs text-dhl-muted hover:text-dhl-ink"
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-[11px] text-dhl-muted mt-3">
          Multiple references? Paste them comma-separated — we'll resolve the
          first one and queue the rest in batch tracking (coming soon).
        </p>
      </form>

      {/* Result panel */}
      {!activeRef && (
        <div
          data-testid="dashboard-track-empty"
          className="bg-white border border-dashed border-dhl-border p-12 text-center"
        >
          <Search className="w-12 h-12 mx-auto text-dhl-muted mb-4" />
          <h3 className="font-display text-xl font-bold text-dhl-text mb-2">
            Start tracking
          </h3>
          <p className="text-sm text-dhl-muted max-w-md mx-auto">
            Enter a booking reference, HBL/MBL number, AWB, or container number
            above to see the full status timeline, milestones and documents.
          </p>
        </div>
      )}

      {loading && (
        <div
          className="bg-white border border-dhl-border p-16 text-center"
          data-testid="dashboard-track-loading"
        >
          <Loader2 className="w-10 h-10 text-dhl-yellow mx-auto mb-4 animate-spin" />
          <p className="text-sm text-dhl-muted font-medium">
            Looking up your shipment…
          </p>
        </div>
      )}

      {!loading && error?.kind === "notfound" && (
        <div
          data-testid="dashboard-track-notfound"
          className="bg-white border border-dhl-border max-w-2xl mx-auto px-6 py-14 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-dhl-border flex items-center justify-center">
            <PackageX className="w-10 h-10 text-dhl-muted" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-2xl font-bold text-dhl-ink mb-3">
            No shipment found
          </h2>
          <p className="text-sm text-dhl-muted max-w-md mx-auto mb-6">
            We couldn't find a shipment for reference{" "}
            <span className="font-mono font-bold text-dhl-ink">{error.ref}</span>.
            Double-check the number — we accept booking refs, HBL/MBL, AWB,
            HAWB/MAWB and container numbers.
          </p>
          <Button
            data-testid="dashboard-track-retry"
            onClick={clear}
            className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold uppercase tracking-wider text-xs px-6 rounded-none border-2 border-dhl-ink"
          >
            Try another reference
          </Button>
        </div>
      )}

      {!loading && error?.kind === "network" && (
        <div
          data-testid="dashboard-track-network-error"
          className="bg-white border border-dhl-red max-w-2xl mx-auto px-6 py-12 text-center"
        >
          <h2 className="font-display text-2xl font-black text-dhl-red mb-3">
            Tracking service unavailable
          </h2>
          <p className="text-sm text-dhl-muted mb-5">
            Something went wrong reaching the tracking service. Please try again
            in a moment.
          </p>
          <Button
            data-testid="dashboard-track-network-retry"
            onClick={() => fetchShipment(activeRef)}
            className="h-11 bg-dhl-ink text-white hover:bg-dhl-red rounded-none uppercase tracking-wider text-xs font-bold px-6"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      )}

      {!loading && shipment && (
        <div data-testid="dashboard-track-result">
          <TrackingDetail shipment={shipment} mode="dashboard" />
        </div>
      )}
    </div>
  );
};

export default DashboardTrack;
