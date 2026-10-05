/**
 * sequential_histogram.h
 *
 * Declares the SequentialHistogram class that computes a pixel-intensity
 * histogram over all MNIST images using a single CPU thread.
 *
 * The histogram has 256 bins, one per intensity value [0, 255].
 * Each bin stores the count of all pixel occurrences with that intensity
 * across every row in the dataset.
 *
 * Timing:
 *   Only the histogram computation loop is timed.
 *   CSV loading, printing, and file I/O are excluded.
 *
 * Complexity: O(N * 784) where N = number of MNIST rows.
 */

#pragma once

#include "csv_reader.h"

#include <array>
#include <vector>

// ── HistogramResult ───────────────────────────────────────────────────────────

/// Returned by both sequential and parallel histogram computations.
struct HistogramResult {
    std::array<long long, HIST_BINS> counts{};  ///< Bin counts for values [0..255]
    double elapsed_ms{0.0};                      ///< Wall-clock time in milliseconds
};

// ── SequentialHistogram ───────────────────────────────────────────────────────

class SequentialHistogram {
public:
    /**
     * @brief  Compute the 256-bin intensity histogram sequentially.
     *
     * Times ONLY the counting loop using std::chrono::high_resolution_clock.
     * Does not include file I/O, printing, or result saving.
     *
     * @param  rows  Const reference to the loaded MNIST rows.
     * @return HistogramResult containing bin counts and elapsed_ms.
     */
    static HistogramResult compute(const std::vector<MnistRow>& rows);
};
