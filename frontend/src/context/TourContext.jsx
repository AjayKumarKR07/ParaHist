// TourContext.jsx — First-Time User Guided Tour State Management
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const TourContext = createContext(null);

export const STORAGE_KEY = 'parahist_tour_completed';

// Steps definition:
// 0: Welcome Modal (if not completed previously)
// 1: Dashboard overview (route: /)
// 2: Histogram page intro (route: /histogram)
// 3: Select threads (target: #thread-select)
// 4: Run C++ Engine (target: #run-engine-btn)
// 5: Computation Results (target: #run-result-banner)
// 6: Sequential mode (target: #mode-btn-sequential)
// 7: Parallel mode (target: #mode-btn-parallel)
// 8: Both mode (target: #mode-btn-both)
// 9: Hover / compare bins (target: #histogram-chart-card)
// 10: Verify correctness (target: #correctness-section)
// 11: Performance analysis (route: /performance, target: #performance-table-card)
// 12: Final conclusion modal

export const TOUR_STEPS = [
  {
    id: 'dashboard',
    stepNumber: 1,
    title: 'Step 1 — Start Here',
    subtitle: 'Dashboard Overview',
    message: 'This dashboard gives you an overview of the dataset and the current histogram/performance results.\n\nNext, open the Histogram page to run the actual computation.',
    route: '/dashboard',
    targetId: 'dashboard-header',
    nextButtonText: 'Next → Histogram',
  },
  {
    id: 'histogram-intro',
    stepNumber: 2,
    title: 'Step 2 — Generate the Histogram',
    subtitle: 'Histogram Workspace',
    message: 'This page lets you generate and compare sequential and parallel histograms.\n\nFirst, choose the number of OpenMP threads.',
    route: '/histogram',
    targetId: 'histogram-header',
    nextButtonText: 'Next → Select Threads',
  },
  {
    id: 'select-threads',
    stepNumber: 3,
    title: 'Step 3 — Select Threads',
    subtitle: 'OpenMP Thread Configuration',
    message: 'Choose how many OpenMP threads should be used for the parallel computation.\n\nAvailable:\n1, 2, 4, 8, 16\n\nFor this demonstration, select 8 threads.',
    route: '/histogram',
    targetId: 'thread-select',
    nextButtonText: 'Next → Run C++ Engine',
    requiresEightThreads: true,
  },
  {
    id: 'run-engine',
    stepNumber: 4,
    title: 'Step 4 — Start the Computation',
    subtitle: 'Invoke C++17 + OpenMP Engine',
    message: 'Click Run C++ Engine.\n\nThis will execute the actual C++17 + OpenMP histogram program using the selected number of threads.',
    route: '/histogram',
    targetId: 'run-engine-btn',
    nextButtonText: 'Waiting for computation...',
    interactiveRun: true,
  },
  {
    id: 'results-summary',
    stepNumber: 5,
    title: 'Step 5 — Computation Results',
    subtitle: 'Real Backend Metrics',
    message: 'The computation is complete.\n\nThe system has generated:\n• Sequential histogram\n• Parallel histogram\n• Execution times\n• Speedup\n• Efficiency\n• Correctness validation',
    route: '/histogram',
    targetId: 'run-result-banner',
    nextButtonText: 'Next → Sequential',
  },
  {
    id: 'sequential-view',
    stepNumber: 6,
    title: 'Step 6 — Sequential Histogram',
    subtitle: 'Single-Threaded Baseline',
    message: 'Click Sequential.\n\nThis displays the histogram calculated using the sequential implementation.\n\nThe dataset is processed using a single execution thread.',
    route: '/histogram',
    targetId: 'mode-btn-sequential',
    nextButtonText: 'Next → Parallel',
    requiresMode: 'sequential',
  },
  {
    id: 'parallel-view',
    stepNumber: 7,
    title: 'Step 7 — Parallel Histogram',
    subtitle: 'OpenMP Multi-Threaded Processing',
    message: 'Click Parallel.\n\nThis displays the histogram calculated using OpenMP.\n\nThe workload is divided among the selected threads.\n\nEach thread maintains its own local 256-bin histogram, which is merged after processing.',
    route: '/histogram',
    targetId: 'mode-btn-parallel',
    nextButtonText: 'Next → Both',
    requiresMode: 'parallel',
  },
  {
    id: 'both-view',
    stepNumber: 8,
    title: 'Step 8 — Compare Both Results',
    subtitle: 'Simultaneous Overlay',
    message: 'Click Both.\n\nThe application now displays the sequential and parallel histograms together.\n\nBlue = Sequential\nGreen = Parallel\n\nIf the algorithms are correct, both distributions should match.',
    route: '/histogram',
    targetId: 'mode-btn-both',
    nextButtonText: 'Next → Compare Bins',
    requiresMode: 'both',
  },
  {
    id: 'hover-bins',
    stepNumber: 9,
    title: 'Step 9 — Compare Individual Bins',
    subtitle: '256-Bin Interactive Inspection',
    message: 'Move your mouse over any histogram bar.\n\nThe tooltip shows the frequency calculated by both implementations.\n\nExample tooltip:\nPixel Value: 70\nSequential: 13,542\nParallel: 13,542\nMatch: ✓',
    route: '/histogram',
    targetId: 'histogram-chart-card',
    nextButtonText: 'Next → Verify Correctness',
  },
  {
    id: 'verify-correctness',
    stepNumber: 10,
    title: 'Step 10 — Verify Correctness',
    subtitle: 'Bin-by-Bin Equivalence',
    message: 'The application compares all 256 histogram bins.\n\nIf:\nSequential[i] == Parallel[i]\nfor every i from 0 to 255,\n\nthe result is PASS.\n\nThis proves that parallelization did not change the computation result.\n\nSequential total = 32,928,000\nParallel total = 32,928,000',
    route: '/histogram',
    targetId: 'correctness-section',
    nextButtonText: 'Next → Performance',
  },
  {
    id: 'performance',
    stepNumber: 11,
    title: 'Step 11 — Measure Parallel Performance',
    subtitle: 'Scalability & Efficiency',
    message: 'Now open Performance.\n\nHere you can see how execution time changes as the number of threads increases (1, 2, 4, 8, 16 threads), along with Execution Time, Speedup, and Efficiency.',
    route: '/performance',
    targetId: 'performance-table-card',
    nextButtonText: 'Complete Tour →',
  },
];

export function TourProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFinal, setShowFinal]     = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [tourRequestedMode, setTourRequestedMode] = useState(null);

  // Live state communicated from pages (e.g. Histogram page)
  const [pageState, setPageState] = useState({
    threads: 8,
    running: false,
    runResult: null,
    error: null,
    mode: 'sequential',
    hasHistogramData: false,
  });

  // Only check and show welcome tour when user is authenticated in the portal
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWelcome(false);
      setIsTourActive(false);
      return;
    }

    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed && (location.pathname === '/dashboard' || location.pathname === '/histogram')) {
        setShowWelcome(true);
      }
    } catch (e) {
      console.warn('Storage check failed', e);
    }
    setHasCheckedStorage(true);
  }, [isAuthenticated, location.pathname]);

  // When step changes, ensure route is aligned
  const currentStep = isTourActive ? TOUR_STEPS[currentStepIdx] : null;

  useEffect(() => {
    if (isTourActive && currentStep) {
      if (location.pathname !== currentStep.route) {
        navigate(currentStep.route);
      }
      if (currentStep.requiresMode) {
        setTourRequestedMode(currentStep.requiresMode);
      }
    }
  }, [isTourActive, currentStepIdx, currentStep, location.pathname, navigate]);

  // Start Tour
  const startTour = useCallback(() => {
    setShowWelcome(false);
    setShowFinal(false);
    setIsTourActive(true);
    setCurrentStepIdx(0);
    navigate('/dashboard');
  }, [navigate]);

  // Skip Tour
  const skipTour = useCallback(() => {
    setShowWelcome(false);
    setShowFinal(false);
    setIsTourActive(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {}
  }, []);

  // Replay Tour (from any page button)
  const replayTour = useCallback(() => {
    setShowWelcome(false);
    setShowFinal(false);
    setIsTourActive(true);
    setCurrentStepIdx(0);
    navigate('/dashboard');
  }, [navigate]);

  // Finish Tour (from Final Modal)
  const finishTour = useCallback(() => {
    setShowFinal(false);
    setIsTourActive(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {}
  }, []);

  // Next step
  const nextStep = useCallback(() => {
    if (!isTourActive) return;

    if (currentStepIdx + 1 < TOUR_STEPS.length) {
      const nextIdx = currentStepIdx + 1;
      const targetStep = TOUR_STEPS[nextIdx];
      setCurrentStepIdx(nextIdx);
      if (location.pathname !== targetStep.route) {
        navigate(targetStep.route);
      }
    } else {
      // Reached the end -> Show final conclusion overlay
      setIsTourActive(false);
      setShowFinal(true);
    }
  }, [isTourActive, currentStepIdx, location.pathname, navigate]);

  // Prev step
  const prevStep = useCallback(() => {
    if (!isTourActive || currentStepIdx <= 0) return;
    const prevIdx = currentStepIdx - 1;
    const targetStep = TOUR_STEPS[prevIdx];
    setCurrentStepIdx(prevIdx);
    if (location.pathname !== targetStep.route) {
      navigate(targetStep.route);
    }
  }, [isTourActive, currentStepIdx, location.pathname, navigate]);

  // Update state reported by active page
  const updatePageState = useCallback((updates) => {
    setPageState(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-advance triggers for interactive steps:
  // When running C++ engine finishes in Step 4, automatically advance to Step 5 (Results)
  useEffect(() => {
    if (isTourActive && currentStep?.id === 'run-engine') {
      if (!pageState.running && pageState.runResult && !pageState.error) {
        // Automatically advance to results summary
        const timer = setTimeout(() => {
          nextStep();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isTourActive, currentStep, pageState.running, pageState.runResult, pageState.error, nextStep]);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStepIdx,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        showWelcome,
        showFinal,
        pageState,
        hasCheckedStorage,
        tourRequestedMode,
        startTour,
        skipTour,
        replayTour,
        finishTour,
        nextStep,
        prevStep,
        updatePageState,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return ctx;
}
