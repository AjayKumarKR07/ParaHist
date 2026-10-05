/**
 * parallel_histogram.cpp
 *
 * OpenMP-accelerated pixel intensity histogram using thread-local reduction.
 *
 * ── Algorithm ──────────────────────────────────────────────────────────────────
 *
 * 1. Query the number of threads to use (omp_get_max_threads() if not specified).
 *
 * 2. Allocate a 2-D structure: local_hists[num_threads][HIST_BINS].
 *    Each thread gets its own dedicated 256-bin array, zero-initialised.
 *    Allocating separately per thread avoids false sharing on the L1/L2 cache.
 *
 * 3. Enter the parallel region:
 *      #pragma omp parallel num_threads(nthreads)
 *      {
 *          int tid = omp_get_thread_num();
 *          auto& local = local_hists[tid];   // thread-private reference
 *
 *          #pragma omp for schedule(static)
 *          for i in [0, rows.size()):
 *              for each pixel px in rows[i].pixels:
 *                  local[px]++;              // write only to private array
 *      }
 *    No atomic, no critical, no locks — zero contention.
 *
 * 4. Serially merge local_hists into the final result.counts[]:
 *      for each thread t:
 *          for b in [0, 256):
 *              result.counts[b] += local_hists[t][b];
 *
 * 5. The timed region covers steps 3 + 4 (parallel compute + merge).
 *    Dataset loading, printing, and file I/O are outside the timed region.
 *
 * ── Race condition analysis ────────────────────────────────────────────────────
 *
 * During the parallel region:
 *   - Each thread exclusively writes to local_hists[tid][].
 *   - No two threads share an index in local_hists (tid is unique per thread).
 *   - rows[] is read-only — no write contention.
 *   => No data races possible.
 *
 * During the merge:
 *   - Executes serially on the master thread after all threads have joined.
 *   => No data races possible.
 */

#include "parallel_histogram.h"

#include <omp.h>
#include <vector>
#include <array>

HistogramResult ParallelHistogram::compute(const std::vector<MnistRow>& rows,
                                            int num_threads)
{
    // ── Determine thread count ────────────────────────────────────────────────
    int nthreads = (num_threads > 0) ? num_threads : omp_get_max_threads();

    // ── Allocate per-thread histograms ────────────────────────────────────────
    // Using a vector of arrays.  Each array is 256 x 8 bytes = 2 KB.
    // With up to 64 threads this is only 128 KB — negligible.
    // Placing them in a vector ensures they are on separate heap allocations,
    // reducing the chance of false sharing between adjacent thread arrays.
    using LocalHist = std::array<long long, HIST_BINS>;
    std::vector<LocalHist> local_hists(nthreads);
    for (auto& h : local_hists) h.fill(0LL);

    const std::size_t n_rows = rows.size();

    // ── Start timer ───────────────────────────────────────────────────────────
    // omp_get_wtime() returns a wall-clock time in seconds (high resolution).
    double t_start = omp_get_wtime();

    // ── Parallel histogram computation ────────────────────────────────────────
    #pragma omp parallel num_threads(nthreads)
    {
        int tid = omp_get_thread_num();
        LocalHist& local = local_hists[tid];

        // Distribute rows statically (equal-size chunks per thread).
        // schedule(static) is ideal here: each row costs the same (784 pixels),
        // so equal chunk sizes give perfect load balance.
        #pragma omp for schedule(static)
        for (std::size_t i = 0; i < n_rows; ++i) {
            for (const uint8_t px : rows[i].pixels) {
                local[px]++;
            }
        }
    } // implicit barrier: all threads join here before merge

    // ── Merge thread-local histograms ─────────────────────────────────────────
    // Serial merge — runs on master thread only.
    // Cost: HIST_BINS * nthreads = 256 * nthreads iterations (~negligible).
    HistogramResult result;
    result.counts.fill(0LL);

    for (int t = 0; t < nthreads; ++t) {
        for (int b = 0; b < HIST_BINS; ++b) {
            result.counts[b] += local_hists[t][b];
        }
    }

    // ── Stop timer ────────────────────────────────────────────────────────────
    // Timer covers: parallel loop + merge.
    double t_end = omp_get_wtime();

    result.elapsed_ms = (t_end - t_start) * 1000.0;

    return result;
}
