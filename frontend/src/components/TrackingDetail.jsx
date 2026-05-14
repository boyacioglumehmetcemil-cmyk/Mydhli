import { Package, Truck, FileText, Calendar, User, Building2, MapPin, Phone, Mail } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import RouteVisual from "@/components/RouteVisual";
import MilestoneTimeline from "@/components/MilestoneTimeline";
import ShipmentDocuments from "@/components/ShipmentDocuments";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  STATUS_LABELS,
  STATUS_TONES,
  SERVICE_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/shipmentUtils";
import { useCountry } from "@/contexts/CountryContext";
import { toast } from "sonner";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="w-3.5 h-3.5 text-dhl-muted mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
        {label}
      </div>
      <div className="text-sm text-dhl-text font-medium truncate">{value || "—"}</div>
    </div>
  </div>
);

/**
 * The shared shipment detail UI. Used on both public /track/:awb and auth /dashboard/shipments/:awb.
 *
 * Props:
 * - shipment: shipment object (full or public)
 * - mode: "public" | "auth"
 */
const TrackingDetail = ({ shipment, mode = "public" }) => {
  const { formatCurrency } = useCountry();
  if (!shipment) return null;

  const tone = STATUS_TONES[shipment.status] || STATUS_TONES.PENDING;
  const isAuth = mode === "auth";
  const comingSoon = (label) =>
    toast.info(`${label} — Available in Phase 3`, {
      description: "We're wiring this up next.",
    });

  return (
    <div data-testid="tracking-detail" className="space-y-6">
      {/* Status banner */}
      <div
        data-testid="status-banner"
        className={`relative ${tone.banner} ${tone.bannerText} px-6 py-6 lg:py-8 overflow-hidden`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-80">
              Shipment Status
            </div>
            <div className="font-display text-3xl lg:text-5xl font-black leading-none mt-1 tracking-tighter">
              {STATUS_LABELS[shipment.status]}
            </div>
            <div className="text-xs font-mono font-bold mt-2 opacity-90 tracking-wider">
              AWB · {shipment.awb}
            </div>
          </div>
          <div className="text-left lg:text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-80">
              {shipment.status === "DELIVERED" ? "Delivered" : "Est. Delivery"}
            </div>
            <div className="font-display text-xl lg:text-2xl font-black mt-1">
              {shipment.status === "DELIVERED" && shipment.actualDelivery
                ? formatDate(shipment.actualDelivery)
                : formatDate(shipment.estimatedDelivery)}
            </div>
          </div>
        </div>
        {/* Decorative corner */}
        <div className={`absolute -right-8 -top-8 w-32 h-32 rotate-12 opacity-10 ${tone.bannerText === "text-white" ? "bg-white" : "bg-dhl-ink"}`} />
      </div>

      {/* Route */}
      <RouteVisual
        origin={shipment.origin}
        destination={shipment.destination}
        status={shipment.status}
      />

      {/* Two columns: timeline + side details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white border border-dhl-border p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted">
                Activity
              </div>
              <h3 className="font-display text-2xl font-black text-dhl-text">
                Milestones
              </h3>
            </div>
            <StatusBadge status={shipment.status} />
          </div>
          <MilestoneTimeline events={shipment.events} status={shipment.status} />
        </div>

        {/* Right side details */}
        <div className="space-y-5">
          {/* Service */}
          <div className="bg-white border border-dhl-border p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted mb-3">
              Service
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-dhl-yellow flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-dhl-ink" strokeWidth={2} />
              </div>
              <div>
                <div className="font-display font-bold text-base text-dhl-text">
                  {SERVICE_LABELS[shipment.service] || shipment.service}
                </div>
                <div className="text-xs text-dhl-muted mt-0.5">
                  ETA {formatDate(shipment.estimatedDelivery)}
                </div>
              </div>
            </div>
          </div>

          {/* Package */}
          <div className="bg-white border border-dhl-border p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted mb-3">
              Package
            </div>
            <div className="space-y-3">
              <InfoRow
                icon={Package}
                label="Pieces"
                value={`${shipment.package.pieces} piece${shipment.package.pieces > 1 ? "s" : ""}`}
              />
              <InfoRow
                icon={FileText}
                label="Weight"
                value={`${shipment.package.weightKg} kg`}
              />
              {isAuth && shipment.package.dimensions && (
                <InfoRow
                  icon={FileText}
                  label="Dimensions (cm)"
                  value={`${shipment.package.dimensions.l} × ${shipment.package.dimensions.w} × ${shipment.package.dimensions.h}`}
                />
              )}
              {isAuth && shipment.package.description && (
                <InfoRow
                  icon={FileText}
                  label="Description"
                  value={shipment.package.description}
                />
              )}
              {isAuth && shipment.package.declaredValueUSD !== undefined && (
                <InfoRow
                  icon={FileText}
                  label="Declared value"
                  value={`USD ${shipment.package.declaredValueUSD.toLocaleString()}`}
                />
              )}
            </div>
          </div>

          {/* Cost (auth only) */}
          {isAuth && shipment.costPGK !== undefined && (
            <div className="bg-dhl-ink text-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-yellow mb-1">
                Cost
              </div>
              <div className="font-display text-3xl font-black">
                {formatCurrency(shipment.costPGK)}
              </div>
              <div className="text-xs text-white/60 mt-1">Including customs & fuel</div>
            </div>
          )}
        </div>
      </div>

      {/* Sender / Receiver */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-dhl-border p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted mb-4">
            Shipper
          </div>
          {isAuth ? (
            <div className="space-y-3">
              <div className="font-display text-lg font-bold text-dhl-text">
                {shipment.sender.name}
              </div>
              <InfoRow icon={Building2} label="Company" value={shipment.sender.company} />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={`${shipment.sender.address}, ${shipment.sender.city}, ${shipment.sender.country} ${shipment.sender.postalCode}`}
              />
              <InfoRow icon={Phone} label="Phone" value={shipment.sender.phone} />
              <InfoRow icon={Mail} label="Email" value={shipment.sender.email} />
            </div>
          ) : (
            <div>
              <div className="font-display text-lg font-bold text-dhl-text">
                {shipment.sender.city}, {shipment.sender.country}
              </div>
              <div className="text-xs text-dhl-muted mt-2 italic">
                Sender details hidden — sign in to view full shipper information.
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-dhl-border p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted mb-4">
            Consignee
          </div>
          {isAuth ? (
            <div className="space-y-3">
              <div className="font-display text-lg font-bold text-dhl-text">
                {shipment.receiver.name}
              </div>
              <InfoRow icon={Building2} label="Company" value={shipment.receiver.company} />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={`${shipment.receiver.address}, ${shipment.receiver.city}, ${shipment.receiver.country} ${shipment.receiver.postalCode}`}
              />
              <InfoRow icon={Phone} label="Phone" value={shipment.receiver.phone} />
              <InfoRow icon={Mail} label="Email" value={shipment.receiver.email} />
            </div>
          ) : (
            <div>
              <div className="font-display text-lg font-bold text-dhl-text">
                {shipment.receiver.city}, {shipment.receiver.country}
              </div>
              <div className="text-xs text-dhl-muted mt-2 italic">
                Recipient details hidden — sign in to view consignee information.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action bar (auth only) */}
      {isAuth && (
        <div className="bg-white border border-dhl-border p-5 flex flex-wrap gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="action-download-label"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("dhl_auth_token");
                      const url = `${process.env.REACT_APP_BACKEND_URL}/api/shipments/${shipment.awb}/label.pdf`;
                      const res = await fetch(url, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      const blob = await res.blob();
                      const obj = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = obj;
                      a.download = `${shipment.awb}_label.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      setTimeout(() => URL.revokeObjectURL(obj), 1000);
                      toast.success("Label downloaded");
                    } catch (e) {
                      toast.error("Could not download label", { description: String(e?.message || e) });
                    }
                  }}
                  className="h-10 bg-dhl-ink text-white hover:bg-dhl-red rounded-none uppercase tracking-wider text-xs font-bold px-5"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Label (PDF)
                </Button>
              </TooltipTrigger>
              <TooltipContent>A6 shipping label with AWB barcode + tracking QR</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="action-schedule-pickup"
                  onClick={() => comingSoon("Schedule Pickup")}
                  variant="outline"
                  className="h-10 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white rounded-none uppercase tracking-wider text-xs font-bold px-5 bg-transparent"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Pickup
                </Button>
              </TooltipTrigger>
              <TooltipContent>Available in Phase 3</TooltipContent>
            </Tooltip>
            <Button
              data-testid="action-get-help"
              onClick={() => toast.info("Support coming soon", { description: "24/7 support module is in the roadmap." })}
              variant="ghost"
              className="h-10 text-dhl-text hover:bg-dhl-panel rounded-none uppercase tracking-wider text-xs font-bold px-5"
            >
              <User className="w-4 h-4 mr-2" />
              Get Help
            </Button>
          </TooltipProvider>
        </div>
      )}

      {/* Shipment Documents (auth only) — 6 auto-populated PDFs */}
      {isAuth && <ShipmentDocuments awb={shipment.awb} />}
    </div>
  );
};

export default TrackingDetail;
