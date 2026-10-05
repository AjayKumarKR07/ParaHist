// HistogramChart.jsx
// Renders a 256-bin pixel intensity histogram.
// Modes:
//   'sequential' → blue bars only, from sequential C++ result
//   'parallel'   → green bars only, from parallel OpenMP result
//   'both'       → blue + green bars side by side for direct comparison
//
// When sequential == parallel (which it always should be for a correct
// implementation), the two series will overlap/coincide — that is expected
// and is the visual proof of correctness.
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const dataPoint = payload[0]?.payload;
  const seqVal = dataPoint?.sequential;
  const parVal = dataPoint?.parallel;
  const hasBoth = seqVal !== undefined && parVal !== undefined;

  return (
    <div style={{
      background: 'var(--tooltip-bg)',
      border: '1px solid var(--tooltip-border)',
      borderRadius: 8,
      padding: '0.75rem 1rem',
      fontSize: '0.8rem',
      minWidth: 180,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>
        Pixel: <span style={{ color: 'var(--text-primary)' }}>{label}</span>
      </div>

      {seqVal !== undefined && (
        <div style={{ color: '#3b82f6', marginBottom: 3 }}>
          Sequential: <strong style={{ color: 'var(--text-primary)' }}>{seqVal.toLocaleString()}</strong>
        </div>
      )}

      {parVal !== undefined && (
        <div style={{ color: '#22c55e', marginBottom: 3 }}>
          Parallel: <strong style={{ color: 'var(--text-primary)' }}>{parVal.toLocaleString()}</strong>
        </div>
      )}

      {hasBoth && (
        <div style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid var(--border)',
          fontSize: '0.78rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: seqVal === parVal ? 'var(--green)' : 'var(--red)',
        }}>
          {seqVal === parVal ? '✓ Match' : '✗ Differ'}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function HistogramChart({
  sequential = [],
  parallel   = [],
  showMode   = 'sequential',
}) {
  // Merge both arrays into one charting dataset keyed by pixel value.
  // We always build all 256 entries so the x-axis is complete.
  const base   = sequential.length ? sequential : parallel;
  const data   = base.map((bin, i) => ({
    pixel:      bin.pixel,
    sequential: sequential[i]?.frequency ?? 0,
    parallel:   parallel[i]?.frequency   ?? 0,
  }));

  // Down-sample to every 2nd bin for bar readability (256 → 128 bars).
  // Tooltip still shows the exact pixel value stored in 'pixel' key.
  const chartData = data.filter((_, i) => i % 2 === 0);

  const showSeq = showMode === 'sequential' || showMode === 'both';
  const showPar = showMode === 'parallel'   || showMode === 'both';

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 24, left: 16, bottom: 30 }}
        barCategoryGap={showMode === 'both' ? '15%' : '2%'}
        barGap={1}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

        <XAxis
          dataKey="pixel"
          stroke="var(--text-muted)"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          label={{
            value: 'Pixel Intensity (0–255)',
            position: 'insideBottom',
            offset: -18,
            fill: 'var(--text-muted)',
            fontSize: 12,
          }}
        />

        <YAxis
          stroke="var(--text-muted)"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickFormatter={v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v}
          label={{
            value: 'Frequency',
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            fill: 'var(--text-muted)',
            fontSize: 12,
          }}
        />

        <Tooltip
          content={<CustomTooltip showMode={showMode} />}
          cursor={{ fill: 'rgba(59,130,246,0.07)' }}
        />

        {showMode === 'both' && (
          <Legend
            wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem' }}
            formatter={(value) => (
              <span style={{ color: value === 'sequential' ? '#3b82f6' : '#22c55e' }}>
                {value === 'sequential' ? 'Sequential (C++ single-thread)' : 'Parallel (OpenMP)'}
              </span>
            )}
          />
        )}

        {showSeq && (
          <Bar
            dataKey="sequential"
            name="sequential"
            fill="#3b82f6"
            fillOpacity={showMode === 'both' ? 0.85 : 1}
            radius={[2, 2, 0, 0]}
            maxBarSize={showMode === 'both' ? 6 : 8}
          />
        )}

        {showPar && (
          <Bar
            dataKey="parallel"
            name="parallel"
            fill="#22c55e"
            fillOpacity={showMode === 'both' ? 0.75 : 1}
            radius={[2, 2, 0, 0]}
            maxBarSize={showMode === 'both' ? 6 : 8}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
