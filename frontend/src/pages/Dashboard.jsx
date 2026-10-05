// Dashboard.jsx — Starting Laboratory Control Center
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, Cpu, Zap, BarChart2, Play, Activity, Compass,
  Sliders, Terminal, Scale, ShieldCheck, ArrowRight, Sparkles
} from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTour } from '../context/TourContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { replayTour } = useTour();
  const [dataset, setDataset]     = useState(null);
  const [histogram, setHistogram] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [ds, hist] = await Promise.allSettled([
          api.getDataset(), api.getHistogram()
        ]);
        if (ds.status === 'fulfilled')   setDataset(ds.value);
        if (hist.status === 'fulfilled') setHistogram(hist.value);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalImages = dataset?.rows ? dataset.rows.toLocaleString() : '42,000';
  const totalPixels = dataset?.totalPixels ? (dataset.totalPixels / 1e6).toFixed(1) + 'M' : '32.9M';
  const binCount    = dataset?.bins ?? 256;

  const displayName = user?.name || user?.username || 'Researcher';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>

      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <div
        id="dashboard-header"
        style={{
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Laboratory Control Center
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Welcome back, {displayName}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            ParaHist Parallel Computing Laboratory
          </p>
        </div>

        <button
          onClick={replayTour}
          className="btn btn-secondary"
          style={{
            borderColor: 'rgba(59,130,246,0.4)',
            color: 'var(--accent-light)',
            background: 'rgba(59,130,246,0.08)',
            fontWeight: 600,
            gap: '0.5rem',
            padding: '0.55rem 1rem'
          }}
        >
          <Compass size={16} /> Replay Guided Tour
        </button>
      </div>

      {loading && <LoadingSpinner text="Connecting to laboratory services..." />}
      {error && (
        <div style={{ color: 'var(--red)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          ⚠ Laboratory notification: {error}
        </div>
      )}

      {/* ── LARGE PRIMARY CARD: START PARALLEL HISTOGRAM EXPERIMENT ─────────── */}
      <div
        id="dashboard-overview-card"
        style={{
          background: 'var(--hero-glow)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '2.25rem 2rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.25rem 0.65rem',
            borderRadius: 6,
            background: 'rgba(59,130,246,0.15)',
            color: 'var(--accent-light)',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={13} /> Primary Experiment
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            START PARALLEL HISTOGRAM EXPERIMENT
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Run the real C++17 + OpenMP histogram engine on the MNIST dataset.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/histogram')}
          style={{
            padding: '0.9rem 2rem',
            fontSize: '1rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
            flexShrink: 0
          }}
        >
          Open Histogram Lab →
        </button>
      </div>

      {/* ── FOUR COMPACT STATISTICS ─────────────────────────────────────────── */}
      <div
        id="dashboard-stat-cards"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}
      >
        {[
          { label: 'Images', value: totalImages, sub: 'MNIST train.csv', color: 'var(--accent-light)', icon: Database },
          { label: 'Pixels', value: totalPixels, sub: '32,928,000 values', color: 'var(--cyan)', icon: Activity },
          { label: 'Bins', value: `${binCount}`, sub: '0–255 grayscale', color: 'var(--purple)', icon: BarChart2 },
          { label: 'Engine', value: 'OpenMP', sub: 'C++17 Multi-threaded', color: 'var(--green)', icon: Cpu },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="card" style={{ position: 'relative', overflow: 'hidden', padding: '1.25rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</span>
              <Icon size={18} color={color} />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color, lineHeight: 1.1, marginBottom: 4 }}>
              {value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {sub}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* ── EXPERIMENT WORKFLOW (VISUALLY CONNECTED STEPS) ──────────────────── */}
      <div className="card" style={{ padding: '2rem 1.75rem', marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Standard Laboratory Protocol
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            EXPERIMENT WORKFLOW
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: 4 }}>
            Systematic progression from configuration to parallel execution, correctness validation, and scaling analysis.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: '0.75rem',
          position: 'relative'
        }}>
          {[
            { num: 1, name: 'Select Threads', icon: Sliders, color: '#3b82f6' },
            { num: 2, name: 'Run C++ Engine', icon: Play, color: '#06b6d4' },
            { num: 3, name: 'View Sequential', icon: Terminal, color: '#3b82f6' },
            { num: 4, name: 'View Parallel', icon: Cpu, color: '#22c55e' },
            { num: 5, name: 'Compare Both', icon: Scale, color: '#a855f7' },
            { num: 6, name: 'Verify Correctness', icon: ShieldCheck, color: '#22c55e' },
            { num: 7, name: 'Analyze Performance', icon: Zap, color: '#eab308' },
          ].map(({ num, name, icon: Icon, color }, idx) => (
            <div
              key={num}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '1rem 0.75rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: `${color}25`,
                color,
                fontWeight: 700,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                {num}
              </div>

              <div style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: `${color}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <Icon size={16} color={color} />
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS FOOTER ────────────────────────────────────────────── */}
      <div id="dashboard-quick-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/performance')}
          style={{ fontSize: '0.88rem' }}
        >
          <Zap size={15} /> Performance Analysis
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => navigate('/how-it-works')}
          style={{ fontSize: '0.88rem' }}
        >
          Algorithm & Architecture
        </button>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/histogram')}
          style={{ fontSize: '0.88rem', fontWeight: 600 }}
        >
          <Play size={15} /> Open Histogram Lab
        </button>
      </div>

    </div>
  );
}
