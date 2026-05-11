/**
 * Section eyebrow — small uppercase label paired with a 3px yellow accent bar.
 * Used consistently across all landing sections.
 */
const SectionEyebrow = ({ children, theme = "light", testId, className = "" }) => {
  const color = theme === "dark" ? "text-white/70" : "text-dhl-muted";
  return (
    <div
      data-testid={testId}
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <span aria-hidden="true" className="w-3 h-[3px] bg-dhl-yellow" />
      <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${color}`}>
        {children}
      </span>
    </div>
  );
};

export default SectionEyebrow;
