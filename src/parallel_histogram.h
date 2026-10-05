/**
 * parallel_histogram.h
 *
 * Declares the ParallelHistogram class that computes the same 256-bin
 * pixel-intensity histogram using OpenMP parallel directives.
 *
 * ── Parallelisation strategy: Thread-local histogram reduction ────────────────
 *
 * Each OpenMP thread owns a private 256-element array (local histogram).
 * The parallel loop assigns image rows to threads using static scheduling
 * (equal-size chunks), so each thread independently accumulates its own
 * partial histogram — NO shared mutable state during counting.
 *
 * After the parallel region, the master thread merges all local histograms
 * into the final result with a simple serial loop.
 *
 * Why this approach?
 *   - Avoids false sharing: each thread's array is a separate stack allocation.
 *   - No atomic operations or critical sections in the hot loop.
 *   - Merge is O(HIST_BINS * num_threads) = negligible cost.
 *   - Produces bit-identical results to the sequential implementation.
 *
 * Race condition avoidance:
 *   The only shared data after the parallel region is the merged result array,
 *   which is written serially. During the parallel region, every write goes
 *   to thread-private memory — no races possible.
 *
 * Timing:
 *   omp_get_wtime() wraps the parallel loop AND the merge step.
 *   Dataset loading, printing, and file I/O are excluded.
 */

#pragma once

#include "csv_reader.h"
#include "sequential_histogram.h"  // re-use HistogramResult

#include <vector>

// ── ParallelHistogram ─────────────────────────────────────────────────────────

class ParallelHistogram {
public:
    /**
     * @brief  Compute the 256-bin intensity histogram using OpenMP.
     *
     * Uses the thread-local histogram reduction strategy:
     *   1. Allocate one private 256-bin array per thread.
     *   2. Distribute rows across threads with #pragma omp for schedule(static).
     *   3. Each thread fills only its own private array — no shared writes.
     *   4. After the parallel section, merge all private arrays serially.
     *
     * Times the parallel computation + merge with omp_get_wtime().
     *
     * @param  rows         Const reference to the loaded MNIST rows.
     * @param  num_threads  Number of OpenMP threads (0 = use OMP_NUM_THREADS / hardware default).
     * @return HistogramResult with bin counts and elapsed_ms.
     */
    static HistogramResult compute(const std::vector<MnistRow>& rows,
                                   int num_threads = 0);
};
