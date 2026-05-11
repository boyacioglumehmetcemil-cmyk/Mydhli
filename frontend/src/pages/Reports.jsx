import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { formatPGK, SERVICE_LABELS } from "@/lib/shipmentUtils";

const COLORS = ["#FFCC00", "#D40511", "#1A1A1A", "#666666", "#FFE066"];
const BACKEND = process.env.REACT_APP_BACKEND_URL;

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/overview").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-dhl-yellow mx-auto" /></div>;
  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto" data-testid="reports-page">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter">Reports</h1>
          <p className="text-sm text-dhl-muted mt-2">Your account analytics across spend, services, and destinations.</p>
        </div>
        <a href={`${BACKEND}/api/reports/pdf`} target="_blank" rel="noreferrer" data-testid="reports-pdf" className="inline-flex items-center justify-center h-11 bg-dhl-ink text-white hover:bg-dhl-red font-bold uppercase tracking-wider text-xs px-5">
          <Download className="mr-2 w-4 h-4" /> Export PDF Report
        </a>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Monthly Spend */}
        <ChartCard title="Monthly Spend" subtitle="Last 6 months · PGK">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatPGK(v)} />
              <Bar dataKey="totalPGK" fill="#FFCC00" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* By Service */}
        <ChartCard title="Shipments by Service" subtitle="Distribution across DHL service tiers">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.shipmentsByService.map(s => ({ ...s, name: SERVICE_LABELS[s.service] || s.service }))} dataKey="count" nameKey="name" outerRadius={90} innerRadius={50}>
                {data.shipmentsByService.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* By Status */}
        <ChartCard title="Shipments by Status" subtitle="Current pipeline">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.shipmentsByStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip />
              <Bar dataKey="count" fill="#D40511" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Volume over time */}
        <ChartCard title="Daily Volume" subtitle="Last 30 days">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.volumeOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1A1A1A" strokeWidth={2} dot={{ fill: "#FFCC00", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top destinations table */}
      <div className="mt-5 bg-white border border-dhl-border" data-testid="reports-top-destinations">
        <div className="border-b border-dhl-border px-5 py-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted">Top destinations</div>
          <h3 className="font-display text-lg font-bold text-dhl-text">Where you ship most</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-dhl-panel border-b border-dhl-border">
            <tr>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">City</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Country</th>
              <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Shipments</th>
              <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Spend</th>
            </tr>
          </thead>
          <tbody>
            {data.topDestinations.map(d => (
              <tr key={d.city} className="border-b last:border-b-0 border-dhl-border">
                <td className="px-5 py-3 font-bold">{d.city}</td>
                <td className="px-5 py-3 text-dhl-muted">{d.country}</td>
                <td className="px-5 py-3 text-right font-mono">{d.count}</td>
                <td className="px-5 py-3 text-right font-mono font-bold">{formatPGK(d.totalPGK)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white border border-dhl-border p-5">
    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dhl-muted mb-1">{subtitle}</div>
    <h3 className="font-display text-lg font-bold text-dhl-text mb-4">{title}</h3>
    {children}
  </div>
);

export default Reports;
