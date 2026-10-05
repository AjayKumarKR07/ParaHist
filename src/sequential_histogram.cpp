/**
 * sequential_histogram.cpp
 *
 * Single-threaded pixel intensity histogram computation.
 *
 * Algorithm:
 *   1. Zero-initialise a 256-bin array.
 *   2. Iterate over every MnistRow.
 *   3. For each of the 784 pixels in the row, increment histogram[pixel_value].
 *
 * Timing:
 *   std::chrono::high_resolution_clock wraps ONLY the counting loop.
 *   Dataset loading, printing, and file I/O are NOT included in elapsed_ms.
 */

#include "sequential_histogram.h"

#include <chrono>

HistogramResult SequentialHistogram::compute(const std::vector<MnistRow>& rows)
{
    HistogramResult result;
    result.counts.fill(0LL);

    // ── Start timer ───────────────────────────────────────────────────────────
    auto t_start = std::chrono::high_resolution_clock::now();

    // ── Histogram computation (single thread) ─────────────────────────────────
    // Outer loop: iterate over all 42,000 MNIST image rows.
    // Inner loop: iterate over all 784 pixel values per image.
    // Each pixel value is in [0, 255] and directly indexes into counts[].
    for (const auto& row : rows) {
        for (const uint8_t px : row.pixels) {
            result.counts[px]++;
        }
    }

    // ── Stop timer ────────────────────────────────────────────────────────────
    auto t_end = std::chrono::high_resolution_clock::now();

    result.elapsed_ms =
        std::chrono::duration<double, std::milli>(t_end - t_start).count();

    return result;
}
