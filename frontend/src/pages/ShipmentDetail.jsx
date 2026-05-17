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
      {!loading && shipment && <DocumentsSection shipmentRef={awb} />}
    </div>
  );
};

export default ShipmentDetail;
