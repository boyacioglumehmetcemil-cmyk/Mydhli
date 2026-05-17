// Tiny inline pill that mirrors the backend `status` enum. Kept in its own file
// so DocumentsSection.jsx stays focused on data orchestration.
import { Loader, CheckCircle, XCircle, FilePenLine } from "lucide-react";

const TONE = {
  DRAFT:    { bg: "bg-stone-200",        fg: "text-dhl-text",   Icon: FilePenLine, label: "Draft" },
  PENDING:  { bg: "bg-dhl-yellow/40",    fg: "text-dhl-ink",    Icon: Loader,      label: "Pending" },
  APPROVED: { bg: "bg-green-100",        fg: "text-green-800",  Icon: CheckCircle, label: "Approved" },
  REJECTED: { bg: "bg-red-100",          fg: "text-dhl-red",    Icon: XCircle,     label: "Rejected" },
};

const DocumentStatusBadge = ({ status, size = "sm" }) => {
  const tone = TONE[status] || TONE.DRAFT;
  const Icon = tone.Icon;
  const px = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span
      data-testid={`doc-status-${(status || "draft").toLowerCase()}`}
      className={`inline-flex items-center gap-1 ${px} font-bold uppercase tracking-wider rounded-md border border-current/20 ${tone.bg} ${tone.fg}`}
    >
      <Icon className="w-3 h-3" />
      {tone.label}
    </span>
  );
};

export default DocumentStatusBadge;
