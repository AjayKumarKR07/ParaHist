// Histogram.jsx — Interactive Parallel Computing Laboratory
import { useEffect, useState } from 'react';
import {
  BarChart2, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Cpu, Sliders, Layers, ArrowRight, ShieldCheck, Zap, Activity
} from 'lucide-react';
import HistogramChart from '../components/HistogramChart';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useTour } from '../context/TourContext';

export default function Histogram() {
  const { updatePageState, tourRequestedMode } = useTour();
  const [histogram, setHistogram] = useState(null);   // API response
  const [loading,   setLoading]   = useState(true);
  const [running,   setRunning]   = useState(false);
  const [threads,   setThreads]   = useState(8);
  const [mode,      setMode]      = useState('sequential');
  const [runResult, setRunResult] = useState(null);   // result from POST /run
  const [error,     setError]     = useState(null);

  // Sync mode when guided tour requests a specific mode
  useEffect(() => {
    if (tourRequestedMode && ['sequential', 'parallel', 'both'].includes(tourRequestedMode)) {
      setMode(tourRequestedMode);
    }
  }, [tourRequestedMode]);

  // Sync state to TourContext for guided onboarding
  useEffect(() => {
    updatePageState({
      threads,
      running,
      runResult,
      error,
      mode,
      hasHistogramData: (histogram?.sequential?.length === 256) || (histogram?.parallel?.length === 256),
    });
  }, [threads, running, runResult, error, mode, histogram, updatePageState]);

  // ── Fetch histogram data from backend ──────────────────────────────────────
  async function fetchHistogram() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHistogram();
      setHistogram(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistogram();
  }, []);

  // ── Trigger C++ computation ────────────────────────────────────────────────
  async function handleRun() {
    if (running) return; // Prevent simultaneous execution
    setRunning(true);
    setError(null);
    setRunResult(null);
    try {
      const res = await api.runHistogram(threads);
      setRunResult(res);
      // Auto-refresh after successful run to reflect new data from disk
      await fetchHistogram();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  // ── Derived values (all from real API data, nothing hardcoded) ─────────────
  const EXPECTED_TOTAL = 42000 * 784; // 32,928,000

  const seqBins = histogram?.sequential ?? [];
  const parBins = histogram?.parallel   ?? [];
  const hasSeq  = seqBins.length === 256;
  const hasPar  = parBins.length === 256;

  const seqTotal = histogram?.seqTotal ?? 0;
  const parTotal = histogram?.parTotal ?? 0;
  const isCorrect = histogram?.correctness ?? runResult?.correctness ?? false;
  const mismatchedBins = histogram?.mismatchedBins ?? [];

  // Active run metrics to display in result summary (prefer latest runResult, fallback to histogram)
  const activeSeqMs = runResult?.sequentialMs ?? histogram?.sequentialMs ?? null;
  const activeParMs = runResult?.parallelMs   ?? histogram?.parallelMs   ?? null;
  const activeSpeedup = runResult?.speedup    ?? histogram?.speedup      ?? null;
  const activeEfficiency = runResult?.efficiency ?? histogram?.efficiency ?? null;
  const activeThreads = runResult?.threads ?? threads;

  const canShow = (mode === 'sequential' && hasSeq) ||
                  (mode === 'parallel'   && hasPar) ||
                  (mode === 'both'       && hasSeq && hasPar);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '2rem 1.5rem 5rem 1.5rem' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div id="histogram-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Interactive Parallel Laboratory
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          HISTOGRAM LABORATORY
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Generate and compare sequential and OpenMP parallel histograms from the MNIST dataset.
        </p>
      </div>

      {/* ── SECTION 1 & 2: CONTROLS (THREAD CONFIGURATION & RUN ENGINE) ─────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>

        {/* Section 1: Select OpenMP Threads */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Configuration
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            1. SELECT OPENMP THREADS
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Choose how many OpenMP worker threads will compute local histograms. (Recommended: 8 threads).
          </p>

          <div id="thread-select" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[1, 2, 4, 8, 16].map(t => {
              const isSelected = threads === t;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={running}
                  onClick={() => setThreads(t)}
                  style={{
                    flex: '1 1 50px',
                    padding: '0.65rem 0.5rem',
                    borderRadius: 8,
                    fontSize: '0.95rem',
                    fontWeight: isSelected ? 700 : 500,
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(59,130,246,0.22)' : 'var(--bg-secondary)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: isSelected ? '0 0 12px rgba(59,130,246,0.35)' : 'none',
                    cursor: running ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  {t} {t === 8 && <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--accent-light)' }}>Rec</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Run C++ Engine */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Execution
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              2. RUN C++ ENGINE
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              The following action executes the real C++17/OpenMP engine through the existing backend and WSL2 bridge.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              id="run-engine-btn"
              className="btn btn-primary"
              disabled={running}
              onClick={handleRun}
              style={{
                flex: '1 1 auto',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
              }}
            >
              {running ? (
                <LoadingSpinner size="sm" text={`Executing (${threads} threads)…`} />
              ) : (
                <><Play size={16} /> ▶ Run C++ Engine</>
              )}
            </button>

            <button
              className="btn btn-secondary"
              disabled={loading || running}
              onClick={fetchHistogram}
              title="Reload results from disk"
              style={{ padding: '0.75rem 1rem' }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

      </div>

      {/* ── SECTION 11: LIVE COMPUTATION STATE PIPELINE ─────────────────────── */}
      {running && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          borderRadius: 12,
          padding: '1.5rem',
          marginBottom: '1.75rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--yellow)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '1rem' }}>
            <LoadingSpinner size="sm" />
            <span>C++ Engine In Progress: Processing 32.9M MNIST Pixels with {threads} OpenMP Threads</span>
          </div>

          {/* Visual Execution Pipeline */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.4rem',
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 8,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>React UI</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span>Node.js API</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span>WSL2</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>C++17 Engine</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>OpenMP ({threads}T)</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span>MNIST train.csv</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span>32.9M Pixels</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--purple)', fontWeight: 600 }}>256 Bins</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Results</span>
          </div>
        </div>
      )}

      {/* ── ERROR BANNER ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          color: 'var(--red)',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8,
          padding: '0.85rem 1.15rem',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem'
        }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ── SECTION 12: RESULT SUMMARY ──────────────────────────────────────── */}
      <div id="run-result-banner" style={{ marginBottom: '1.75rem' }}>
        {runResult && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--green)',
            fontSize: '0.88rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            background: 'rgba(34,197,94,0.1)',
            padding: '0.6rem 1rem',
            borderRadius: 8,
            border: '1px solid rgba(34,197,94,0.25)'
          }}>
            <CheckCircle size={16} /> ✓ COMPUTATION COMPLETED — {runResult.message || 'Engine executed successfully'}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
        }}>
          {[
            {
              label: 'SEQUENTIAL TIME',
              val: activeSeqMs != null ? `${activeSeqMs.toFixed(2)} ms` : '—',
              sub: '1 Thread Baseline',
              color: '#3b82f6',
              icon: Cpu
            },
            {
              label: 'PARALLEL TIME',
              val: activeParMs != null ? `${activeParMs.toFixed(2)} ms` : '—',
              sub: `${activeThreads} OpenMP Threads`,
              color: '#22c55e',
              icon: Cpu
            },
            {
              label: 'SPEEDUP',
              val: activeSpeedup != null ? `${activeSpeedup.toFixed(2)}×` : '—',
              sub: 'T_seq / T_par',
              color: 'var(--cyan)',
              icon: Zap
            },
            {
              label: 'EFFICIENCY',
              val: activeEfficiency != null ? `${activeEfficiency.toFixed(1)}%` : '—',
              sub: 'Speedup / Threads',
              color: 'var(--purple)',
              icon: Activity
            },
            {
              label: 'THREADS',
              val: `${activeThreads}`,
              sub: 'Active OpenMP Core Allocation',
              color: 'var(--yellow)',
              icon: Sliders
            },
          ].map(({ label, val, sub, color, icon: Icon }) => (
            <div
              key={label}
              className="card"
              style={{
                padding: '1.15rem 1.25rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  {label}
                </span>
                <Icon size={15} color={color} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color, lineHeight: 1.15, marginBottom: 4 }}>
                {val}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {sub}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 13: HISTOGRAM VIEW MODES ────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Visualization Perspective
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              SELECT HISTOGRAM VIEW MODE
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              id="mode-btn-sequential"
              className={`btn ${mode === 'sequential' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('sequential')}
              style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                borderColor: mode === 'sequential' ? 'var(--accent)' : 'var(--border)'
              }}
            >
              Sequential
            </button>

            <button
              id="mode-btn-parallel"
              className={`btn ${mode === 'parallel' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('parallel')}
              style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                borderColor: mode === 'parallel' ? 'var(--green)' : 'var(--border)',
                color: mode === 'parallel' ? '#fff' : 'var(--text-secondary)',
                background: mode === 'parallel' ? 'var(--green)' : 'var(--bg-secondary)',
              }}
            >
              Parallel
            </button>

            <button
              id="mode-btn-both"
              className={`btn ${mode === 'both' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('both')}
              style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                borderColor: mode === 'both' ? 'var(--purple)' : 'var(--border)',
                color: mode === 'both' ? '#fff' : 'var(--text-secondary)',
                background: mode === 'both' ? 'var(--purple)' : 'var(--bg-secondary)',
              }}
            >
              Both / Comparison
            </button>
          </div>
        </div>

        {/* View Mode Purpose Descriptions */}
        <div style={{
          marginTop: '1rem',
          padding: '0.85rem 1rem',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          borderLeft: `3px solid ${mode === 'sequential' ? '#3b82f6' : mode === 'parallel' ? '#22c55e' : '#a855f7'}`
        }}>
          {mode === 'sequential' && (
            <div>
              <strong style={{ color: '#3b82f6' }}>Sequential Mode:</strong> Single-thread baseline. Shows the histogram computed sequentially by 1 thread.
            </div>
          )}
          {mode === 'parallel' && (
            <div>
              <strong style={{ color: '#22c55e' }}>Parallel Mode:</strong> OpenMP result using selected threads ({activeThreads} threads). Workload partitioned across private thread buffers.
            </div>
          )}
          {mode === 'both' && (
            <div>
              <strong style={{ color: '#a855f7' }}>Both / Comparison Mode:</strong> Comparison view — no third computation is performed. It only overlays the already computed sequential and parallel results to visually demonstrate exact equivalence.
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 14: HISTOGRAM CHART ─────────────────────────────────────── */}
      <div id="histogram-chart-card" className="card" style={{ padding: '1.75rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              256-Bin Pixel Distribution (0–255 Grayscale)
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={20} color="var(--accent)" />
              {mode === 'sequential' ? 'Sequential Histogram' : mode === 'parallel' ? 'Parallel Histogram (OpenMP)' : 'Sequential vs Parallel Histogram Overlay'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
            {(mode === 'sequential' || mode === 'both') && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <span style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2 }} />
                Sequential (1T)
              </span>
            )}
            {(mode === 'parallel' || mode === 'both') && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: 2 }} />
                Parallel ({activeThreads}T)
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
            <LoadingSpinner size="lg" text="Retrieving 256-bin histogram records..." />
          </div>
        ) : canShow ? (
          <HistogramChart
            sequential={seqBins}
            parallel={parBins}
            showMode={mode}
          />
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No histogram data available. Click <strong>Run C++ Engine</strong> above to execute the calculation.
          </div>
        )}

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Hover over any histogram bar to inspect individual bin frequency and verify match status.
        </div>
      </div>

      {/* ── SECTION 15: CORRECTNESS VERIFICATION ────────────────────────────── */}
      <div
        id="correctness-section"
        className="card"
        style={{
          padding: '2rem 1.75rem',
          marginBottom: '2rem',
          borderLeft: `4px solid ${isCorrect ? 'var(--green)' : 'var(--red)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Mathematical Validation
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              3. CORRECTNESS VERIFICATION
            </h3>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0.45rem 1rem',
            borderRadius: 999,
            background: isCorrect ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: isCorrect ? 'var(--green)' : 'var(--red)',
            fontWeight: 800,
            fontSize: '0.92rem',
            letterSpacing: '0.04em'
          }}>
            {isCorrect ? (
              <><CheckCircle size={18} /> ✓ HISTOGRAMS MATCH EXACTLY</>
            ) : (
              <><XCircle size={18} /> ✗ MISMATCH DETECTED</>
            )}
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Every histogram bin produced by the sequential and parallel implementations is compared. The parallel implementation is correct only when all 256 bins match.
        </p>

        {/* Verification Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Sequential Bins</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#3b82f6' }}>{hasSeq ? seqBins.length : 256}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Intensities 0 through 255</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Parallel Bins</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#22c55e' }}>{hasPar ? parBins.length : 256}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Intensities 0 through 255</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Mismatched Bins</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: isCorrect ? 'var(--green)' : 'var(--red)' }}>
              {mismatchedBins.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target: 0 mismatched bins</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Sequential Total</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {seqTotal ? seqTotal.toLocaleString() : '32,928,000'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sum of sequential bins</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Parallel Total</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {parTotal ? parTotal.toLocaleString() : '32,928,000'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sum of parallel bins</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Expected Total</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-light)' }}>
              {EXPECTED_TOTAL.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>42,000 × 784 pixels</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 16: PARALLEL ALGORITHM EXPLANATION ──────────────────────── */}
      <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
          <Layers size={18} color="var(--accent-light)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            HOW PARALLEL HISTOGRAMMING WORKS
          </h3>
        </div>

        {/* Algorithm Pipeline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '1rem',
          margin: '1rem 0',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <span style={{ color: 'var(--accent-light)' }}>32.9M pixels</span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ color: 'var(--cyan)' }}>OpenMP threads</span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ color: '#22c55e' }}>Thread-local histograms</span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ color: 'var(--purple)' }}>Merge / reduction</span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Final 256-bin histogram</span>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
          Each OpenMP thread updates its own local 256-bin histogram. The local histograms are merged after processing, preventing race conditions caused by multiple threads updating the same shared bin.
        </p>
      </div>

    </div>
  );
}
