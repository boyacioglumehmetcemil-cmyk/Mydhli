import { Check, MapPin, Clock, AlertTriangle, Package } from "lucide-react";
import { formatDateTime } from "@/lib/shipmentUtils";

const codeIcon = (code) => {
  switch (code) {
    case "OK":
      return Check;
    case "HP":
    case "MS":
      return AlertTriangle;
    case "WC":
      return Package;
    default:
      return MapPin;
  }
};

/**
 * Vertical milestone timeline. Most recent event at TOP.
 * Latest event is highlighted yellow; past events are filled green; older are gray-dot.
 */
const MilestoneTimeline = ({ events = [], status }) => {
  if (!events.length) {
    return (
      <div className="text-center py-12 text-dhl-muted">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
        No tracking events yet.
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );
  const isException = status === "ON_HOLD" || status === "EXCEPTION";

  return (
    <ol
      data-testid="milestone-timeline"
      className="relative space-y-0"
    >
      {sorted.map((ev, idx) => {
        const isLatest = idx === 0;
        const Icon = codeIcon(ev.code);

        const dotColor = isLatest
          ? isException
            ? "bg-dhl-red ring-dhl-red/30"
            : "bg-dhl-yellow ring-dhl-yellow/40"
          : ev.code === "OK"
            ? "bg-green-600 ring-green-600/20"
            : "bg-dhl-ink ring-dhl-ink/10";

        return (
          <li key={idx} className="relative pl-10 pb-7 last:pb-0">
            {/* Connecting line */}
            {idx < sorted.length - 1 && (
              <span className="absolute left-[15px] top-7 bottom-0 w-px bg-dhl-border" />
            )}

            {/* Dot */}
            <span
              data-testid={`timeline-dot-${idx}`}
              className={`absolute left-0 top-1 w-8 h-8 flex items-center justify-center ring-4 ${dotColor}`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${isLatest && !isException ? "text-dhl-ink" : "text-white"}`}
                strokeWidth={2.5}
              />
            </span>

            <div className={`${isLatest ? "" : "opacity-90"}`}>
              <div className="flex items-baseline gap-3 flex-wrap mb-1">
                <span className="font-display text-base font-bold text-dhl-text">
                  {ev.description}
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 bg-dhl-panel border border-dhl-border text-dhl-muted">
                  {ev.code}
                </span>
                {isLatest && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dhl-red">
                    Latest
                  </span>
                )}
              </div>
              <div className="text-xs text-dhl-muted flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(ev.timestamp)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {ev.location}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default MilestoneTimeline;
