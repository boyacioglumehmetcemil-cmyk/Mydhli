/**
 * BrandClaim — official DHL brand claim "Excellence. Simply delivered."
 *
 * Brand guide rules:
 *  - Always sentence case (NOT all caps)
 *  - DHL Red (#D40511)
 *  - Bold weight
 *  - Used in: landing footer (above legal line), login screen subtle hint,
 *    PDF footers (right corner).
 *
 *  variant — 'subtle' | 'normal' | 'prominent'
 *  align   — 'left' | 'center' | 'right'  (default left)
 */
const BrandClaim = ({ variant = "normal", align = "left", className = "" }) => {
  const sizing = {
    subtle:    "text-[12px] tracking-tight",
    normal:    "text-[14px] tracking-tight",
    prominent: "text-base sm:text-lg tracking-tight",
  }[variant];

  const alignment = {
    left:   "text-left",
    center: "text-center",
    right:  "text-right",
  }[align];

  return (
    <p
      data-testid="brand-claim"
      className={`font-display font-bold text-dhl-red leading-snug ${sizing} ${alignment} ${className}`}
    >
      Excellence. Simply delivered.
    </p>
  );
};

export default BrandClaim;
