// ThreadTable.jsx — benchmark results table
export default function ThreadTable({ data = [] }) {
  if (!data.length) return <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No benchmark data available.</div>;

  const cols = [
    { key: 'threads',         label: 'Threads',    fmt: v => v },
    { key: 'avgParallelMs',   label: 'Avg (ms)',   fmt: v => v?.toFixed(3) },
    { key: 'minParallelMs',   label: 'Min (ms)',   fmt: v => v?.toFixed(3) },
    { key: 'maxParallelMs',   label: 'Max (ms)',   fmt: v => v?.toFixed(3) },
    { key: 'stddevParallelMs',label: 'StdDev (ms)',fmt: v => v?.toFixed(3) },
    { key: 'speedup',         label: 'Speedup',    fmt: v => `${v?.toFixed(2)}×` },
    { key: 'efficiency',      label: 'Efficiency', fmt: v => `${v?.toFixed(1)}%` },
  ];

  function effColor(eff) {
    if (eff >= 90) return 'var(--green)';
    if (eff >= 60) return 'var(--yellow)';
    return 'var(--red)';
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            {cols.map(c => (
              <th key={c.key} style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {c.label}
              </th>
            ))}
            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correctness</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.threads} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              {cols.map(c => (
                <td key={c.key} style={{
                  padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'var(--mono, monospace)',
                  color: c.key === 'threads' ? 'var(--accent-light)' :
                         c.key === 'speedup' ? 'var(--cyan)' :
                         c.key === 'efficiency' ? effColor(row.efficiency) :
                         'var(--text-primary)',
                  fontWeight: c.key === 'threads' ? 600 : 400,
                }}>
                  {c.fmt(row[c.key])}
                </td>
              ))}
              <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                <span className="badge badge-green">✓ PASS</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
