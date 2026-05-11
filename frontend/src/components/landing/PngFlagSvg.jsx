// PNG flag — three horizontal stripes: black, red, yellow per modern PNG flag stylization.
// Note: actual PNG flag is divided diagonally — this is a simplified stripe-style icon
// commonly used in compact UI representations.
const PngFlagSvg = ({ className = "w-5 h-3.5", title = "Papua New Guinea" }) => (
  <svg
    viewBox="0 0 20 14"
    role="img"
    aria-label={title}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{title}</title>
    {/* Outer border */}
    <rect x="0.25" y="0.25" width="19.5" height="13.5" fill="#000" stroke="#1A1A1A" strokeWidth="0.4" />
    {/* Diagonal: top-right triangle red, bottom-left black */}
    <polygon points="0,0 20,0 20,14" fill="#D40511" />
    <polygon points="0,0 0,14 20,14" fill="#000" />
    {/* Bird-of-paradise stylization (simplified yellow shape on red side) */}
    <path
      d="M14 2.3 L15.4 3.2 L15.8 4.7 L14.7 5.4 L14.2 6.6 L13.5 5.3 L12.8 6.2 L13.1 4.5 L12.4 3.6 Z"
      fill="#FFCC00"
    />
    {/* Southern Cross stars on black side */}
    {[
      [3, 4.5],
      [5.5, 7],
      [4, 9.5],
      [6.7, 11],
      [2.5, 11],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="0.45" fill="#fff" />
    ))}
  </svg>
);

export default PngFlagSvg;
