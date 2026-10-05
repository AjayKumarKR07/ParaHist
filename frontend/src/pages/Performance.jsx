// Performance.jsx — Parallel Performance & Scalability Analysis
import { useEffect, useState } from 'react';
import {
  Cpu, RefreshCw, Play, CheckCircle, Zap, Activity, Clock,
  Sliders, TrendingUp, Info, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, Legend
} from 'recharts';
import PerformanceChart from '../components/PerformanceChart';
import SpeedupChart from '../components/SpeedupChart';
import EfficiencyChart from '../components/EfficiencyChart';
import ThreadTable from '../components/ThreadTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';

export default function Performance() {
  const [benchmark, setBenchmark] = useState(null);
  const [histogram, setHistogram] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [running, setRunning]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [bm, hist] = await Promise.allSettled([
        api.getBenchmark(),
        api.getHistogram(),
      ]);
      if (bm.status === 'fulfilled')   setBenchmark(bm.value);
      if (hist.status === 'fulfilled') setHistogram(hist.value);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRunBenchmark() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.runBenchmark(16);
      setResult(res);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const summary = benchmark?.summary ?? [];

  // Metrics from latest execution (prefer histogram data)
  const seqMs = histogram?.sequentialMs ?? summary[0]?.avgSequentialMs ?? null;
  const parMs = histogram?.parallelMs   ?? summary[summary.length - 1]?.avgParallelMs ?? null;
  const speedup = histogram?.speedup    ?? (seqMs && parMs ? +(seqMs / parMs).toFixed(2) : null);
  const threads = histogram?.threads    ?? summary[summary.length - 1]?.threads ?? 8;
  const efficiency = histogram?.efficiency ?? (speedup && threads ? +((speedup / threads) * 100).toFixed(1) : null);

  // Data for single-run comparison bar chart
  const comparisonData = seqMs && parMs ? [
    { name: 'Sequential (1T)', time: +seqMs.toFixed(2), fill: '#3b82f6' },
    { name: `Parallel (${threads}T)`, time: +parMs.toFixed(2), fill: '#22c55e' },
  ] : [];

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '2rem 1.5rem 5rem 1.5rem' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div
        id="performance-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Scalability & Efficiency Metrics
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            PERFORMANCE ANALYSIS
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Measure how OpenMP changes execution time as the number of threads increases.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            disabled={loading || running}
            onClick={loadData}
            style={{ padding: '0.65rem 1.1rem' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>

          <button
            className="btn btn-primary"
            disabled={running}
            onClick={handleRunBenchmark}
            style={{ padding: '0.65rem 1.25rem', fontWeight: 600 }}
          >
            {running ? (
              <LoadingSpinner size="sm" text="Benchmarking 1–16 Threads..." />
            ) : (
              <><Play size={15} /> Run Benchmark</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '0.85rem 1.15rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          ⚠ {error}
        </div>
      )}

      {result && (
        <div style={{ color: 'var(--green)', background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: '0.85rem 1.15rem', marginBottom: '1.5rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} /> {result.message}
        </div>
      )}

      {running && (
        <div style={{ color: 'var(--yellow)', background: 'rgba(234,179,8,0.1)', borderRadius: 8, padding: '0.85rem 1.15rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          ⏳ Executing benchmark suite across 1, 2, 4, 8, and 16 threads (5 runs each). Please wait…
        </div>
      )}

      {/* ── 1. LATEST ACTUAL EXECUTION METRICS ───────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Latest Laboratory Execution
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
          gap: '1rem',
        }}>
          {[
            {
              label: 'SEQUENTIAL',
              val: seqMs != null ? `${seqMs.toFixed(2)} ms` : '—',
              sub: 'Single-thread baseline',
              color: '#3b82f6',
              icon: Clock
            },
            {
              label: 'PARALLEL',
              val: parMs != null ? `${parMs.toFixed(2)} ms` : '—',
              sub: `${threads} OpenMP threads`,
              color: '#22c55e',
              icon: Cpu
            },
            {
              label: 'SPEEDUP',
              val: speedup != null ? `${speedup.toFixed(2)}×` : '—',
              sub: 'T_seq / T_par',
              color: 'var(--cyan)',
              icon: Zap
            },
            {
              label: 'EFFICIENCY',
              val: efficiency != null ? `${efficiency.toFixed(1)}%` : '—',
              sub: 'Speedup / Thread Count',
              color: 'var(--purple)',
              icon: Activity
            },
            {
              label: 'THREAD COUNT',
              val: `${threads}`,
              sub: 'OpenMP worker threads',
              color: 'var(--yellow)',
              icon: Sliders
            },
          ].map(({ label, val, sub, color, icon: Icon }) => (
            <div
              key={label}
              className="card"
              style={{
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  {label}
                </span>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1.15, marginBottom: 4 }}>
                {val}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {sub}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. EXECUTION TIME COMPARISON ────────────────────────────────────── */}
      {comparisonData.length > 0 && (
        <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                Direct Comparison
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                EXECUTION TIME COMPARISON
              </h3>
            </div>
            {speedup && (
              <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                {speedup.toFixed(2)}× Faster with OpenMP
              </span>
            )}
          </div>

          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 12 }} label={{ value: 'Execution Time (ms)', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-primary)' }} width={120} />
                <Tooltip
                  formatter={(val) => [`${val} ms`, 'Time']}
                  contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 8, fontSize: '0.82rem', boxShadow: 'var(--shadow)', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="time" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {comparisonData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 3. THREAD SCALABILITY CHARTS ────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
            Multi-Thread Scaling
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            THREAD SCALABILITY
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: 4 }}>
            Empirical measurements across 1, 2, 4, 8, and 16 OpenMP threads from benchmark execution.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
            <LoadingSpinner size="lg" text="Loading benchmark data..." />
          </div>
        ) : (
          <>
            <div id="performance-charts-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div className="section-title"><Cpu size={16} color="var(--accent)" />Execution Time vs Threads</div>
                <PerformanceChart data={summary} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.75rem' }}>
                  Blue bars = average parallel time; Green line = minimum; Red dashed = maximum.
                </p>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <div className="section-title"><Zap size={16} color="var(--cyan)" />Speedup vs Threads</div>
                <SpeedupChart data={summary} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.75rem' }}>
                  Dashed line = theoretical linear scaling; Blue curve = actual measured speedup.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div className="section-title"><Activity size={16} color="var(--purple)" />Parallel Efficiency vs Threads</div>
                <EfficiencyChart data={summary} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.75rem' }}>
                  Efficiency = Speedup / Threads × 100%. Demonstrates CPU utilization efficiency as thread concurrency grows.
                </p>
              </div>
            </div>

            {/* Summary Table */}
            <div id="performance-table-card" className="card" style={{ padding: '1.5rem' }}>
              <div className="section-title"><BarChart2 size={16} color="var(--accent)" />Benchmark Scalability Data (1, 2, 4, 8, 16 Threads)</div>
              <ThreadTable data={summary} />

              {summary.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  📁 Source: results/benchmark_summary.csv &nbsp;·&nbsp;
                  Sequential baseline: {summary[0]?.avgSequentialMs?.toFixed(2)} ms &nbsp;·&nbsp;
                  {summary.length * 5} timed runs ({summary.length} configurations × 5 samples)
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── 4. MATHEMATICAL FORMULAS CARD ───────────────────────────────────── */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Formulation
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          PARALLEL PERFORMANCE METRIC DEFINITIONS
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '1.1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
              SPEEDUP (S)
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              SPEEDUP = Sequential Time / Parallel Time
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              S = T₁ / T_p {seqMs && parMs ? ` = ${seqMs.toFixed(2)} / ${parMs.toFixed(2)} = ${(seqMs / parMs).toFixed(2)}×` : ''}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1.1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--purple)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
              EFFICIENCY (E)
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              EFFICIENCY = Speedup / Thread Count × 100%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              E = (S / p) × 100% {speedup && threads ? ` = (${speedup.toFixed(2)} / ${threads}) × 100% = ${((speedup / threads) * 100).toFixed(1)}%` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. PERFORMANCE INTERPRETATION (SECTION 18) ──────────────────────── */}
      <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
          <Info size={18} color="var(--accent-light)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            PERFORMANCE INTERPRETATION
          </h3>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          Parallel execution distributes histogram work across OpenMP threads. Increasing thread count can reduce execution time, although speedup is limited by CPU resources, memory access, scheduling overhead and other system factors.
        </p>

        <div style={{
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 8,
          padding: '0.85rem 1.15rem',
          fontSize: '0.88rem',
          color: 'var(--text-primary)',
          fontWeight: 600,
        }}>
          Parallel execution must produce the same histogram as sequential execution. Performance improvement does not mean a different result.
        </div>
      </div>

    </div>
  );
}
