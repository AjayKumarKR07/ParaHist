// TourOverlay.jsx — Interactive Spotlight & Coach-Mark Guided Tour System
import { useEffect, useState, useRef, useCallback } from 'react';
import { useTour } from '../context/TourContext';
import {
  Compass, Sparkles, ChevronRight, ChevronLeft, X,
  CheckCircle, Play, Cpu, Database, Zap, Layers, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function TourOverlay() {
  const {
    isTourActive,
    currentStepIdx,
    currentStep,
    totalSteps,
    showWelcome,
    showFinal,
    pageState,
    startTour,
    skipTour,
    replayTour,
    finishTour,
    nextStep,
    prevStep,
  } = useTour();

  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 100, left: 100, placement: 'bottom' });
  const tooltipRef = useRef(null);

  // Measure and position the spotlight around the target element
  const updateSpotlight = useCallback(() => {
    if (!isTourActive || !currentStep?.targetId) {
      setTargetRect(null);
      return;
    }

    let el = document.getElementById(currentStep.targetId);
    if (!el && currentStep.targetId === 'run-result-banner') {
      el = document.getElementById('histogram-info-cards') || document.getElementById('histogram-header');
    }

    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });

    // Calculate tooltip coordinates
    const tooltipWidth = 440;
    const tooltipPadding = 16;
    const margin = 14;

    let placement = 'bottom';
    let top = rect.bottom + margin;
    let left = Math.max(tooltipPadding, Math.min(window.innerWidth - tooltipWidth - tooltipPadding, rect.left));

    // If bottom overflow, flip to top
    if (top + 320 > window.innerHeight && rect.top - 320 > 0) {
      placement = 'top';
      top = Math.max(16, rect.top - 300 - margin);
    }

    setTooltipPos({ top: Math.max(16, top), left, placement });
  }, [isTourActive, currentStep]);

  // Keep spotlight positioned on resize, scroll, and step change
  useEffect(() => {
    if (!isTourActive || !currentStep?.targetId) return;

    // Retry checking for element until found or up to 1 second
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      let el = document.getElementById(currentStep.targetId);
      if (!el && currentStep.targetId === 'run-result-banner') {
        el = document.getElementById('histogram-info-cards') || document.getElementById('histogram-header');
      }
      if (el || attempts > 10) {
        updateSpotlight();
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        clearInterval(interval);
      }
    }, 100);

    const handleScrollOrResize = () => updateSpotlight();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isTourActive, currentStep, currentStepIdx, updateSpotlight]);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. WELCOME MODAL (FIRST VISIT)
  // ───────────────────────────────────────────────────────────────────────────
  if (showWelcome) {
    return (
      <div style={styles.modalBackdrop}>
        <div style={styles.welcomeCard}>
          <div style={styles.welcomeIconHeader}>
            <div style={styles.welcomeIconBubble}>
              <Compass size={32} color="#fff" />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="badge badge-blue">Interactive Onboarding</span>
              <span className="badge badge-green">OpenMP Guided Tour</span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Welcome to ParaHist
            </h2>
            <p style={{ color: 'var(--accent-light)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 10 }}>
              Parallel Histogram Generation Using OpenMP
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
              Would you like a step-by-step guided walkthrough to run the C++ engine, explore sequential vs parallel execution, verify correctness, and analyze performance?
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              You will discover:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>• Real C++ OpenMP execution</div>
              <div>• Sequential single-thread</div>
              <div>• Parallel reduction & merge</div>
              <div>• 256-bin exact verification</div>
              <div>• Speedup & Efficiency curves</div>
              <div>• Interactive bar inspection</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={skipTour} style={{ padding: '0.65rem 1.25rem' }}>
              Skip Tour
            </button>
            <button className="btn btn-primary" onClick={startTour} style={{ padding: '0.65rem 1.5rem', fontWeight: 600 }}>
              <Sparkles size={16} /> Start Guided Tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. FINAL CONCLUSION MODAL
  // ───────────────────────────────────────────────────────────────────────────
  if (showFinal) {
    return (
      <div style={styles.modalBackdrop}>
        <div style={{ ...styles.welcomeCard, maxWidth: 540 }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ ...styles.welcomeIconBubble, background: 'linear-gradient(135deg, #22c55e, #10b981)', margin: '0 auto 1rem auto' }}>
              <CheckCircle size={32} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              ParaHist Demonstration Complete!
            </h2>
            <p style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.9rem' }}>
              Parallel Computing Demonstration Successfully Finished
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Summary of Concepts Demonstrated:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div>✓ MNIST dataset (32.9M px)</div>
              <div>✓ 256-bin histogram</div>
              <div>✓ Sequential execution</div>
              <div>✓ OpenMP parallel execution</div>
              <div>✓ Thread-local histograms</div>
              <div>✓ Zero-lock histogram merge</div>
              <div>✓ Correctness validation</div>
              <div>✓ Sequential vs Parallel view</div>
              <div>✓ Real-time Speedup (S = T₁/Tₚ)</div>
              <div>✓ Parallel Efficiency (E %)</div>
            </div>
          </div>

          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '0.85rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.86rem', color: 'var(--accent)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Core Principle:</strong> "Parallel computing performs the same computation using multiple threads to reduce execution time while maintaining absolute correctness."
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={replayTour} style={{ fontSize: '0.82rem' }}>
              <RefreshCw size={14} /> Replay Guided Tour
            </button>
            <button className="btn btn-primary" onClick={finishTour} style={{ fontWeight: 600, padding: '0.65rem 1.5rem' }}>
              Finish Tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If tour is not active, render nothing
  if (!isTourActive || !currentStep) return null;

  // ───────────────────────────────────────────────────────────────────────────
  // 3. STEP 4 RUNNING ENGINE ARCHITECTURE MODAL
  // ───────────────────────────────────────────────────────────────────────────
  if (currentStep.id === 'run-engine' && pageState.running) {
    return (
      <div style={styles.modalBackdrop}>
        <div style={{ ...styles.welcomeCard, maxWidth: 580, border: '1px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--yellow)', animation: 'tour-pulse-ring 1.5s infinite' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Running C++ OpenMP Engine...
            </h3>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--accent-light)', lineHeight: 1.65 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>REAL ARCHITECTURE DATAFLOW:</div>
            <div>React (UI Trigger)</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓ HTTP POST /api/run</div>
            <div>Node.js Express API</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓ wsl.exe execFile (no shell)</div>
            <div style={{ color: '#60a5fa', fontWeight: 700 }}>C++17 + OpenMP Engine ({pageState.threads} threads)</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓ Streaming dataset/train.csv</div>
            <div>32,928,000 Grayscale Pixels</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓ Static thread chunks & local histograms</div>
            <div>Sequential Baseline + OpenMP Reduction Merge</div>
            <div style={{ color: 'var(--text-muted)' }}>&nbsp;&nbsp;↓ results/histogram_seq.csv & histogram_par.csv</div>
            <div>Express JSON API → React Recharts</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.25rem' }}>
            {[
              { label: 'Reading MNIST dataset (42,000 images × 784 px)...', done: true },
              { label: 'Generating sequential single-thread baseline...', done: true },
              { label: `Executing OpenMP parallel reduction across ${pageState.threads} threads...`, done: true },
              { label: 'Comparing all 256 bins for zero-discrepancy validation...', done: true },
              { label: 'Writing CSV outputs & returning execution metrics...', done: false },
            ].map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: st.done ? 'var(--text-secondary)' : 'var(--yellow)' }}>
                <span style={{ color: st.done ? 'var(--green)' : 'var(--yellow)', fontWeight: 700 }}>
                  {st.done ? '✓' : '⏳'}
                </span>
                <span>{st.label}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Computation in progress on real CPU cores via WSL2 C++ executable.
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. SPOTLIGHT & COACH-MARK TOOLTIP
  // ───────────────────────────────────────────────────────────────────────────

  // Validation rules for current step
  const isEightThreads = pageState.threads === 8;
  const isStep3 = currentStep.id === 'select-threads';
  const isStep4 = currentStep.id === 'run-engine';
  const isStep5 = currentStep.id === 'results-summary';
  const isStep6 = currentStep.id === 'sequential-view';
  const isStep7 = currentStep.id === 'parallel-view';
  const isStep8 = currentStep.id === 'both-view';

  // Can the user click next?
  let canProceed = true;
  let validationWarning = null;

  if (isStep3 && !isEightThreads) {
    canProceed = false;
    validationWarning = 'Please select 8 threads to continue.';
  } else if (isStep4) {
    if (!pageState.runResult && !pageState.running) {
      canProceed = false;
      validationWarning = 'Click "Run C++ Engine" to execute the OpenMP computation.';
    }
  }

  const runRes = pageState.runResult;

  return (
    <>
      {/* 4-Box Cutout Backdrop — leaves target element completely interactive! */}
      {targetRect && (
        <>
          {/* Top backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, targetRect.top - 6),
              ...styles.backdropPiece,
            }}
          />
          {/* Bottom backdrop */}
          <div
            style={{
              position: 'fixed',
              top: targetRect.bottom + 6,
              left: 0,
              right: 0,
              bottom: 0,
              ...styles.backdropPiece,
            }}
          />
          {/* Left backdrop */}
          <div
            style={{
              position: 'fixed',
              top: Math.max(0, targetRect.top - 6),
              left: 0,
              width: Math.max(0, targetRect.left - 6),
              height: targetRect.height + 12,
              ...styles.backdropPiece,
            }}
          />
          {/* Right backdrop */}
          <div
            style={{
              position: 'fixed',
              top: Math.max(0, targetRect.top - 6),
              left: targetRect.right + 6,
              right: 0,
              height: targetRect.height + 12,
              ...styles.backdropPiece,
            }}
          />

          {/* Glowing Animated Ring around target element */}
          <div
            style={{
              position: 'fixed',
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              borderRadius: 8,
              border: '2px solid #3b82f6',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.75)',
              pointerEvents: 'none',
              zIndex: 9995,
              animation: 'tour-pulse-ring 2s infinite',
            }}
          />
        </>
      )}

      {/* If no target element found yet, show fallback dark backdrop */}
      {!targetRect && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            ...styles.backdropPiece,
          }}
        />
      )}

      {/* Floating Coach-Mark Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: targetRect ? tooltipPos.top : '25%',
          left: targetRect ? tooltipPos.left : 'calc(50% - 220px)',
          width: 440,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 14,
          padding: '1.25rem 1.4rem',
          zIndex: 10000,
          pointerEvents: 'auto',
          transition: 'top 0.2s ease, left 0.2s ease',
        }}
      >
        {/* Tooltip Header: Step indicator + Skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: 999,
              letterSpacing: '0.04em',
            }}>
              Step {currentStep.stepNumber} of {totalSteps}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {currentStep.subtitle}
            </span>
          </div>
          <button
            onClick={skipTour}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.75rem',
            }}
            title="Skip guided tour"
          >
            Skip <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 3, background: 'var(--bg-secondary)', borderRadius: 2, marginBottom: '0.85rem', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(currentStep.stepNumber / totalSteps) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #22c55e)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {currentStep.title}
        </h3>

        {/* Message body */}
        <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '0.9rem' }}>
          {currentStep.message}
        </div>

        {/* Validation or status callout */}
        {validationWarning && (
          <div style={{
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: 8,
            padding: '0.55rem 0.85rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.8rem',
            color: '#fbbf24',
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{validationWarning}</span>
          </div>
        )}

        {isStep3 && isEightThreads && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 8,
            padding: '0.55rem 0.85rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.8rem',
            color: 'var(--green)',
          }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <span>✓ 8 threads selected! Ready to proceed.</span>
          </div>
        )}

        {/* Real results card for Step 5 */}
        {isStep5 && runRes && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.75rem 0.9rem',
            marginBottom: '0.9rem',
            fontSize: '0.8rem',
          }}>
            <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> Computation Verified via Backend API:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', color: 'var(--text-secondary)' }}>
              <div>Sequential: <strong style={{ color: 'var(--text-primary)' }}>{runRes.sequentialMs?.toFixed(3)} ms</strong></div>
              <div>Parallel ({runRes.threads || 8}T): <strong style={{ color: 'var(--text-primary)' }}>{runRes.parallelMs?.toFixed(3)} ms</strong></div>
              <div>Speedup: <strong style={{ color: 'var(--cyan)' }}>{runRes.speedup?.toFixed(2)}×</strong></div>
              <div>Efficiency: <strong style={{ color: 'var(--yellow)' }}>{runRes.efficiency?.toFixed(1)}%</strong></div>
            </div>
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', color: runRes.correctness ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
              Correctness: {runRes.correctness ? 'PASS — all 256 bins match exactly' : 'FAIL'}
            </div>
          </div>
        )}

        {/* Interactive Mode highlights for Step 6, 7, 8 */}
        {isStep6 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-light)', marginBottom: '0.75rem' }}>
            Current view: <strong style={{ color: 'var(--text-primary)' }}>{pageState.mode}</strong> (Click Sequential button or click Next)
          </div>
        )}
        {isStep7 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: '0.75rem' }}>
            Current view: <strong style={{ color: 'var(--text-primary)' }}>{pageState.mode}</strong> (Click Parallel button or click Next)
          </div>
        )}
        {isStep8 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--purple)', marginBottom: '0.75rem' }}>
            Current view: <strong style={{ color: 'var(--text-primary)' }}>{pageState.mode}</strong> (Click Both button or click Next)
          </div>
        )}

        {/* Action Buttons: Back + Next */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={prevStep}
            disabled={currentStepIdx === 0}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            <ChevronLeft size={14} /> Back
          </button>

          <button
            className="btn btn-primary"
            onClick={nextStep}
            disabled={!canProceed}
            style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem', fontWeight: 600 }}
          >
            {currentStep.nextButtonText || 'Next'} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(7, 10, 20, 0.82)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10005,
    padding: '1.5rem',
  },
  welcomeCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '2rem',
    maxWidth: 520,
    width: '100%',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    overflow: 'hidden',
  },
  welcomeIconHeader: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  welcomeIconBubble: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 25px rgba(59, 130, 246, 0.5)',
  },
  backdropPiece: {
    background: 'rgba(7, 11, 22, 0.78)',
    backdropFilter: 'blur(1.5px)',
    pointerEvents: 'auto',
    zIndex: 9990,
  },
};
