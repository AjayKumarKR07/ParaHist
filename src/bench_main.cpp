/**
 * bench_main.cpp  —  ParaHist Benchmark Entry Point
 *
 * Usage:
 *   parabench <path/to/train.csv> [max_threads]
 *
 * Example:
 *   parabench dataset/train.csv 16
 *
 * Benchmarks thread counts: 1, 2, 4, 8 (and 16 if logical CPUs >= 16).
 * Each count: 1 warm-up (discarded) + 5 timed runs.
 * Correctness validated every single run (256 bins vs sequential reference).
 * Results saved: results/benchmark_results.csv + results/benchmark_summary.csv.
 */

#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <stdexcept>
#include <thread>

#include <omp.h>

#include "csv_reader.h"
#include "benchmark.h"

// ── Detect logical CPU count ──────────────────────────────────────────────────
static int logical_cpu_count()
{
    unsigned int n = std::thread::hardware_concurrency();
    if (n == 0) n = static_cast<unsigned int>(omp_get_max_threads());
    return static_cast<int>(n);
}

// ── Build thread count list ───────────────────────────────────────────────────
static std::vector<int> build_thread_counts(int logical_cpus, int user_max)
{
    std::vector<int> candidates = {1, 2, 4, 8};

    if (logical_cpus >= 16) {
        candidates.push_back(16);
    } else {
        std::cout << "  Note: skipping 16-thread test (machine has "
                  << logical_cpus << " logical CPUs)\n";
    }

    if (user_max > 0) {
        std::vector<int> capped;
        for (int tc : candidates)
            if (tc <= user_max) capped.push_back(tc);
        return capped;
    }
    return candidates;
}

// ── Main ──────────────────────────────────────────────────────────────────────

int main(int argc, char* argv[])
{
    std::cout << "\n"
              << "╔══════════════════════════════════════════════════════════════╗\n"
              << "║         ParaHist — Performance Benchmark Suite              ║\n"
              << "║     Parallel Histogram Generation Using OpenMP              ║\n"
              << "╚══════════════════════════════════════════════════════════════╝\n\n";

    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <path/to/train.csv> [max_threads]\n"
                  << "Example: " << argv[0] << " dataset/train.csv 16\n";
        return 1;
    }

    const std::string csv_path = argv[1];
    int user_max = 0;
    if (argc >= 3) {
        try { user_max = std::stoi(argv[2]); } catch (...) {}
    }

    // ── System info ───────────────────────────────────────────────────────────
    int logical_cpus = logical_cpu_count();
    int omp_max      = omp_get_max_threads();

    std::cout << "=== System Information ===\n"
              << "  CPU               : 12th Gen Intel Core i7-12650HX\n"
              << "  Logical CPUs      : " << logical_cpus << "\n"
              << "  OMP max threads   : " << omp_max      << "\n"
              << "  Compiler          : GCC " << __VERSION__ << "\n"
              << "  OpenMP version    : " << _OPENMP
              << " (" << (_OPENMP / 100) << " = OpenMP " << (_OPENMP / 100 / 10)
              << "." << (_OPENMP / 100 % 10) << ")\n"
              << "  C++ standard      : C++"
              << (__cplusplus / 100 % 100) << "\n\n";

    // ── Load dataset ──────────────────────────────────────────────────────────
    std::cout << "=== Dataset ===\n"
              << "  File              : " << csv_path << "\n";

    std::vector<MnistRow> rows;
    try {
        CsvReader reader(csv_path);
        rows = reader.rows();
    } catch (const std::exception& e) {
        std::cerr << "Error loading dataset: " << e.what() << "\n";
        return 1;
    }

    long long total_pixels = static_cast<long long>(rows.size()) * NUM_PIXELS;
    std::cout << "  Rows              : " << rows.size()  << "\n"
              << "  Pixels per image  : " << NUM_PIXELS   << "\n"
              << "  Total pixels      : " << total_pixels << "\n"
              << "  Histogram bins    : " << HIST_BINS    << "\n"
              << "  In-memory size    : "
              << std::fixed << std::setprecision(1)
              << (rows.size() * sizeof(MnistRow)) / (1024.0 * 1024.0) << " MB\n\n";

    // ── Benchmark config ──────────────────────────────────────────────────────
    std::cout << "=== Benchmark Configuration ===\n";
    std::vector<int> thread_counts = build_thread_counts(logical_cpus, user_max);

    std::cout << "  Runs per count    : 5 (+ 1 warm-up, discarded)\n"
              << "  Thread counts     : ";
    for (int i = 0; i < (int)thread_counts.size(); ++i) {
        if (i) std::cout << ", ";
        std::cout << thread_counts[i];
    }
    std::cout << "\n"
              << "  Timing (seq)      : std::chrono::high_resolution_clock\n"
              << "  Timing (par)      : omp_get_wtime()\n"
              << "  Timed region      : histogram computation + merge only\n"
              << "  Correctness check : all 256 bins validated after every run\n\n";

    // ── Run benchmark ─────────────────────────────────────────────────────────
    BenchmarkConfig cfg;
    cfg.n_runs      = 5;
    cfg.do_warmup   = true;
    cfg.results_dir = "results";

    BenchmarkRunner           runner(cfg);
    std::vector<PerRunRecord>  per_run;
    std::vector<SummaryRecord> summaries;

    try {
        summaries = runner.run(rows, thread_counts, per_run);
    } catch (const std::exception& e) {
        std::cerr << "\n[FATAL] Benchmark aborted: " << e.what() << "\n";
        return 1;
    }

    // ── Print results table ───────────────────────────────────────────────────
    BenchmarkRunner::print_table(summaries, logical_cpus);

    // ── Save CSVs ─────────────────────────────────────────────────────────────
    std::cout << "=== Saving Results ===\n";
    try {
        BenchmarkRunner::save_csv(per_run, summaries, cfg.results_dir);
    } catch (const std::exception& e) {
        std::cerr << "Warning: could not save CSV: " << e.what() << "\n";
    }

    std::cout << "\nPhase 3 benchmark complete. Ready for Phase 4 graph generation.\n\n";
    return 0;
}
