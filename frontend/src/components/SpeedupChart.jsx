// SpeedupChart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem', boxShadow: 'var(--shadow)' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Threads: <strong style={{ color: 'var(--text-primary)' }}>{label}</strong></div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}×</strong>
        </div>
      ))}
    </div>
  );
};

export default function SpeedupChart({ data = [] }) {
  // Add ideal linear speedup for comparison
  const chartData = data.map(d => ({
    threads: d.threads,
    'Actual Speedup': +d.speedup.toFixed(2),
    'Ideal (Linear)': d.threads,
  }));

  const maxY = Math.max(...data.map(d => d.threads), ...data.map(d => d.speedup)) + 1;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="threads" stroke="var(--text-muted)" tick={{ fontSize: 12 }}
          label={{ value: 'Threads', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 12 }} />
        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} domain={[0, maxY]}
          label={{ value: 'Speedup (×)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem' }} />
        <Line type="monotone" dataKey="Ideal (Linear)" stroke="var(--text-muted)" strokeDasharray="6 3" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="Actual Speedup" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 7 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
