# ParaHist — Parallel Histogram Generation Using OpenMP

> **Parallel Computing Mini-Project · Academic Laboratory & Full-Stack System**  
> High-performance parallel frequency distribution extraction on 32,928,000 grayscale pixels from the MNIST dataset using C++17, OpenMP, PostgreSQL, Node.js, and React.

---

## 📋 Table of Contents

- [Overview & Problem Statement](#-overview--problem-statement)
- [System Architecture](#-system-architecture)
- [Dataset Specifications](#-dataset-specifications)
- [Core Parallel Algorithm](#-core-parallel-algorithm)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Hardware & Benchmark Methodology](#-hardware--benchmark-methodology)
- [Measured Benchmark Results](#-measured-benchmark-results)
- [Full-Stack Features](#-full-stack-features)
- [Prerequisites & Build Instructions](#-prerequisites--build-instructions)
- [Running the Application](#-running-the-application)
- [REST API Reference](#-rest-api-reference)
- [Database Schema (PostgreSQL)](#-database-schema-postgresql)
- [Academic Integrity & Correctness](#-academic-integrity--correctness)
- [Project Authors](#-project-authors)

---

## 🎯 Overview & Problem Statement

**ParaHist** is a parallel computing research and laboratory project designed to measure and analyze multi-threaded scalability on CPU hardware. The project processes the full **MNIST Handwritten Digit Recognizer** dataset and computes a complete 256-bin grayscale intensity distribution across all images.

> **Clarification:** This project does **not** perform machine learning, classification, or convolutional image recognition. MNIST is utilized strictly as a standardized, memory-dense dataset ($32.9\text{M}$ pixel values) to evaluate shared-memory parallel decomposition, race condition elimination, cache behavior, and Amdahl's Law scalability bottlenecks.

---

## 🏗 System Architecture

ParaHist is built as a complete end-to-end system combining native C++17 parallel computing with a modern web laboratory portal:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REACT 18 + VITE WEB LABORATORY                        │
│   • Dark / Light Theme System         • Interactive Recharts Visualizers    │
│   • Multi-Thread Experiment Controls  • User Account Center & Preferences   │
│   • Guided Interactive Tour           • 3-Page Academic PDF Report Export   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON / JWT REST API
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NODE.JS 20+ & EXPRESS BACKEND                        │
│   • Session Authentication (JWT + bcryptjs)                                 │
│   • Database Pool & Idempotent Schema Migrations (pg@8.23)                  │
│   • Dynamic 3-Page Vector PDF Report Generator (PDFKit)                     │
│   • Native Child Process & WSL2 Execution Bridge                            │
└───────────────┬─────────────────────────────────────────────┬───────────────┘
                │ SQL Queries                                 │ WSL2 Bridge
                ▼                                             ▼
┌───────────────────────────────┐           ┌─────────────────────────────────┐
│     POSTGRESQL 18 DATABASE    │           │    C++17 OPENMP PARALLEL ENGINE │
│ • users                       │           │ • std::from_chars CSV Parser    │
│ • user_preferences            │           │ • OpenMP schedule(static)       │
│ • notification_preferences    │           │ • Thread-local private hists    │
│ • experiments                 │           │ • Deterministic reduction merge │
│ • experiment_histogram (256B) │           │ • Strict PASS/FAIL validation   │
│ • benchmark_runs              │           └────────────────┬────────────────┘
└───────────────────────────────┘                            │
                                                             ▼
                                            ┌─────────────────────────────────┐
                                            │      MNIST DATASET & CSVs       │
                                            │ • dataset/train.csv (32.9M px)  │
                                            │ • results/histogram_seq.csv     │
                                            │ • results/histogram_par.csv     │
                                            │ • results/benchmark_summary.csv │
                                            └─────────────────────────────────┘
```

---

## 📊 Dataset Specifications

The system benchmarks on the real Kaggle MNIST Digit Recognizer dataset:

- **Source:** [Kaggle MNIST Digit Recognizer Dataset](https://www.kaggle.com/competitions/digit-recognizer/data)
- **Path:** `dataset/train.csv` *(downloaded locally, excluded from Git)*

| Metric | Specification |
|---|---|
| **Total Images** | 42,000 digit samples |
| **Resolution per Image** | $28 \times 28$ pixels ($784$ grayscale pixels per image) |
| **Total Pixel Values** | **32,928,000 discrete uint8 values** |
| **Pixel Intensity Range** | $0$ (Black / Background) to $255$ (White / Foreground) |
| **Memory Footprint** | $\approx 73\text{ MB}$ uncompressed on disk |
| **Bin 0 (Background)** | $26,621,312\text{ pixels}$ ($80.85\%$ of dataset) |
| **Bins 1–255 (Digit Strokes)** | $6,306,688\text{ pixels}$ ($19.15\%$ anti-aliased edges) |
| **Histogram Output** | 256 discrete frequency bins |

---

## ⚡ Core Parallel Algorithm

### 1. The Race Condition Challenge
A naive parallel histogram approach (`counts[pixel]++` within a shared array) causes severe data races and cache line contention. Synchronizing every increment with atomics (`#pragma omp atomic`) introduces catastrophic serialization overhead.

### 2. Thread-Local Privatization Solution
ParaHist eliminates lock contention entirely by allocating **private thread-local histograms**:

```cpp
// Allocate an independent 256-bin buffer for each OpenMP thread
std::vector<std::array<long long, 256>> local_hists(nthreads, {0});

double t_start = omp_get_wtime();

#pragma omp parallel num_threads(nthreads)
{
    int tid = omp_get_thread_num();
    auto& local = local_hists[tid]; // Thread-local buffer: 100% private, zero false sharing

    #pragma omp for schedule(static)
    for (size_t i = 0; i < rows.size(); ++i) {
        for (const uint8_t px : rows[i].pixels) {
            local[px]++; // Lock-free local increment
        }
    }
} // Implicit OpenMP barrier

// Deterministic reduction merge pass (cost: 256 × nthreads iterations << 1 ms)
for (int t = 0; t < nthreads; ++t) {
    for (int b = 0; b < 256; ++b) {
        counts[b] += local_hists[t][b];
    }
}

double t_end = omp_get_wtime();
```

- **Lock-Free Hot Loop:** Threads execute at maximum CPU throughput without mutexes, spinlocks, or atomic bus locks.
- **Cache Isolation:** Thread-local buffers avoid false sharing across L1/L2 cache lines.
- **Strict Verification:** Every run automatically cross-validates sequential vs parallel bin equality:
  $$\sum_{b=0}^{255} \text{Seq}[b] = \sum_{b=0}^{255} \text{Par}[b] = 32,928,000 \quad \text{and} \quad \forall b \in [0, 255]: \text{Seq}[b] = \text{Par}[b]$$

---

## 🛠 Technology Stack

| Layer | Technologies | Role in System |
|---|---|---|
| **Computation Engine** | C++17, OpenMP 4.5+, GCC 15.2 / 16.1 | Static loop decomposition, thread-local reduction, CSV serialization |
| **Execution Subsystem** | WSL2 (Ubuntu Linux) / Native Windows | High-performance compiled binary execution environment |
| **Backend API** | Node.js 20+, Express.js, `pg@8.23.1` | REST APIs, child process execution bridge, session management |
| **Database** | PostgreSQL 18.6 | Persistent storage for users, preferences, experiments, and benchmark suite history |
| **Security** | JWT, `bcryptjs` (10 rounds) | Secure password hashing, authenticated routes, user data isolation |
| **Reporting** | PDFKit | Server-side 3-page academic vector report compilation |
| **Frontend Portal** | React 18, Vite, Tailwind CSS, Recharts | Responsive dark/light laboratory interface, live visualizers, account center |

---

## 📁 Project Structure

```
ParaHist/
├── dataset/
│   └── train.csv                    ← MNIST dataset (git-ignored)
├── src/                             ← C++17 OpenMP Engine Source
│   ├── main.cpp                     ← CLI engine entry point (single & benchmark modes)
│   ├── csv_reader.h / .cpp          ← Fast zero-allocation CSV reader (std::from_chars)
│   ├── sequential_histogram.h/.cpp  ← Baseline single-threaded histogram implementation
│   ├── parallel_histogram.h/.cpp    ← Multi-threaded OpenMP privatization implementation
│   ├── benchmark.h / .cpp           ← BenchmarkRunner multi-run statistical evaluation
│   └── bench_main.cpp               ← Standalone benchmark executable
├── backend/                         ← Node.js / Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          ← PostgreSQL connection pool (pg)
│   │   │   └── initDatabase.js      ← Idempotent schema & index initialization
│   │   ├── controllers/
│   │   │   ├── authController.js    ← Login, registration, profile & preference handlers
│   │   │   ├── histogramController.js← C++ execution trigger & PostgreSQL experiment logging
│   │   │   ├── benchmarkController.js← Scalability benchmark runner & DB persistence
│   │   │   ├── experimentController.js← Chronological experiment history & details API
│   │   │   └── reportController.js  ← Streamed PDF report download handler
│   │   ├── middleware/
│   │   │   └── authMiddleware.js    ← JWT token verification & optionalAuth middleware
│   │   ├── models/
│   │   │   └── User.js              ← PostgreSQL-backed User model with sanitization
│   │   ├── routes/                  ← Express route definitions (/api/*)
│   │   ├── services/
│   │   │   ├── cppRunner.js         ← WSL2 child process execution bridge
│   │   │   └── pdfReportGenerator.js← 3-page vector PDF report compiler
│   │   └── server.js                ← Express application boot & startup probe
│   ├── scripts/
│   │   └── migrateUsersToPostgres.js← Safe users.json to PostgreSQL migration script
│   ├── data/
│   │   └── users.json               ← Offline legacy backup
│   ├── .env.example                 ← Safe environment configuration template
│   └── package.json
├── frontend/                        ← React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/              ← Reusable UI cards, charts, modals & navigation
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      ← User authentication state & token management
│   │   │   ├── ThemeContext.jsx     ← Shared Dark / Light theme provider
│   │   │   └── TourContext.jsx      ← Interactive guided tour provider
│   │   ├── pages/
│   │   │   ├── Home.jsx             ← Introduction, algorithm highlights & project authors
│   │   │   ├── Dashboard.jsx        ← Laboratory control center & quick actions
│   │   │   ├── Histogram.jsx        ← Execution controls, 256-bin chart & correctness
│   │   │   ├── Performance.jsx      ← Speedup charts, benchmark tables & experiment history
│   │   │   ├── HowItWorks.jsx       ← In-depth technical architecture breakdown
│   │   │   ├── About.jsx            ← Project methodology & technical specifications
│   │   │   └── account/             ← Profile, Settings, Security & Notifications
│   │   └── services/
│   │       └── api.js               ← Client REST & PDF blob download services
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── results/                         ← Generated execution outputs (CSV format)
│   ├── histogram_seq.csv            ← 256-bin sequential frequencies
│   ├── histogram_par.csv            ← 256-bin parallel frequencies
│   ├── benchmark_summary.csv        ← Multi-thread statistical summary
│   └── benchmark_results.csv        ← Per-run timing detail
├── CMakeLists.txt                   ← CMake build configuration
├── README.md                        ← Project documentation
└── .gitignore                       ← Excludes datasets, builds, and .env secrets
```

---

## 💻 Hardware & Benchmark Methodology

### Benchmark Hardware Environment

| Component | Specification |
|---|---|
| **CPU** | 12th Gen Intel Core i7-12650HX |
| **Physical / Logical Cores** | 10 Cores (6 Performance + 4 Efficient) / 20 Threads |
| **Base / Boost Clocks** | 2.3 GHz base / up to 4.7 GHz Turbo |
| **Operating System** | Ubuntu 22.04 LTS via WSL2 on Windows 11 |
| **Compiler** | GCC 15.2.0 (`-O3 -fopenmp -std=c++17`) |

### Measurement Protocol

1. **Dataset Loaded Once:** CSV reading and in-memory parsing are strictly excluded from timing calculations.
2. **Warmup Executions:** 1 complete warmup run is performed before measurements to prime CPU caches and frequency governors.
3. **Multi-Sample Averaging:** Every thread configuration is executed across 5 timed iterations.
4. **Independent High-Resolution Clocks:**
   - Sequential baseline measured using `std::chrono::high_resolution_clock`.
   - Multi-threaded execution measured using `omp_get_wtime()`.
5. **Continuous Verification:** Correctness check validates all 256 bins against reference after **every single iteration**.
6. **Formulas:**
   $$\text{Speedup } (S) = \frac{T_{\text{sequential}}}{T_{\text{parallel}}}, \quad \text{Efficiency } (E) = \frac{S}{\text{Thread Count}} \times 100\%$$

---

## 📈 Measured Benchmark Results

> All metrics are **real measured results** obtained from hardware runs on the 12th Gen Intel Core i7 processor processing all 32,928,000 pixels.

**Sequential Reference Time:** $\text{Avg} = 59.89\text{ ms}$ (5 runs, $\sigma = 2.28\text{ ms}$)

| Threads | Avg Time (ms) | Min (ms) | Max (ms) | StdDev (ms) | Speedup ($S$) | Parallel Efficiency ($E$) | Correctness |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1 Thread** | 53.95 ms | 51.64 ms | 58.20 ms | 2.74 ms | **1.11×** | 111.0% | PASS |
| **2 Threads** | 30.46 ms | 28.55 ms | 32.52 ms | 1.64 ms | **1.97×** | **98.3%** | PASS |
| **4 Threads** | 19.94 ms | 19.04 ms | 20.88 ms | 0.88 ms | **3.00×** | **75.1%** | PASS |
| **8 Threads** | 15.94 ms | 15.10 ms | 17.40 ms | 0.88 ms | **3.76×** | **47.0%** | PASS |
| **16 Threads** | 9.85 ms | 8.33 ms | 13.24 ms | 1.95 ms | **6.08×** | **38.0%** | PASS |

### Performance & Scalability Insights

- **Near-Linear Speedup up to 4 Threads:** 2 threads achieve $1.97\times$ speedup ($98.3\%$ efficiency) and 4 threads achieve $3.00\times$ speedup ($75.1\%$ efficiency), confirming minimal parallel overhead.
- **Memory Bandwidth Saturation (Amdahl's Law):** At 8 and 16 threads, efficiency drops to $47\%$ and $38\%$. Because each pixel operation consists of a simple memory read and array increment, the workload becomes **memory-bandwidth bound**. Streaming 32.9 million bytes saturates the L3 cache and DDR memory bus, limiting further linear scaling regardless of logical core count.

---

## 🌟 Full-Stack Features

### 1. Interactive Laboratory Web Portal
- **Dark & Light Mode:** Tailored HSL color palette with smooth CSS variable transitions.
- **Interactive Tour:** Step-by-step guided onboarding system for new researchers.
- **Dynamic 256-Bin Visualization:** Recharts bar and area charts displaying sequential, parallel, or overlaid frequencies with logarithmic/linear scaling.

### 2. User Account Center
- Dedicated portal with tabs for **Profile Management**, **Laboratory Settings** (default thread count, default visualization mode), **Security** (bcrypt password changes), and **Notifications**.

### 3. PostgreSQL Experiment & Benchmark History
- Automated persistence: Running a histogram experiment automatically records the run parameters, speedup, and all 256 bins into PostgreSQL.
- Historical inspection table on the Performance page displaying historical timings, speedups, and validation status.

### 4. Downloadable 3-Page Academic PDF Report
- Generates a publication-grade, vector-rendered 3-page experiment report (`ParaHist_Experiment_Report_YYYY-MM-DD.pdf`).
- Includes project specs, configuration cards, mathematical proofs, a vector-drawn 256-bin Cartesian coordinate chart, multi-thread benchmark tables, and Amdahl's Law analysis.

---

## ⚙️ Prerequisites & Build Instructions

### Prerequisites

- **C++ Compiler:** GCC 11+ with OpenMP support (e.g. GCC 15/16 via WSL2 or MinGW-w64)
- **Build System:** CMake 3.20+
- **Runtime Subsystem:** Ubuntu on WSL2 (recommended for Windows users)
- **Node.js:** Node.js 18.0.0 or higher, with npm
- **Database:** PostgreSQL 18.x installed and running on `localhost:5432`

---

### Step 1: Clone Repository & Download Dataset

```bash
git clone https://github.com/AjayKumarKR07/ParaHist.git
cd ParaHist

# Place the Kaggle MNIST train.csv inside dataset/
mkdir -p dataset
# Copy your downloaded train.csv into dataset/train.csv
```

---

### Step 2: Compile the C++ OpenMP Engine

#### On Linux / WSL2 (Recommended):
```bash
mkdir -p build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)
cd ..
```

#### On Windows (MinGW-w64 via MSYS2):
```powershell
cmake -S . -B build -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release -j4
```

Verify binary execution:
```bash
./build/parahist dataset/train.csv 4
```

---

### Step 3: Configure Backend & PostgreSQL Database

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```

2. Create your local `.env` file from the template:
   ```bash
   cp .env.example .env
   ```

3. Update `backend/.env` with your PostgreSQL credentials:
   ```ini
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/parahist
   JWT_SECRET=your_secure_jwt_secret_key_2026
   CPP_EXECUTABLE=build/parahist
   DATASET_PATH=dataset/train.csv
   RESULTS_DIR=results
   FRONTEND_URL=http://localhost:5173
   ```

4. Initialize the PostgreSQL schema and migrate legacy users:
   ```bash
   node scripts/migrateUsersToPostgres.js
   ```

---

### Step 4: Configure Frontend Application

```bash
cd ../frontend
npm install
```

---

## 🚀 Running the Application

### 1. Start the Backend API Server
```bash
cd backend
npm start
```
*The server will start on `http://localhost:5000` and automatically verify PostgreSQL connectivity.*

### 2. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
*Open your browser and navigate to `http://localhost:5173`.*

### 3. Production Build Validation
```bash
cd frontend
npm run build
```

---

## 📡 REST API Reference

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/health` | Public | System liveness probe and API version |
| `GET` | `/api/dataset` | Public | MNIST dataset metadata (rows, columns, pixel count) |
| `GET` | `/api/histogram` | Public | Fetch latest sequential & parallel 256-bin CSV results |
| `POST` | `/api/histogram/run` | Optional | Execute C++ OpenMP engine with specified thread count |
| `GET` | `/api/benchmark` | Public | Retrieve multi-thread benchmark suite summary |
| `POST` | `/api/benchmark` | Optional | Execute benchmark suite across 1, 2, 4, 8, 16 threads |
| `POST` | `/api/auth/register` | Public | Register new researcher account in PostgreSQL |
| `POST` | `/api/auth/login` | Public | Authenticate user, verify bcrypt hash, issue JWT |
| `GET` | `/api/auth/me` | JWT | Get current authenticated user session and profile |
| `PUT` | `/api/auth/profile` | JWT | Update researcher profile information |
| `PUT` | `/api/auth/password` | JWT | Update password securely with bcrypt verification |
| `GET` | `/api/auth/preferences`| JWT | Fetch theme, thread count, and notification settings |
| `PUT` | `/api/auth/preferences`| JWT | Persist updated settings to PostgreSQL |
| `GET` | `/api/experiments` | JWT | Chronological list of user's past experiment runs |
| `GET` | `/api/experiments/:id` | JWT | Detailed experiment run with all 256 bin counts |
| `GET` | `/api/report/pdf` | Optional | Download 3-page publication-grade PDF report |
| `POST` | `/api/report/pdf` | Optional | Download PDF report with custom metric overrides |

---

## 🗄 Database Schema (PostgreSQL)

ParaHist uses a relational schema with foreign key constraints, cascading updates, and indexing:

- `users`: Core identity table storing user ID, name, unique email, bcrypt hash, and role.
- `user_preferences`: Stores user UI theme, default thread selection, and guided tour status.
- `notification_preferences`: Fine-grained notification preference toggles.
- `experiments`: Historical log of every C++ execution with thread counts, timings, speedup, and efficiency.
- `experiment_histogram`: Normalized table preserving all 256 individual bin frequencies per experiment.
- `benchmark_runs`: Records 1-to-16 thread benchmark suite evaluations.

---

## 🔬 Academic Integrity & Correctness Guarantee

- **Zero Synthetic Data:** Every histogram bin count, execution time, and speedup multiplier is derived from actual hardware execution.
- **Mathematical Invariant:** The sequential reference and parallel reduction algorithms must agree identically across all 256 bins. Any discrepancy automatically triggers a `FAIL` status.
- **Reproducible Performance:** All timing benchmarks include warmups and multi-sample standard deviations to ensure scientific validity.

---

## 👥 Project Authors

Developed as an academic Mini-Project in **Parallel Computing**:

- **Ajay Kumar K R** — [GitHub Profile](https://github.com/AjayKumarKR07)
- **Anil Kumar G R** — [GitHub Profile](https://github.com/AnilKumarGR)
