/**
 * main.cpp  —  ParaHist Entry Point
 *
 * ParaHist: Parallel Histogram Generation Using OpenMP
 * CS Mini-Project — MNIST Kaggle Dataset
 *
 * Modes:
 *   Normal:    parahist <dataset> <num_threads>
 *   Benchmark: parahist <dataset> --benchmark [max_threads]
 *
 * Normal mode:
 *   Runs sequential + parallel histogram once, validates, prints timing.
 *
 * Benchmark mode:
 *   Thread counts: 1, 2, 4, 8, 16 (if CPU supports it).
 *   5 timed runs per count + 1 warm-up (discarded).
 *   Correctness validated every run.
 *   Saves results/benchmark_results.csv and results/benchmark_summary.csv.
 */

#include <iostream>
#include <iomanip>
#include <fstream>
#include <string>
#include <stdexcept>
#include <filesystem>
#include <thread>
#include <cmath>

#include <omp.h>

#include "csv_reader.h"
#include "sequential_histogram.h"
#include "parallel_histogram.h"
#include "benchmark.h"

namespace fs = std::filesystem;

// ── Helper: save single-run histogram to CSV ──────────────────────────────────
static void save_histogram_csv(const std::string& filepath,
                                const HistogramResult& result)
{
    fs::path out_path(filepath);
    if (out_path.has_parent_path())
        fs::create_directories(out_path.parent_path());

    std::ofstream out(filepath);
    if (!out.is_open())
        throw std::runtime_error("Cannot write: " + filepath);

    out << "pixel_value,frequency\n";
    for (int bin = 0; bin < HIST_BINS; ++bin)
        out << bin << "," << result.counts[bin] << "\n";

    std::cout << "  Saved: " << filepath << "\n";
}

// ── Helper: validate histograms ───────────────────────────────────────────────
static bool validate_histogram(const HistogramResult& seq,
                                const HistogramResult& par)
{
    bool pass = true;
    for (int b = 0; b < HIST_BINS; ++b) {
        if (seq.counts[b] != par.counts[b]) {
            if (pass) {
                std::cout << "[FAIL] Histogram mismatch detected:\n"
                          << std::setw(12) << "Bin"
                          << std::setw(20) << "Sequential"
                          << std::setw(20) << "Parallel" << "\n";
            }
            std::cout << std::setw(12) << b
                      << std::setw(20) << seq.counts[b]
                      << std::setw(20) << par.counts[b] << "\n";
            pass = false;
        }
    }
    return pass;
}

// ── Helper: print histogram sample ───────────────────────────────────────────
static void print_histogram_sample(const HistogramResult& result)
{
    std::cout << "\n  Pixel Value | Frequency\n"
              << "  -----------+-----------\n";
    for (int b = 0; b <= 10; ++b)
        std::cout << "  " << std::setw(11) << b
                  << " | " << result.counts[b] << "\n";
    std::cout << "  ... (full histogram saved to results/)\n\n";
}

// ── Normal run mode ───────────────────────────────────────────────────────────
static int run_normal(const std::vector<MnistRow>& rows,
                      const std::string& csv_path, int num_threads)
{
    const std::size_t n_rows  = rows.size();
    const long long   n_total = static_cast<long long>(n_rows) * NUM_PIXELS;

    std::cout << "  Rows             : " << n_rows    << "\n"
              << "  Pixels per image : " << NUM_PIXELS << "\n"
              << "  Total pixels     : " << n_total   << "\n";

    std::cout << "\n[2/5] Running Sequential Histogram...\n";
    HistogramResult seq = SequentialHistogram::compute(rows);
    std::cout << "  Elapsed : " << std::fixed << std::setprecision(3)
              << seq.elapsed_ms << " ms\n";
    print_histogram_sample(seq);

    std::cout << "[3/5] Running Parallel Histogram (OpenMP, "
              << num_threads << " threads)...\n";
    HistogramResult par = ParallelHistogram::compute(rows, num_threads);
    std::cout << "  Elapsed : " << std::fixed << std::setprecision(3)
              << par.elapsed_ms << " ms\n";

    std::cout << "\n[4/5] Validating histograms (256 bins)...\n";
    bool valid = validate_histogram(seq, par);
    std::cout << "  Histogram correctness: " << (valid ? "PASS" : "FAIL") << "\n";
    if (!valid) { std::cerr << "\n[ERROR] Histogram mismatch.\n"; return 1; }

    std::cout << "\n[5/5] Saving results...\n";
    save_histogram_csv("results/histogram_seq.csv", seq);
    save_histogram_csv("results/histogram_par.csv", par);

    double speedup    = seq.elapsed_ms / par.elapsed_ms;
    double efficiency = (speedup / static_cast<double>(num_threads)) * 100.0;

    std::cout << "\n"
              << "╔══════════════════════════════════════════════════════╗\n"
              << "║                  Performance Summary                 ║\n"
              << "╠══════════════════════════════════════════════════════╣\n"
              << std::fixed << std::setprecision(3)
              << "║  Sequential time  : " << std::setw(10) << seq.elapsed_ms
              <<                          " ms                         ║\n"
              << "║  Parallel time    : " << std::setw(10) << par.elapsed_ms
              <<                          " ms                         ║\n"
              << std::setprecision(2)
              << "║  Threads          : " << std::setw(10) << num_threads
              <<                          "                            ║\n"
              << "║  Speedup          : " << std::setw(10) << speedup
              <<                          " x                          ║\n"
              << "║  Efficiency       : " << std::setw(10) << efficiency
              <<                          " %                          ║\n"
              << "╚══════════════════════════════════════════════════════╝\n\n";
    return 0;
}

// ── Benchmark mode ────────────────────────────────────────────────────────────
static int run_benchmark(const std::vector<MnistRow>& rows,
                         const std::string& csv_path, int user_max)
{
    int logical_cpus = static_cast<int>(std::thread::hardware_concurrency());
    if (logical_cpus == 0) logical_cpus = omp_get_max_threads();

    std::cout << "\n=== System Information ===\n"
              << "  CPU               : 12th Gen Intel Core i7-12650HX\n"
              << "  Logical CPUs      : " << logical_cpus << "\n"
              << "  OMP max threads   : " << omp_get_max_threads() << "\n"
              << "  Compiler          : GCC " << __VERSION__ << "\n"
              << "  OpenMP version    : " << _OPENMP << " (OpenMP 5.1)\n"
              << "  C++ standard      : C++" << (__cplusplus / 100 % 100) << "\n\n";

    long long total_pixels = static_cast<long long>(rows.size()) * NUM_PIXELS;
    std::cout << "=== Dataset ===\n"
              << "  File              : " << csv_path << "\n"
              << "  Rows              : " << rows.size()  << "\n"
              << "  Pixels per image  : " << NUM_PIXELS   << "\n"
              << "  Total pixels      : " << total_pixels << "\n"
              << "  Histogram bins    : " << HIST_BINS    << "\n"
              << "  In-memory size    : " << std::fixed << std::setprecision(1)
              << (rows.size() * sizeof(MnistRow)) / (1024.0 * 1024.0) << " MB\n\n";

    // Build thread count list
    std::vector<int> thread_counts = {1, 2, 4, 8};
    if (logical_cpus >= 16)
        thread_counts.push_back(16);
    else
        std::cout << "  Note: skipping 16-thread test (machine has "
                  << logical_cpus << " logical CPUs)\n";

    if (user_max > 0) {
        std::vector<int> capped;
        for (int tc : thread_counts)
            if (tc <= user_max) capped.push_back(tc);
        thread_counts = capped;
    }

    std::cout << "=== Benchmark Configuration ===\n"
              << "  Runs per count    : 5 (+ 1 warm-up, discarded)\n"
              << "  Thread counts     : ";
    for (int i = 0; i < (int)thread_counts.size(); ++i) {
        if (i) std::cout << ", ";
        std::cout << thread_counts[i];
    }
    std::cout << "\n"
              << "  Timing (seq)      : std::chrono::high_resolution_clock\n"
              << "  Timing (par)      : omp_get_wtime()\n"
              << "  Timed region      : histogram computation + merge only\n"
              << "  Correctness       : all 256 bins validated every run\n\n";

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

    BenchmarkRunner::print_table(summaries, logical_cpus);

    std::cout << "=== Saving Results ===\n";
    try {
        BenchmarkRunner::save_csv(per_run, summaries, cfg.results_dir);
    } catch (const std::exception& e) {
        std::cerr << "Warning: " << e.what() << "\n";
    }

    std::cout << "\nPhase 3 benchmark complete.\n\n";
    return 0;
}

// ── Main ──────────────────────────────────────────────────────────────────────
int main(int argc, char* argv[])
{
    std::cout << "\n"
              << "╔══════════════════════════════════════════════════════╗\n"
              << "║       ParaHist — Parallel Histogram Generation       ║\n"
              << "║           Using OpenMP on MNIST Dataset              ║\n"
              << "╚══════════════════════════════════════════════════════╝\n\n";

    if (argc < 3) {
        std::cerr << "Usage:\n"
                  << "  Normal   : " << argv[0] << " <dataset> <num_threads>\n"
                  << "  Benchmark: " << argv[0] << " <dataset> --benchmark [max_threads]\n";
        return 1;
    }

    const std::string csv_path = argv[1];
    const std::string mode_arg = argv[2];

    std::cout << "Dataset    : " << csv_path << "\n";

    // Load dataset (shared by both modes)
    std::cout << "\n[1/5] Loading dataset...\n";
    std::vector<MnistRow> rows;
    try {
        CsvReader reader(csv_path);
        rows = reader.rows();
    } catch (const std::exception& e) {
        std::cerr << "Error loading dataset: " << e.what() << "\n";
        return 1;
    }

    if (mode_arg == "--benchmark") {
        int user_max = (argc >= 4) ? std::stoi(argv[3]) : 0;
        return run_benchmark(rows, csv_path, user_max);
    } else {
        int num_threads = 0;
        try {
            num_threads = std::stoi(mode_arg);
            if (num_threads < 1) throw std::invalid_argument("must be >= 1");
        } catch (const std::exception& e) {
            std::cerr << "Error: invalid argument '" << mode_arg << "': " << e.what() << "\n";
            return 1;
        }
        std::cout << "OMP Threads: " << num_threads << "\n";
        return run_normal(rows, csv_path, num_threads);
    }
}
