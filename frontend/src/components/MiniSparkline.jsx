import { useEffect, useRef, useState } from "react";
import { LineChart, Line, YAxis } from "recharts";

/**
 * Tiny inline sparkline for KPI cards.
 * Measures parent width once mounted, then renders LineChart with concrete
 * pixel dimensions — avoids Recharts ResponsiveContainer width(-1) warnings.
 */
const MiniSparkline = ({ data = [], color = "#FFCC00", height = 28 }) => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setWidth(w);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ height }} className="text-[10px] text-dhl-muted/70">—</div>;
  }
  const formatted = data.map((d, i) => (typeof d === "number" ? { i, v: d } : { i, v: d.v ?? 0 }));

  return (
    <div ref={ref} style={{ height, width: "100%" }}>
      {width > 0 && (
        <LineChart width={width} height={height} data={formatted} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      )}
    </div>
  );
};

export default MiniSparkline;
