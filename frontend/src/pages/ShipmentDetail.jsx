import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, PackageX, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import TrackingDetail from "@/components/TrackingDetail";
import DocumentsSection from "@/components/documents/DocumentsSection";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const ShipmentDetail = () => {
  const { awb } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    api
      .get(`/shipments/${encodeURIComponent(awb)}`)
      .then((res) => {
        if (mounted) setShipment(res.data);
      })
      .catch((err) => {
        if (mounted) {
          if (err?.response?.status === 404) setNotFound(true);
          else toast.error("Unable to load shipment");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [awb]);

  return (
    <div className="max-w-7xl mx-auto" data-testid="shipment-detail-page">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-xs text-dhl-muted">
        <Link
          to="/dashboard/shipments"
          data-testid="breadcrumb-shipments"
          className="font-bold uppercase tracking-wider hover:text-dhl-red"
        >
          My Shipments
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-mono font-bold text-dhl-text">{awb}</span>
      </div>

      <button
        type="button"
        onClick={() => navigate("/dashboard/shipments")}
        data-testid="shipment-back-link"
        className="inline-flex items-center gap-2 text-sm font-bold text-dhl-text hover:text-dhl-red mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to shipments
      </button>

      {loading && (
        <div className="text-center py-24" data-testid="shipment-detail-loading">
          <Loader2 className="w-10 h-10 text-dhl-yellow mx-auto mb-4 animate-spin" />
          <p className="text-sm text-dhl-muted font-medium">Loading shipment…</p>
        </div>
      )}

      {!loading && notFound && (
        <div
          data-testid="shipment-detail-notfound"
          className="bg-white border border-dhl-border max-w-2xl mx-auto px-6 py-20 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-dhl-border flex items-center justify-center">
            <PackageX className="w-10 h-10 text-dhl-muted" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-2xl font-black text-dhl-text mb-3">
            Shipment not found
          </h2>
          <p className="text-sm text-dhl-muted max-w-md mx-auto mb-6">
            We couldn't find AWB <span className="font-mono font-bold text-dhl-text">{awb}</span>{" "}
            in your account.
          </p>
          <Button
            onClick={() => navigate("/dashboard/shipments")}
            className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold rounded-none uppercase tracking-wider text-xs px-6 border-2 border-dhl-ink"
          >
            Back to My Shipments
          </Button>
        </div>
      )}

      {!loading && shipment && <TrackingDetail shipment={shipment} mode="auth" />}
      {!loading && shipment?.oceanSpecifics?.buyerPickupDeadline && shipment.status === "AT_DEPOT" && (
        <BuyerPickupBanner shipment={shipment} />
      )}
      {!loading && shipment && <DocumentsSection shipmentRef={awb} />}
    </div>
  );
};

// ── Buyer pickup deadline alert ────────────────────────────────────────────
// Surfaces the 5-business-day collection rule for AT_DEPOT shipments. Reads
// pre-computed values populated by /app/backend (see depot-deadline migrator).
const BuyerPickupBanner = ({ shipment }) => {
  const spec = shipment.oceanSpecifics || {};
  const overdue = spec.pickupOverdue;
  const daysAbs = Math.abs(spec.pickupDaysRemaining ?? 0);
  const deadline = spec.buyerPickupDeadline ? new Date(spec.buyerPickupDeadline) : null;
  const since = spec.atDepotSince ? new Date(spec.atDepotSince) : null;
  const fmt = (d) => d ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" }) : "—";

  return (
    <section
      data-testid="buyer-pickup-banner"
      className={`mt-6 rounded-lg border-2 ${
        overdue ? "border-dhl-red bg-red-50" : "border-amber-500 bg-amber-50"
      } px-5 py-4`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
              overdue ? "bg-dhl-red text-white" : "bg-amber-500 text-amber-950"
            }`}>
              {overdue ? "Pickup overdue" : "Awaiting buyer collection"}
            </span>
            <span className="text-[11px] text-dhl-muted">Final depot operational rule · +5 business days</span>
          </div>
          <p className="text-sm text-dhl-text">
            Cargo at <span className="font-bold">{spec.depotStatus?.location || shipment.destination?.city}</span> since{" "}
            <span className="font-mono font-bold">{fmt(since)}</span>. Buyer pickup window closed{" "}
            <span className="font-mono font-bold">{fmt(deadline)}</span>.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className={`font-display text-3xl font-black ${overdue ? "text-dhl-red" : "text-amber-700"}`}>
            {daysAbs.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
            {overdue ? "days overdue" : "days remaining"}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShipmentDetail;
