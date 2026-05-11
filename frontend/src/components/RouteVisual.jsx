import { Plane, Truck, Package, MapPin } from "lucide-react";
import { STATUS_PROGRESS, STATUS_TONES } from "@/lib/shipmentUtils";

/**
 * Horizontal route visualization: Origin -> animated line -> Destination.
 * NO real map — pure SVG/divs.
 */
const RouteVisual = ({ origin, destination, status }) => {
  const progress = STATUS_PROGRESS[status] ?? 0;
  const tone = STATUS_TONES[status] || STATUS_TONES.PENDING;

  // Icon depends on phase
  const VehicleIcon =
    status === "OUT_FOR_DELIVERY" ? Truck : status === "DELIVERED" ? Package : Plane;

  return (
    <div
      data-testid="route-visual"
      className="bg-white border border-dhl-border p-6 lg:p-8"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted">
          Route
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted">
          {progress}% complete
        </div>
      </div>

      <div className="relative pt-12 pb-2">
        {/* Track line */}
        <div className="absolute left-0 right-0 top-[60%] h-px bg-dhl-border" />

        {/* Filled portion */}
        <div
          className={`absolute left-0 top-[60%] h-px ${tone.banner} transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />

        {/* Vehicle icon on progress */}
        <div
          className="absolute top-[calc(60%-18px)] -translate-x-1/2 transition-all duration-700"
          style={{ left: `${progress}%` }}
        >
          <div className={`w-9 h-9 ${tone.banner} ${tone.bannerText} flex items-center justify-center border-2 border-dhl-ink`}>
            <VehicleIcon className="w-4 h-4" strokeWidth={2.5} />
          </div>
        </div>

        {/* Origin marker */}
        <div className="absolute left-0 top-[60%] -translate-y-1/2">
          <div className="w-3 h-3 rounded-full bg-dhl-ink ring-4 ring-dhl-ink/10" />
        </div>

        {/* Destination marker */}
        <div className="absolute right-0 top-[60%] -translate-y-1/2">
          <div
            className={`w-4 h-4 ${
              status === "DELIVERED" ? "bg-green-600" : "bg-dhl-yellow border-2 border-dhl-ink"
            }`}
          />
        </div>

        {/* Mid stroke ticks */}
        <div className="absolute left-1/3 top-[calc(60%-3px)] h-1.5 w-px bg-dhl-border" />
        <div className="absolute left-2/3 top-[calc(60%-3px)] h-1.5 w-px bg-dhl-border" />
      </div>

      {/* City labels */}
      <div className="flex items-start justify-between mt-2">
        <div className="text-left">
          <div className="font-display text-2xl lg:text-3xl font-black text-dhl-ink leading-none">
            {origin.code}
          </div>
          <div className="text-xs text-dhl-muted mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {origin.city}, {origin.country}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl lg:text-3xl font-black text-dhl-ink leading-none">
            {destination.code}
          </div>
          <div className="text-xs text-dhl-muted mt-1 flex items-center justify-end gap-1">
            <MapPin className="w-3 h-3" />
            {destination.city}, {destination.country}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteVisual;
