/**
 * benchmark.cpp
 *
 * BenchmarkRunner implementation.
 *
 * Benchmark procedure per thread count T:
 *   1. [Warm-up] Run parallel histogram once — result discarded.
 *   2. For run r = 1..N_RUNS:
 *        a. Run parallel histogram with T threads → par_ms, par_result.
 *        b. Run sequential histogram              → seq_ms, seq_result.
 *        c. Validate par_result == seq_result (all 256 bins). ABORT on mismatch.
 *        d. Record PerRunRecord(T, r, seq_ms, par_ms, speedup, efficiency).
 *   3. Compute summary statistics over the N_RUNS parallel times.
 *   4. Use the average sequential time over ALL N_RUNS (all thread counts) as
 *      the consistent speedup baseline.
 *
 * Sequential baseline measurement:
 *   The sequential histogram is re-measured on every run alongside the parallel
 *   run so that both measurements reflect the same system conditions.
 *   The per-thread-count speedup uses the *average* sequential time from the
 *   dedicated baseline measurement phase for consistency.
 */

#include "benchmark.h"

#include <iostream>
#include <iomanip>
#include <fstream>
#include <numeric>
#include <cmath>
#include <stdexcept>
#include <filesystem>
#include <algorithm>

namespace fs = std::filesystem;

// ── Constructor ───────────────────────────────────────────────────────────────

BenchmarkRunner::BenchmarkRunner(const BenchmarkConfig& config)
    : config_(config) {}

// ── Private helpers ───────────────────────────────────────────────────────────

double BenchmarkRunner::run_sequential(const std::vector<MnistRow>& rows,
                                       HistogramResult& out)
{
    out = SequentialHistogram::compute(rows);
    return out.elapsed_ms;
}

double BenchmarkRunner::run_parallel(const std::vector<MnistRow>& rows,
                                     int num_threads,
                                     HistogramResult& out)
{
    out = ParallelHistogram::compute(rows, num_threads);
    return out.elapsed_ms;
}

bool BenchmarkRunner::validate(const HistogramResult& seq,
                                const HistogramResult& par,
                                int threads, int run)
{
    bool pass = true;
    for (int b = 0; b < HIST_BINS; ++b) {
        if (seq.counts[b] != par.counts[b]) {
            if (pass) {
                std::cerr << "\n[FAIL] Histogram mismatch! threads=" << threads
                          << " run=" << run << "\n"
                          << std::setw(6)  << "Bin"
                          << std::setw(18) << "Sequential"
                          << std::setw(18) << "Parallel" << "\n";
                pass = false;
            }
            std::cerr << std::setw(6)  << b
                      << std::setw(18) << seq.counts[b]
                      << std::setw(18) << par.counts[b] << "\n";
        }
    }
    return pass;
}

double BenchmarkRunner::stddev(const std::vector<double>& values, double mean)
{
    if (values.size() <= 1) return 0.0;
    double sq_sum = 0.0;
    for (double v : values) {
        double d = v - mean;
        sq_sum += d * d;
    }
    return std::sqrt(sq_sum / static_cast<double>(values.size() - 1));
}

// ── run ───────────────────────────────────────────────────────────────────────

std::vector<SummaryRecord> BenchmarkRunner::run(
    const std::vector<MnistRow>& rows,
    const std::vector<int>&      thread_counts,
    std::vector<PerRunRecord>&   per_run_out)
{
    per_run_out.clear();
    const int N = config_.n_runs;

    // ── Phase A: Measure sequential baseline ─────────────────────────────────
    std::cout << "\n── Sequential Baseline (" << N << " runs";
    if (config_.do_warmup) std::cout << " + 1 warm-up";
    std::cout << ") ──────────────────────────\n";

    if (config_.do_warmup) {
        HistogramResult dummy;
        run_sequential(rows, dummy);
        std::cout << "  warm-up: done (discarded)\n";
    }

    std::vector<double> seq_times;
    seq_times.reserve(N);
    HistogramResult seq_reference;

    for (int r = 0; r < N; ++r) {
        HistogramResult seq_out;
        double ms = run_sequential(rows, seq_out);
        seq_times.push_back(ms);
        if (r == 0) seq_reference = seq_out;
        std::cout << "  run " << (r + 1) << "/" << N
                  << ": " << std::fixed << std::setprecision(3) << ms << " ms\n";
    }

    double seq_avg = std::accumulate(seq_times.begin(), seq_times.end(), 0.0) / N;
    double seq_min = *std::min_element(seq_times.begin(), seq_times.end());
    double seq_max = *std::max_element(seq_times.begin(), seq_times.end());
    double seq_sd  = stddev(seq_times, seq_avg);

    std::cout << std::fixed << std::setprecision(3)
              << "  Baseline → avg=" << seq_avg
              << " ms  min=" << seq_min
              << " ms  max=" << seq_max
              << " ms  stddev=" << seq_sd << " ms\n";

    // ── Phase B: Parallel benchmarks ─────────────────────────────────────────
    std::vector<SummaryRecord> summaries;

    for (int tc : thread_counts) {
        std::cout << "\n── Threads = " << tc << " (" << N << " runs";
        if (config_.do_warmup) std::cout << " + 1 warm-up";
        std::cout << ") ──────────────────────────────\n";

        // Warm-up
        if (config_.do_warmup) {
            HistogramResult dummy;
            run_parallel(rows, tc, dummy);
            std::cout << "  warm-up: done (discarded)\n";
        }

        std::vector<double> par_times;
        par_times.reserve(N);

        for (int r = 1; r <= N; ++r) {
            // Run parallel
            HistogramResult par_out;
            double par_ms = run_parallel(rows, tc, par_out);

            // Run sequential alongside (for per-run record)
            HistogramResult seq_run_out;
            double seq_run_ms = run_sequential(rows, seq_run_out);

            // Validate correctness against the established reference
            if (!validate(seq_reference, par_out, tc, r)) {
                std::cerr << "[FATAL] Correctness failure at threads=" << tc
                          << " run=" << r << ". Aborting benchmark.\n";
                throw std::runtime_error("Histogram correctness failure");
            }

            par_times.push_back(par_ms);

            double speedup_run    = seq_run_ms / par_ms;
            double efficiency_run = (speedup_run / static_cast<double>(tc)) * 100.0;

            per_run_out.push_back({tc, r, seq_run_ms, par_ms,
                                   speedup_run, efficiency_run});

            std::cout << "  run " << r << "/" << N
                      << ": par=" << std::fixed << std::setprecision(3) << par_ms
                      << " ms  seq=" << seq_run_ms
                      << " ms  speedup=" << std::setprecision(2) << speedup_run
                      << "x  [PASS]\n";
        }

        // Summary statistics for this thread count
        double par_avg = std::accumulate(par_times.begin(), par_times.end(), 0.0) / N;
        double par_min = *std::min_element(par_times.begin(), par_times.end());
        double par_max = *std::max_element(par_times.begin(), par_times.end());
        double par_sd  = stddev(par_times, par_avg);

        // Speedup uses the consistent sequential baseline (not per-run seq)
        double speedup    = seq_avg / par_avg;
        double efficiency = (speedup / static_cast<double>(tc)) * 100.0;

        summaries.push_back({tc, par_avg, par_min, par_max, par_sd,
                             seq_avg, speedup, efficiency});

        std::cout << std::fixed << std::setprecision(3)
                  << "  Summary → avg=" << par_avg
                  << " ms  min=" << par_min
                  << " ms  max=" << par_max
                  << " ms  stddev=" << par_sd
                  << std::setprecision(2)
                  << " ms  speedup=" << speedup
                  << "x  efficiency=" << efficiency << "%\n";
    }

    return summaries;
}

// ── print_table ───────────────────────────────────────────────────────────────

void BenchmarkRunner::print_table(const std::vector<SummaryRecord>& summaries,
                                   int logical_cpus)
{
    std::cout << "\n"
              << "╔══════════════════════════════════════════════════════════════════════════════╗\n"
              << "║                   ParaHist — Performance Benchmark Results                  ║\n"
              << "╠══════════════════════════════════════════════════════════════════════════════╣\n";

    if (!summaries.empty()) {
        std::cout << "║  Sequential baseline (avg, 5 runs): "
                  << std::fixed << std::setprecision(3)
                  << std::setw(10) << summaries[0].avg_sequential_ms
                  << " ms                              ║\n";
    }

    std::cout << "║  Logical CPUs: " << std::setw(2) << logical_cpus
              << "  |  Runs per thread count: 5  |  1 warm-up discarded            ║\n"
              << "╠═════════╦═══════════════╦═══════════════╦══════════════╦══════════╦═══════════╣\n"
              << "║ Threads ║  Avg Par (ms) ║  Min Par (ms) ║ Max Par (ms) ║  Speedup ║Efficiency ║\n"
              << "╠═════════╬═══════════════╬═══════════════╬══════════════╬══════════╬═══════════╣\n";

    for (const auto& s : summaries) {
        std::cout << std::fixed
                  << "║" << std::setw(9)  << s.threads
                  << "║" << std::setw(15) << std::setprecision(3) << s.avg_parallel_ms
                  << "║" << std::setw(15) << std::setprecision(3) << s.min_parallel_ms
                  << "║" << std::setw(14) << std::setprecision(3) << s.max_parallel_ms
                  << "║" << std::setw(8)  << std::setprecision(2) << s.speedup << "x "
                  << "║" << std::setw(9)  << std::setprecision(2) << s.efficiency << "% ║\n";
    }

    std::cout << "╚═════════╩═══════════════╩═══════════════╩══════════════╩══════════╩═══════════╝\n";
    std::cout << "\n  Histogram correctness: PASS (all thread counts, all runs)\n\n";
}

// ── save_csv ──────────────────────────────────────────────────────────────────

void BenchmarkRunner::save_csv(const std::vector<PerRunRecord>&  per_run,
                                const std::vector<SummaryRecord>& summaries,
                                const std::string&                results_dir)
{
    fs::create_directories(results_dir);

    // benchmark_results.csv — one row per (threads × run)
    {
        std::string path = results_dir + "/benchmark_results.csv";
        std::ofstream f(path);
        if (!f.is_open()) throw std::runtime_error("Cannot write: " + path);

        f << "threads,run,sequential_ms,parallel_ms,speedup,efficiency\n"
          << std::fixed;
        for (const auto& r : per_run) {
            f << r.threads << ","
              << r.run     << ","
              << std::setprecision(6) << r.sequential_ms << ","
              << std::setprecision(6) << r.parallel_ms   << ","
              << std::setprecision(6) << r.speedup       << ","
              << std::setprecision(6) << r.efficiency    << "\n";
        }
        std::cout << "  Saved: " << path << " (" << per_run.size() << " data rows)\n";
    }

    // benchmark_summary.csv — one row per thread count
    {
        std::string path = results_dir + "/benchmark_summary.csv";
        std::ofstream f(path);
        if (!f.is_open()) throw std::runtime_error("Cannot write: " + path);

        f << "threads,avg_sequential_ms,avg_parallel_ms,min_parallel_ms,"
             "max_parallel_ms,stddev_parallel_ms,speedup,efficiency\n"
          << std::fixed;
        for (const auto& s : summaries) {
            f << s.threads << ","
              << std::setprecision(6) << s.avg_sequential_ms  << ","
              << std::setprecision(6) << s.avg_parallel_ms    << ","
              << std::setprecision(6) << s.min_parallel_ms    << ","
              << std::setprecision(6) << s.max_parallel_ms    << ","
              << std::setprecision(6) << s.stddev_parallel_ms << ","
              << std::setprecision(6) << s.speedup            << ","
              << std::setprecision(6) << s.efficiency         << "\n";
        }
        std::cout << "  Saved: " << path << " (" << summaries.size() << " data rows)\n";
    }
}
