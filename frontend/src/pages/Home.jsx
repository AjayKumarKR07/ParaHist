// Home.jsx — Academic Landing Page for ParaHist
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, Database, BarChart2, Zap, CheckCircle, ArrowRight,
  ShieldCheck, Layers, GitBranch, Sparkles, Terminal, Activity, Play,
  Sliders, Eye, Scale, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [datasetStats, setDatasetStats] = useState(null);

  useEffect(() => {
    api.getDataset().then(setDatasetStats).catch(() => {});
  }, []);

  const totalImages = datasetStats?.rows ? datasetStats.rows.toLocaleString() : '42,000';
  const totalPixels = datasetStats?.totalPixels ? (datasetStats.totalPixels / 1e6).toFixed(1) + 'M' : '32.9M';
  const binCount    = datasetStats?.bins ?? 256;

  const handleStartLab = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem 1.5rem' }}>

      {/* ── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '3rem 1rem 2.5rem 1rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.35rem 0.9rem',
          borderRadius: 999,
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.25)',
          marginBottom: '1.25rem',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            High-Performance Parallel Computing Laboratory
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          marginBottom: '0.6rem'
        }}>
          ParaHist
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
          fontWeight: 600,
          color: 'var(--accent-light)',
          marginBottom: '1.25rem',
          letterSpacing: '-0.01em'
        }}>
          Parallel Histogram Generation Using OpenMP
        </p>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: 680,
          margin: '0 auto 0.75rem auto',
          lineHeight: 1.65,
        }}>
          Analyze 32.9 million MNIST pixel values using sequential and parallel computing with C++17 and OpenMP.
        </p>

        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-muted)',
          maxWidth: 620,
          margin: '0 auto 2.25rem auto',
          lineHeight: 1.6,
        }}>
          Generate a 256-bin histogram, verify exact correctness, and measure parallel performance.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleStartLab}
            style={{ padding: '0.8rem 1.85rem', fontSize: '0.95rem', fontWeight: 600 }}
          >
            <Sparkles size={17} /> Start ParaHist
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => navigate('/how-it-works')}
            style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem', fontWeight: 500 }}
          >
            How It Works <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── 2. HOW PARAHIST WORKS (5-STAGE PIPELINE) ────────────────────────── */}
      <section style={{ margin: '3.5rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            01 — System Architecture
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            How ParaHist Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 580, margin: '0.35rem auto 0 auto' }}>
            A streamlined 5-stage computing pipeline from raw dataset ingestion to verified parallel acceleration.
          </p>
        </div>

        {/* 5-Stage Horizontal Pipeline */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '2rem 1.5rem',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            alignItems: 'stretch',
            position: 'relative'
          }}>
            {[
              {
                step: '01',
                name: 'DATASET',
                line1: '42,000 MNIST images',
                line2: '32.9M pixel values',
                icon: Database,
                color: 'var(--accent-light)'
              },
              {
                step: '02',
                name: 'COMPUTE',
                line1: 'Sequential 1T',
                line2: 'OpenMP NT',
                icon: Cpu,
                color: 'var(--cyan)'
              },
              {
                step: '03',
                name: 'HISTOGRAM',
                line1: '256 intensity bins',
                line2: '0–255 grayscale',
                icon: BarChart2,
                color: 'var(--purple)'
              },
              {
                step: '04',
                name: 'VERIFY',
                line1: 'Compare all 256 bins',
                line2: 'Exact match',
                icon: CheckCircle,
                color: 'var(--green)'
              },
              {
                step: '05',
                name: 'PERFORMANCE',
                line1: 'Execution time',
                line2: 'Speedup & Efficiency',
                icon: Zap,
                color: 'var(--yellow)'
              },
            ].map(({ step, name, line1, line2, icon: Icon, color }) => (
              <div
                key={step}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '1.25rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color,
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>{step}</span>
                  <span>•</span>
                  <span>{name}</span>
                </div>

                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10
                }}>
                  <Icon size={18} color={color} />
                </div>

                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {line1}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {line2}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PROJECT AT A GLANCE (4 REAL STATS CARDS) ─────────────────────── */}
      <section style={{ margin: '3.5rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            02 — Project Parameters
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Project at a Glance
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real metrics calculated directly against the Kaggle MNIST dataset.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[
            { value: totalImages, label: 'MNIST Images', sub: 'Kaggle MNIST train.csv', color: 'var(--accent-light)', icon: Database },
            { value: totalPixels, label: 'Pixel Values', sub: '42,000 × 784 pixels (32,928,000)', color: 'var(--cyan)', icon: Activity },
            { value: `${binCount}`, label: 'Histogram Bins', sub: 'Intensities 0 through 255', color: 'var(--purple)', icon: BarChart2 },
            { value: 'OpenMP', label: 'Parallel Engine', sub: 'C++17 Multi-Threaded Core', color: 'var(--green)', icon: Cpu },
          ].map(({ value, label, sub, color, icon: Icon }) => (
            <div key={label} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</span>
                <Icon size={18} color={color} />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color, lineHeight: 1.1, marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {sub}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. EXPERIMENT WORKFLOW (7 CONNECTED STEPS) ───────────────────────── */}
      <section style={{ margin: '4rem 0 3.5rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            03 — Structured Methodology
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Your Experiment Workflow
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 600, margin: '0.35rem auto 0 auto' }}>
            Follow the complete step-by-step scientific workflow in the ParaHist laboratory.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}>
          {[
            {
              step: '01',
              title: 'Select Threads',
              desc: 'Choose 1, 2, 4, 8 or 16 OpenMP threads.',
              icon: Sliders,
              color: '#3b82f6'
            },
            {
              step: '02',
              title: 'Run C++ Engine',
              desc: 'Execute the real C++17/OpenMP engine against MNIST.',
              icon: Play,
              color: '#06b6d4'
            },
            {
              step: '03',
              title: 'View Sequential',
              desc: 'See the single-thread histogram baseline.',
              icon: Terminal,
              color: '#3b82f6'
            },
            {
              step: '04',
              title: 'View Parallel',
              desc: 'See the OpenMP histogram generated using the selected thread count.',
              icon: Cpu,
              color: '#22c55e'
            },
            {
              step: '05',
              title: 'Compare Both',
              desc: 'Overlay sequential and parallel results.',
              icon: Scale,
              color: '#a855f7'
            },
            {
              step: '06',
              title: 'Verify Correctness',
              desc: 'Confirm all 256 bins match exactly.',
              icon: ShieldCheck,
              color: '#22c55e'
            },
            {
              step: '07',
              title: 'Analyze Performance',
              desc: 'Compare execution time, speedup and efficiency.',
              icon: Zap,
              color: '#eab308'
            },
          ].map(({ step, title, desc, icon: Icon, color }) => (
            <div
              key={step}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                padding: '1.35rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color,
                  fontFamily: 'JetBrains Mono, monospace'
                }}>
                  {step}
                </span>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: `${color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={16} color={color} />
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, flexGrow: 1 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. CORE / PROJECT FEATURES ───────────────────────────────────────── */}
      <section style={{ margin: '4rem 0 3.5rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            04 — Architectural Highlights
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Core Laboratory Features
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 600, margin: '0.35rem auto 0 auto' }}>
            A rigorous demonstration of parallel computing principles from algorithms to hardware scalability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              title: 'Sequential Histogram',
              desc: 'Generate a 256-bin histogram using a single execution thread.',
              icon: Terminal,
              color: '#3b82f6',
              tag: 'Single-Threaded Baseline',
            },
            {
              title: 'Parallel Histogram',
              desc: 'Use OpenMP to distribute pixel processing across multiple threads.',
              icon: Cpu,
              color: '#22c55e',
              tag: 'Multi-Core Acceleration',
            },
            {
              title: 'Correctness Validation',
              desc: 'Compare all 256 bins to verify that sequential and parallel results are identical.',
              icon: ShieldCheck,
              color: '#a855f7',
              tag: '100% Zero Discrepancy',
            },
            {
              title: 'Performance Analysis',
              desc: 'Measure execution time, speedup, and parallel efficiency.',
              icon: Zap,
              color: '#06b6d4',
              tag: 'Amdahl’s Law Scaling',
            },
          ].map(({ title, desc, icon: Icon, color, tag }) => (
            <div key={title} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={color} />
                </div>
                <span className="badge" style={{ background: color + '18', color, border: `1px solid ${color}35`, fontSize: '0.72rem' }}>
                  {tag}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, flexGrow: 1, margin: 0 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. PROJECT AUTHORS ──────────────────────────────────────────────── */}
      <section style={{ margin: '4.5rem 0 3.5rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Academic Contributors
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            PROJECT AUTHORS
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
            Developed as a Parallel Computing project using C++17 and OpenMP.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: 780,
          margin: '0 auto'
        }}>
          {[
            {
              name: 'Ajay Kumar K R',
              role: 'Project Author',
              github: 'https://github.com/AjayKumarKR07',
              avatarText: 'AK',
              color: '#3b82f6',
            },
            {
              name: 'Anil Kumar G R',
              role: 'Project Author',
              github: 'https://github.com/Anil-962',
              avatarText: 'AG',
              color: '#6366f1',
            },
          ].map(({ name, role, github, avatarText, color }) => (
            <div
              key={name}
              className="card author-card"
              style={{
                padding: '2.25rem 1.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${color}, #8b5cf6)`,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                marginBottom: '1rem',
                boxShadow: `0 6px 16px ${color}35`
              }}>
                {avatarText}
              </div>

              {/* Name */}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                {name}
              </h3>

              {/* Role */}
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--accent-light)',
                background: 'rgba(59,130,246,0.1)',
                padding: '0.25rem 0.85rem',
                borderRadius: 999,
                border: '1px solid rgba(59,130,246,0.2)',
                marginBottom: '1.5rem'
              }}>
                {role}
              </div>

              {/* GitHub Button */}
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.7rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  gap: '0.5rem',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                  background: 'var(--bg-secondary)',
                }}
              >
                {/* Clean GitHub Mark SVG */}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                GitHub Profile →
              </a>

              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. FINAL CTA — READY TO RUN THE PARALLEL COMPUTING LAB? ──────────── */}
      <section style={{ margin: '4.5rem 0 1rem 0' }}>
        <div style={{
          background: 'var(--hero-glow)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Ready to Run the Parallel Computing Lab?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: 580, margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Execute the real C++17 OpenMP engine and explore sequential versus parallel histogram generation.
          </p>

          <button
            className="btn btn-primary"
            onClick={handleStartLab}
            style={{ padding: '0.85rem 2.2rem', fontSize: '1rem', fontWeight: 700 }}
          >
            Start ParaHist →
          </button>
        </div>
      </section>

    </div>
  );
}
