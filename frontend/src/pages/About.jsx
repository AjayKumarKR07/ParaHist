// About.jsx
import { Compass } from 'lucide-react';
import { useTour } from '../context/TourContext';

export default function About() {
  const { replayTour } = useTour();

  const Section = ({ title, children }) => (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>{title}</h2>
      {children}
    </div>
  );

  const P = ({ children }) => <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: '0.5rem' }}>{children}</p>;

  const Code = ({ children }) => (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginTop: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--accent-light)', overflowX: 'auto', whiteSpace: 'pre' }}>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>About ParaHist</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Parallel Computing Mini-Project · College Assignment 2026</p>
        </div>
        <button
          onClick={replayTour}
          className="btn btn-secondary"
          style={{
            borderColor: 'rgba(59,130,246,0.4)',
            color: 'var(--accent-light)',
            background: 'rgba(59,130,246,0.08)',
            fontWeight: 600,
          }}
        >
          <Compass size={16} /> Replay Guided Tour
        </button>
      </div>

      <Section title="What is ParaHist?">
        <P>ParaHist is a parallel computing project that demonstrates the performance benefits of OpenMP-based parallelism through histogram generation on a real dataset.</P>
        <P>It computes a 256-bin pixel intensity histogram from the MNIST Kaggle Digit Recognizer dataset — 42,000 images with 784 pixels each — totaling 32,928,000 pixel values.</P>
      </Section>

      <Section title="Why Histogram Generation?">
        <P>Histogram generation is an embarrassingly parallel problem — each pixel can be processed independently, making it an ideal workload for demonstrating OpenMP thread-level parallelism.</P>
        <P>The task involves reading a large array and performing write operations to a 256-bin histogram, making it memory-bandwidth bound at high thread counts — this is why efficiency decreases as threads increase.</P>
      </Section>

      <Section title="Why OpenMP?">
        <P>OpenMP (Open Multi-Processing) is an industry-standard API for shared-memory parallel programming in C++. It requires minimal code changes to parallelize loops and is portable across compilers and platforms.</P>
        <P>The project uses OpenMP 4.5+ with GCC 15.2 on Linux (WSL2) to run parallel computations across up to 16 logical processors.</P>
      </Section>

      <Section title="Thread-Local Histogram Reduction">
        <P>The key algorithmic choice is avoiding a shared histogram — which would require expensive atomic operations or locks. Instead:</P>
        <Code>{`// Each thread gets a private 256-bin array
std::vector<std::array<long long, 256>> local_hists(nthreads);

#pragma omp parallel num_threads(nthreads)
{
    int tid = omp_get_thread_num();
    auto& local = local_hists[tid];  // private — no sharing

    #pragma omp for schedule(static)
    for (size_t i = 0; i < rows.size(); ++i)
        for (uint8_t px : rows[i].pixels)
            local[px]++;             // zero contention
}

// Serial merge — O(256 × threads) — negligible
for (int t = 0; t < nthreads; ++t)
    for (int b = 0; b < 256; ++b)
        global[b] += local_hists[t][b];`}</Code>
      </Section>

      <Section title="Dataset">
        <P><strong style={{ color: 'var(--text-primary)' }}>Source:</strong> Kaggle MNIST Digit Recognizer (train.csv)</P>
        <P><strong style={{ color: 'var(--text-primary)' }}>Structure:</strong> 42,000 rows × 785 columns (1 label + 784 uint8 pixel values)</P>
        <P><strong style={{ color: 'var(--text-primary)' }}>Pixel range:</strong> 0–255 (grayscale), forming a 256-bin histogram</P>
        <P><strong style={{ color: 'var(--text-primary)' }}>Note:</strong> This project does NOT perform digit recognition. MNIST is used only as a large, real-world dataset for benchmarking.</P>
      </Section>

      <Section title="Performance Formulas">
        <Code>{`Speedup    = Sequential_Time / Parallel_Time

Efficiency = (Speedup / num_threads) × 100%

Amdahl's Law limit:
  Speedup_max = 1 / (1 - P)
  where P = parallelizable fraction`}</Code>
        <P style={{ marginTop: '0.75rem' }}>At high thread counts (8–16), the bottleneck shifts from compute to memory bandwidth — reading 32.9 million bytes saturates the L3 cache and memory bus faster than additional cores can help.</P>
      </Section>

      <Section title="Technology Stack">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
          {[
            ['C++ 17', 'Core computation language'],
            ['OpenMP 4.5', 'Parallelism API'],
            ['GCC 15.2', 'Compiler (WSL2/Linux)'],
            ['CMake 4.x', 'Build system'],
            ['React + Vite', 'Web frontend'],
            ['Tailwind CSS', 'Styling'],
            ['Recharts', 'Data visualisation'],
            ['Express.js', 'REST API backend'],
            ['MNIST Kaggle', 'Dataset (42,000 images)'],
          ].map(([tech, desc]) => (
            <div key={tech} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
              <span style={{ color: 'var(--accent-light)', fontWeight: 600, fontSize: '0.85rem' }}>{tech}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>— {desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Author">
        <P><strong style={{ color: 'var(--text-primary)' }}>Ajay Kumar K R</strong> · College Parallel Computing Mini-Project, 2026</P>
        <P>GitHub: <a href="https://github.com/AjayKumarKR07/ParaHist" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-light)' }}>github.com/AjayKumarKR07/ParaHist</a></P>
      </Section>
    </div>
  );
}
