# ParaHist — Parallel Histogram Generation Using OpenMP

> **College Mini-Project | Parallel Computing**  
> Demonstrating OpenMP-based parallelism on the MNIST Kaggle Digit Recognizer dataset.

---

## Objective

Build and benchmark a **real parallel histogram generation system** in C++ using OpenMP.

The system reads the MNIST handwritten digit dataset (42,000 images × 784 pixels each) and computes a 256-bin pixel intensity histogram — counting how many times each grayscale value (0–255) appears across the entire dataset.

> **This project does NOT perform digit classification, machine learning, or any form of image recognition.**  
> MNIST is used purely as a large, real-world dataset for histogram benchmarking.

---

## Dataset

**Source:** [Kaggle MNIST Digit Recognizer](https://www.kaggle.com/competitions/digit-recognizer/data)  
**File:** `dataset/train.csv` *(not tracked in Git — see `.gitignore`)*

| Property | Value |
|---|---|
| Data rows | 42,000 |
| Columns | 785 (1 label + 784 pixel columns) |
| Pixel columns | `pixel0` through `pixel783` |
| Pixel value range | 0 – 255 (uint8) |
| File size on disk | ~73 MB |
| In-memory size | ~31.6 MB (788 bytes/row × 42,000) |
| **Total pixels processed** | **32,928,000** |

---

## Technology Stack

| Component | Technology |
|---|---|
| Language | C++ 17 |
| Parallelism | OpenMP 4.5 / 5.2 |
| Build system | CMake 4.x |
| Compiler (Linux/WSL) | GCC 15.2.0 |
| Compiler (Windows) | GCC 16.1.0 (MinGW-w64 via MSYS2) |
| Visualisation | Python 3 + matplotlib (Phase 4) |

---

## Project Structure

```
ParaHist/
├── dataset/
│   └── train.csv              ← MNIST CSV (git-ignored)
├── src/
│   ├── main.cpp               ← Entry point (normal + --benchmark modes)
│   ├── csv_reader.h/cpp       ← Fast std::from_chars CSV parser
│   ├── sequential_histogram.h/cpp  ← Single-threaded histogram loop
│   ├── parallel_histogram.h/cpp   ← OpenMP thread-local reduction
│   ├── benchmark.h/cpp        ← BenchmarkRunner: multi-run statistics
│   └── bench_main.cpp         ← Standalone benchmark entry point
├── results/                   ← histogram_seq.csv, histogram_par.csv,
│                                 benchmark_results.csv, benchmark_summary.csv
├── graphs/                    ← (Phase 4) PNG charts
├── scripts/                   ← (Phase 4) Python visualisation
├── CMakeLists.txt
├── README.md
└── .gitignore
```

---

## Build Instructions

```bash
# Prerequisites: CMake 4+, GCC with OpenMP

# Linux / WSL
mkdir -p build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)

# Windows (MinGW-w64 via MSYS2)
cmake -S . -B build -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_CXX_COMPILER=C:/msys64/mingw64/bin/g++.exe
cmake --build build --config Release -j4
```

---

## Usage

```bash
# Normal mode (single run):
./build/parahist dataset/train.csv 4

# Benchmark mode (5 runs × 5 thread counts + warm-ups):
./build/parahist dataset/train.csv --benchmark 16
```

---

## Algorithm Details

### Sequential Histogram

```cpp
auto t_start = std::chrono::high_resolution_clock::now();
for (const auto& row : rows)
    for (const uint8_t px : row.pixels)
        counts[px]++;
auto t_end = std::chrono::high_resolution_clock::now();
```

### OpenMP Parallel Histogram — Thread-Local Reduction

```cpp
// Each thread gets its own private 256-bin histogram
std::vector<std::array<long long, 256>> local_hists(nthreads);

double t_start = omp_get_wtime();

#pragma omp parallel num_threads(nthreads)
{
    int tid = omp_get_thread_num();
    auto& local = local_hists[tid];     // private — no sharing

    #pragma omp for schedule(static)
    for (size_t i = 0; i < rows.size(); ++i)
        for (uint8_t px : rows[i].pixels)
            local[px]++;                // zero contention
}
// Implicit barrier — all threads join here

// Serial merge (negligible cost: 256 × nthreads iterations)
for (int t = 0; t < nthreads; ++t)
    for (int b = 0; b < 256; ++b)
        counts[b] += local_hists[t][b];

double t_end = omp_get_wtime();
```

**Race condition avoidance:** Each thread exclusively writes to `local_hists[tid]`. No atomics, no critical sections in the hot loop.

---

## Benchmark Methodology

### Hardware

| Item | Value |
|---|---|
| CPU | 12th Gen Intel Core i7-12650HX |
| Logical CPUs | 20 |
| OpenMP version | 4.5 (WSL/Linux GCC 15.2) |
| OS | Ubuntu (WSL2) on Windows |

### Procedure

1. **Dataset loaded once** — CSV parsing time is **not** included in timing.
2. **Sequential baseline** — 1 warm-up + 5 timed runs with `std::chrono::high_resolution_clock`.
3. **Per thread count** — 1 warm-up + 5 timed runs with `omp_get_wtime()`.
4. **Correctness check** — all 256 bins validated against sequential reference after **every single run**.
5. **Statistics computed** — avg, min, max, stddev over 5 runs.
6. **Speedup** = sequential_avg / parallel_avg (consistent baseline across all thread counts).
7. **Efficiency** = speedup / num_threads × 100%.

### What is timed

| Included ✅ | Excluded ❌ |
|---|---|
| Histogram counting loop | CSV loading / parsing |
| Thread-local histogram merge | Console output |
| | File I/O (CSV writing) |
| | Correctness validation |

---

## Actual Benchmark Results

> All values are **real measured results** — not fabricated.  
> Measured on: 12th Gen Intel Core i7-12650HX, WSL2 Ubuntu, GCC 15.2.0, OpenMP 4.5.

**Sequential baseline: avg = 59.893 ms** (5 runs, stddev = 2.280 ms)

| Threads | Avg Par (ms) | Min (ms) | Max (ms) | StdDev (ms) | Speedup | Efficiency |
|:---:|---:|---:|---:|---:|---:|---:|
| **1**  | 53.948 | 51.642 | 58.199 | 2.740 | **1.11×** | 111.0% |
| **2**  | 30.459 | 28.549 | 32.521 | 1.643 | **1.97×** |  98.3% |
| **4**  | 19.935 | 19.038 | 20.881 | 0.883 | **3.00×** |  75.1% |
| **8**  | 15.938 | 15.095 | 17.404 | 0.881 | **3.76×** |  47.0% |
| **16** |  9.848 |  8.333 | 13.235 | 1.950 | **6.08×** |  38.0% |

**Histogram correctness: PASS — all 256 bins matched across all 25 runs.**

### Observations

- **1-thread parallel > sequential baseline** (1.11×): The parallel path benefits from the warm-up and cache effects; OpenMP overhead with 1 thread is ~0 since no actual threading occurs.
- **2 threads**: Near-ideal speedup (1.97×, 98.3% efficiency) — minimal overhead, good cache locality.
- **4 threads**: 3.00× speedup (75% efficiency) — slight efficiency loss due to memory bandwidth saturation.
- **8 threads**: 3.76× speedup (47% efficiency) — the workload (~33M pixel reads) becomes memory-bound; additional threads contend for the same memory bus.
- **16 threads**: 6.08× speedup but high stddev (1.95 ms) — OS scheduling jitter and cache eviction effects increase variance at high thread counts.
- **Bottleneck**: At higher thread counts the bottleneck shifts from compute to **memory bandwidth** — 32.9M uint8 reads saturate the L3 cache and main memory bus faster than cores can be added usefully.

---

## Output Files

| File | Rows | Description |
|---|---|---|
| `results/histogram_seq.csv` | 257 | Sequential bin counts |
| `results/histogram_par.csv` | 257 | Parallel bin counts (identical) |
| `results/benchmark_results.csv` | 26 | Per-run: threads, run, seq_ms, par_ms, speedup, efficiency |
| `results/benchmark_summary.csv` | 6 | Per thread count: avg, min, max, stddev, speedup, efficiency |

---

## Project Phases

| Phase | Status | Description |
|---|---|---|
| **Phase 1** | ✅ **Complete** | Dataset inspection, project structure, CMake/OpenMP setup |
| **Phase 2** | ✅ **Complete** | CSV reader, sequential + parallel histogram, validation, testing |
| **Phase 3** | ✅ **Complete** | Rigorous benchmarking: 5 runs × 5 thread counts, statistics, CSVs |
| Phase 4 | 🔲 Planned | Python visualisation: histogram chart, speedup/efficiency graphs |

---

## Author

**Ajay Kumar K R**  
College Parallel Computing Mini-Project, 2026
