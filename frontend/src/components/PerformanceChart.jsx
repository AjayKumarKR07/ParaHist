// PerformanceChart.jsx — Execution time vs threads (bar + line)
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem', boxShadow: 'var(--shadow)' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Threads: <strong style={{ color: 'var(--text-primary)' }}>{label}</strong></div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(3) : p.value} ms</strong>
        </div>
      ))}
    </div>
  );
};

export default function PerformanceChart({ data = [] }) {
  const chartData = data.map(d => ({
    threads: d.threads,
    'Avg Time': +d.avgParallelMs.toFixed(3),
    'Min Time': +d.minParallelMs.toFixed(3),
    'Max Time': +d.maxParallelMs.toFixed(3),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="threads" stroke="var(--text-muted)" tick={{ fontSize: 12 }}
          label={{ value: 'Threads', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 12 }} />
        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }}
          label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem' }} />
        <Bar dataKey="Avg Time" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
        <Line type="monotone" dataKey="Min Time" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e' }} />
        <Line type="monotone" dataKey="Max Time" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} strokeDasharray="4 2" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
