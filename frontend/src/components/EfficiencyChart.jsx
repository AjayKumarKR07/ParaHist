// EfficiencyChart.jsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem', boxShadow: 'var(--shadow)' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Threads: <strong style={{ color: 'var(--text-primary)' }}>{label}</strong></div>
      <div style={{ color: '#a855f7' }}>Efficiency: <strong>{payload[0]?.value?.toFixed(1)}%</strong></div>
    </div>
  );
};

export default function EfficiencyChart({ data = [] }) {
  const chartData = data.map(d => ({
    threads: d.threads,
    efficiency: +d.efficiency.toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="threads" stroke="var(--text-muted)" tick={{ fontSize: 12 }}
          label={{ value: 'Threads', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 12 }} />
        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} domain={[0, 120]}
          tickFormatter={v => `${v}%`}
          label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={100} stroke="var(--text-muted)" strokeDasharray="4 2" label={{ value: 'Ideal 100%', fill: 'var(--text-muted)', fontSize: 11 }} />
        <Area type="monotone" dataKey="efficiency" stroke="#a855f7" strokeWidth={2.5}
          fill="url(#effGrad)" dot={{ r: 5, fill: '#a855f7' }} activeDot={{ r: 7 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
