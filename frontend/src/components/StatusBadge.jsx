import { STATUS_LABELS, STATUS_TONES } from "@/lib/shipmentUtils";

const StatusBadge = ({ status, size = "md", className = "", "data-testid": testId }) => {
  const tone = STATUS_TONES[status] || STATUS_TONES.PENDING;
  const label = STATUS_LABELS[status] || status;
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };
  return (
    <span
      data-testid={testId || `status-badge-${(status || "").toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider border ${tone.bg} ${tone.text} ${tone.border} ${sizes[size] || sizes.md} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
