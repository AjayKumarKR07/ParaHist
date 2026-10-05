// StatCard.jsx
export default function StatCard({ label, value, unit = '', sub, color = 'var(--accent-light)', icon }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: '0.5rem' }}>{label}</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {value}
            {unit && <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '0.2rem', color: 'var(--text-secondary)' }}>{unit}</span>}
          </div>
          {sub && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.4rem' }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: '100%', background: `linear-gradient(90deg, ${color}60, transparent)` }} />
    </div>
  );
}
