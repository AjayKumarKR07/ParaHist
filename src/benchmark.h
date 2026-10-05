/**
 * benchmark.h
 *
 * Declares the BenchmarkRunner class for rigorous performance measurement
 * of the ParaHist sequential and parallel histogram implementations.
 *
 * Methodology:
 *   - One warm-up run before collecting measurements (discarded).
 *   - N_RUNS timed runs per thread count (default: 5).
 *   - Sequential baseline: average over N_RUNS independent measurements.
 *   - Parallel measured for each thread count: min, max, avg, stddev.
 *   - Correctness check after EVERY run (all 256 bins vs sequential reference).
 *   - Results exported to results/benchmark_results.csv (per-run detail)
 *     and results/benchmark_summary.csv (aggregated statistics).
 *
 * What is timed:
 *   Sequential: std::chrono::high_resolution_clock around the counting loop only.
 *   Parallel  : omp_get_wtime() around the parallel loop + merge step only.
 *   NOT timed : CSV loading, printing, file I/O, validation.
 */

#pragma once

#include "csv_reader.h"
#include "sequential_histogram.h"
#include "parallel_histogram.h"

#include <vector>
#include <string>

// ── BenchmarkConfig ───────────────────────────────────────────────────────────

struct BenchmarkConfig {
    int         n_runs      = 5;         ///< Timed runs per thread count (excl. warm-up)
    bool        do_warmup   = true;      ///< Perform one discarded warm-up run first
    std::string results_dir = "results"; ///< Output directory for CSV files
};

// ── PerRunRecord ──────────────────────────────────────────────────────────────

/// One timed run record — written to benchmark_results.csv
struct PerRunRecord {
    int    threads;
    int    run;           ///< 1-based run index
    double sequential_ms;
    double parallel_ms;
    double speedup;
    double efficiency;
};

// ── SummaryRecord ─────────────────────────────────────────────────────────────

/// Aggregated statistics — written to benchmark_summary.csv
struct SummaryRecord {
    int    threads;
    double avg_parallel_ms;
    double min_parallel_ms;
    double max_parallel_ms;
    double stddev_parallel_ms;
    double avg_sequential_ms;  ///< Consistent baseline for speedup
    double speedup;
    double efficiency;
};

// ── BenchmarkRunner ───────────────────────────────────────────────────────────

class BenchmarkRunner {
public:
    explicit BenchmarkRunner(const BenchmarkConfig& config = {});

    /**
     * @brief  Run the full benchmark suite.
     * @param  rows          Loaded MNIST rows (CSV already parsed).
     * @param  thread_counts Ordered list of thread counts to benchmark.
     * @param  per_run_out   Filled with one record per (thread_count × run).
     * @return Vector of SummaryRecord, one entry per thread count.
     */
    std::vector<SummaryRecord> run(const std::vector<MnistRow>& rows,
                                   const std::vector<int>&      thread_counts,
                                   std::vector<PerRunRecord>&   per_run_out);

    /// Print the formatted benchmark table to stdout.
    static void print_table(const std::vector<SummaryRecord>& summaries,
                             int logical_cpus);

    /// Save per-run and summary CSVs to the results directory.
    static void save_csv(const std::vector<PerRunRecord>&  per_run,
                         const std::vector<SummaryRecord>& summaries,
                         const std::string&                results_dir);

private:
    BenchmarkConfig config_;

    static double run_sequential(const std::vector<MnistRow>& rows,
                                 HistogramResult& out);

    static double run_parallel(const std::vector<MnistRow>& rows,
                               int num_threads,
                               HistogramResult& out);

    /// Compare all 256 bins; prints mismatches and returns false on failure.
    static bool validate(const HistogramResult& seq,
                         const HistogramResult& par,
                         int threads, int run);

    /// Population stddev of a vector (using N-1 denominator for sample stddev).
    static double stddev(const std::vector<double>& values, double mean);
};
