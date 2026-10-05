// HowItWorks.jsx — Step-by-Step Educational Guide for ParaHist
import {
  Database, BarChart2, GitBranch, Cpu, CheckCircle,
  Merge, Layers, Zap, BookOpen, Monitor, Sliders, Play,
  Terminal, Scale, ShieldCheck, UserCheck, ArrowDown, Info
} from 'lucide-react';

export default function HowItWorks() {
  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '2.5rem 1.5rem 5rem 1.5rem' }}>

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.35rem 0.9rem',
          borderRadius: 999,
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.25)',
          marginBottom: '1rem',
        }}>
          <BookOpen size={14} color="var(--accent-light)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Comprehensive Laboratory Guide
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          How ParaHist Works
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Understanding the Portal Workflow, the OpenMP Parallel Algorithm, and the High-Performance Computational Architecture.
        </p>
      </div>

      {/* ── COMPUTATIONAL ARCHITECTURE DIAGRAM (SECTION 20) ──────────────────── */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '2.5rem 1.5rem',
          boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              System Flow
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              COMPUTATIONAL ARCHITECTURE DIAGRAM
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              End-to-end execution flow from client interaction down to multi-core OpenMP reduction.
            </p>
          </div>

          {/* Centered Architecture Flow */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.82rem',
            gap: 6
          }}>
            {/* User */}
            <div style={styles.archBox('#3b82f6', 150)}>
              <strong>USER</strong>
            </div>
            <div style={styles.arrow}>↓</div>

            {/* React UI */}
            <div style={styles.archBox('#06b6d4', 180)}>
              <span>React UI (Vite)</span>
            </div>
            <div style={styles.arrow}>↓</div>

            {/* Node.js API */}
            <div style={styles.archBox('#22c55e', 200)}>
              <span>Node.js API (Express)</span>
            </div>
            <div style={styles.arrow}>↓</div>

            {/* WSL2 */}
            <div style={styles.archBox('#a855f7', 200)}>
              <span>WSL2 Subsystem Bridge</span>
            </div>
            <div style={styles.arrow}>↓</div>

            {/* C++17 Engine */}
            <div style={styles.archBox('#f59e0b', 220)}>
              <strong>C++17 Engine</strong>
            </div>
            <div style={styles.arrow}>↓</div>

            {/* OpenMP Core */}
            <div style={styles.archBox('#ec4899', 220)}>
              <strong>OpenMP 4.5</strong>
            </div>

            {/* Split: Sequential vs Parallel */}
            <div style={{ display: 'flex', gap: '3rem', marginTop: 10, marginBottom: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>↙</span>
                <div style={{ ...styles.archBox('#3b82f6', 170), marginTop: 4 }}>
                  <div style={{ fontWeight: 700 }}>Sequential</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1 Thread</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>↘</span>
                <div style={{ ...styles.archBox('#22c55e', 170), marginTop: 4 }}>
                  <div style={{ fontWeight: 700 }}>Parallel</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>N OpenMP Threads</div>
                </div>
              </div>
            </div>

            {/* Converge on 256 Bins */}
            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>↘</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>↙</span>
            </div>

            <div style={styles.archBox('#8b5cf6', 220)}>
              <strong>256 Bins (0–255)</strong>
            </div>
            <div style={styles.arrow}>↓</div>

            {/* Exact Compare */}
            <div style={styles.archBox('#06b6d4', 220)}>
              <span>Exact Bin-by-Bin Compare</span>
            </div>
            <div style={styles.arrow}>↓</div>

            {/* Correctness */}
            <div style={styles.archBox('#22c55e', 220)}>
              <strong style={{ color: 'var(--green)' }}>✓ Correctness Validation</strong>
            </div>
            <div style={styles.arrow}>↓</div>

            {/* Speedup + Efficiency */}
            <div style={styles.archBox('#eab308', 240)}>
              <strong style={{ color: 'var(--yellow)' }}>Speedup &amp; Efficiency Analysis</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── PART A: HOW TO USE THE PARAHIST PORTAL (SECTION 19) ─────────────── */}
      <section style={{ marginBottom: '4.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Interactive User Experience
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            PART A: HOW TO USE THE PARAHIST PORTAL
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: 4 }}>
            The 10-step portal journey designed for researchers, evaluators, and students.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {[
            { num: '01', title: 'Login / Register', desc: 'Securely authenticate to initialize your personal research workspace.', icon: UserCheck, color: '#3b82f6' },
            { num: '02', title: 'Open Dashboard', desc: 'Review key dataset statistics and launch the primary experiment from the control center.', icon: Monitor, color: '#06b6d4' },
            { num: '03', title: 'Open Histogram Lab', desc: 'Enter the interactive laboratory workspace containing the C++ execution engine.', icon: BarChart2, color: '#8b5cf6' },
            { num: '04', title: 'Select Threads', desc: 'Configure the desired OpenMP thread concurrency (1, 2, 4, 8, or 16 threads).', icon: Sliders, color: '#f59e0b' },
            { num: '05', title: 'Run C++ Engine', desc: 'Trigger the real native binary to compute both sequential and parallel histograms.', icon: Play, color: '#22c55e' },
            { num: '06', title: 'View Sequential', desc: 'Inspect the single-threaded baseline histogram across 256 grayscale intensity bins.', icon: Terminal, color: '#3b82f6' },
            { num: '07', title: 'View Parallel', desc: 'Observe the multi-threaded OpenMP histogram generated with zero data races.', icon: Cpu, color: '#22c55e' },
            { num: '08', title: 'Compare Both', desc: 'Overlay both distributions simultaneously to visually confirm identical bin frequencies.', icon: Scale, color: '#a855f7' },
            { num: '09', title: 'Verify Correctness', desc: 'Examine the automated bin-by-bin verification report ensuring a 100% PASS result.', icon: ShieldCheck, color: '#22c55e' },
            { num: '10', title: 'Open Performance', desc: 'Evaluate runtime metrics, speedup factors, and parallel efficiency curves.', icon: Zap, color: '#eab308' },
          ].map(({ num, title, desc, icon: Icon, color }) => (
            <div
              key={num}
              className="card"
              style={{
                padding: '1.35rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: `${color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color,
                fontWeight: 800,
                fontSize: '0.85rem',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {num}
              </div>

              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PART B: HOW THE ALGORITHM WORKS (SECTION 19) ────────────────────── */}
      <section>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Algorithmic Deep Dive
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            PART B: HOW THE ALGORITHM WORKS
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: 4 }}>
            Detailed breakdown of data decomposition, thread-local reduction, and lock-free parallelization.
          </p>
        </div>

        {/* Algorithm Flow Representation */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Dataflow Breakdown
          </h3>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '1.25rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.82rem',
            lineHeight: 1.8,
            color: 'var(--text-primary)'
          }}>
            <div>MNIST Dataset (dataset/train.csv)</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div>42,000 Images (784 features per image)</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div style={{ color: 'var(--accent-light)' }}>32,928,000 Pixel Values (0–255 grayscale)</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div style={{ color: '#f59e0b' }}>Sequential Histogram (1 Thread Baseline) + OpenMP Parallel Histogram (N Threads)</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div style={{ color: 'var(--green)' }}>Thread-local histograms (Zero-contention private buffers: uint64_t local_hist[N][256])</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div style={{ color: 'var(--purple)' }}>Merge / Reduction summation across threads</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div>256 bins output in CSV format (results/histogram_par.csv)</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div style={{ color: 'var(--cyan)' }}>Exact comparison: Seq[i] == Par[i] for all i ∈ [0, 255]</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div style={{ color: 'var(--green)', fontWeight: 700 }}>✓ Correctness Verified (Total = 32,928,000 pixels)</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓</div>
            <div style={{ color: 'var(--yellow)', fontWeight: 700 }}>Performance Analysis (Speedup S = T₁ / T_p, Efficiency E = S / p)</div>
          </div>
        </div>

        {/* Why Thread-Local Histograms Matter */}
        <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Why Thread-Local Histograms Eliminate Data Races
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1rem' }}>
            If multiple threads write directly to a single shared array without synchronization, race conditions corrupt the final counts. Adding atomic locks or critical sections on every pixel access would severely destroy performance.
          </p>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 8,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.78rem',
            color: 'var(--text-primary)',
            lineHeight: 1.6
          }}>
            #pragma omp parallel num_threads(num_threads)<br/>
            &#123;<br/>
            &nbsp;&nbsp;int tid = omp_get_thread_num();<br/>
            &nbsp;&nbsp;// Each thread computes into its own isolated 256-bin buffer<br/>
            &nbsp;&nbsp;std::vector&lt;uint64_t&gt;&amp; my_hist = thread_hists[tid];<br/>
            &nbsp;&nbsp;#pragma omp for schedule(static)<br/>
            &nbsp;&nbsp;for (size_t i = 0; i &lt; total_pixels; ++i) &#123;<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;my_hist[pixels[i]]++; // Lock-free local increment<br/>
            &nbsp;&nbsp;&#125;<br/>
            &#125;<br/>
            // Master thread merges local buffers into final histogram (256 additions per thread)
          </div>
        </div>
      </section>

    </div>
  );
}

const styles = {
  archBox: (color, width) => ({
    background: 'var(--bg-secondary)',
    border: `1px solid ${color}44`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 8,
    padding: '0.55rem 1rem',
    textAlign: 'center',
    width: Math.max(width, 160),
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow)',
  }),
  arrow: {
    color: 'var(--text-muted)',
    fontSize: '1rem',
    lineHeight: 1,
    margin: '2px 0',
  }
};
