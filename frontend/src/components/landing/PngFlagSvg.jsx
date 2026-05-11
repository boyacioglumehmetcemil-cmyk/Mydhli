// PNG-themed flag glyph — stylised horizontal split (red top / black bottom)
// with a small yellow bird-of-paradise silhouette in the upper hoist corner.
// (The real PNG flag is a diagonal split; we use this simplified horizontal
// motif because it reads crisper at 24×16 inline UI scale.)
const PngFlagSvg = ({ className = "w-6 h-4", title = "Papua New Guinea" }) => (
  <svg
    viewBox="0 0 24 16"
    role="img"
    aria-label={title}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="geometricPrecision"
  >
    <title>{title}</title>
    {/* Outer 1px ink border for definition on yellow bg */}
    <rect x="0.5" y="0.5" width="23" height="15" fill="#D40511" stroke="#1A1A1A" strokeWidth="0.6" />
    {/* Black bottom half */}
    <rect x="0.5" y="8" width="23" height="7.5" fill="#000" />
    {/* Bird-of-paradise silhouette (yellow) in upper hoist corner — simplified plumes */}
    <path
      d="
        M 3.8 5.6
        C 3.3 4.9, 3.5 4.0, 4.4 3.6
        C 5.0 3.3, 5.6 3.6, 6.0 4.1
        L 6.6 3.2
        L 6.4 4.5
        L 7.4 3.8
        L 6.8 5.2
        L 7.7 5.0
        L 6.6 6.0
        L 7.0 7.0
        L 5.6 6.4
        L 4.8 7.2
        L 4.6 6.0
        Z"
      fill="#FFCC00"
    />
    {/* Tiny stars cluster bottom-left (Southern Cross reference) */}
    {[
      [3.2, 10.6],
      [5.0, 12.4],
      [3.8, 13.6],
      [6.4, 13.4],
      [2.6, 13.0],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="0.35" fill="#fff" />
    ))}
  </svg>
);

export default PngFlagSvg;
