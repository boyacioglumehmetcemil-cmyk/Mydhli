import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

/**
 * Tiny inline sparkline for KPI cards.
 * Pass data as array of {v: number} or numbers (auto-converted).
 */
const MiniSparkline = ({ data = [], color = "#FFCC00", height = 28 }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ height }} className="text-[10px] text-dhl-muted/70">—</div>;
  }
  const formatted = data.map((d, i) => (typeof d === "number" ? { i, v: d } : { i, v: d.v ?? 0 }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniSparkline;
