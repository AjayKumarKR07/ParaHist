// benchmarkController.js — reads benchmark CSVs and optionally triggers C++ benchmark
const fs = require("fs");
const path = require("path");
const { resolveResultsDir, runBenchmark } = require("../services/cppRunner");
const { query } = require("../config/database");

/**
 * Parse benchmark_summary.csv into structured JSON.
 * Columns: threads,avg_sequential_ms,avg_parallel_ms,min_parallel_ms,
 *           max_parallel_ms,stddev_parallel_ms,speedup,efficiency
 */
function parseBenchmarkSummaryCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 8) continue;
    results.push({
      threads: parseInt(cols[0].trim(), 10),
      avgSequentialMs: parseFloat(cols[1].trim()),
      avgParallelMs: parseFloat(cols[2].trim()),
      minParallelMs: parseFloat(cols[3].trim()),
      maxParallelMs: parseFloat(cols[4].trim()),
      stddevParallelMs: parseFloat(cols[5].trim()),
      speedup: parseFloat(cols[6].trim()),
      efficiency: parseFloat(cols[7].trim()),
    });
  }
  return results;
}

/**
 * Parse benchmark_results.csv (per-run detail) into structured JSON.
 * Columns: threads,run,sequential_ms,parallel_ms,speedup,efficiency
 */
function parseBenchmarkResultsCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 6) continue;
    records.push({
      threads: parseInt(cols[0].trim(), 10),
      run: parseInt(cols[1].trim(), 10),
      sequentialMs: parseFloat(cols[2].trim()),
      parallelMs: parseFloat(cols[3].trim()),
      speedup: parseFloat(cols[4].trim()),
      efficiency: parseFloat(cols[5].trim()),
    });
  }
  return records;
}

// GET /api/benchmark — read existing benchmark CSV results
const getBenchmarkResults = (req, res) => {
  const resultsDir = resolveResultsDir();
  const summaryFile = path.join(resultsDir, "benchmark_summary.csv");
  const detailFile = path.join(resultsDir, "benchmark_results.csv");

  if (!fs.existsSync(summaryFile)) {
    return res.status(404).json({
      error:
        "No benchmark results found. Run the benchmark first via POST /api/benchmark",
    });
  }

  const summary = parseBenchmarkSummaryCsv(summaryFile);
  const perRun = fs.existsSync(detailFile)
    ? parseBenchmarkResultsCsv(detailFile)
    : [];

  res.json({
    summary,
    perRun,
    source: "results/benchmark_summary.csv",
    runs: 5,
    warmupRuns: 1,
    note: "All values are real measured results from C++/OpenMP benchmark",
  });
};

// POST /api/benchmark — trigger C++ benchmark
const runBenchmarkComputation = async (req, res) => {
  const maxThreads = parseInt(req.body?.maxThreads, 10) || 16;

  if (!Number.isInteger(maxThreads) || maxThreads < 1 || maxThreads > 64) {
    return res
      .status(400)
      .json({ error: "maxThreads must be an integer between 1 and 64" });
  }

  try {
    console.log(`[benchmarkController] Starting benchmark (max ${maxThreads} threads)...`);
    const result = await runBenchmark(maxThreads);

    // Save benchmark summary results to PostgreSQL
    try {
      const resultsDir = resolveResultsDir();
      const summaryFile = path.join(resultsDir, "benchmark_summary.csv");
      if (fs.existsSync(summaryFile)) {
        const summary = parseBenchmarkSummaryCsv(summaryFile);
        for (const row of summary) {
          await query(
            `INSERT INTO benchmark_runs (
              user_id, threads, sequential_ms, parallel_ms, speedup, efficiency, min_time, max_time, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());`,
            [
              req.userId || null,
              row.threads,
              row.avgSequentialMs,
              row.avgParallelMs,
              row.speedup,
              row.efficiency,
              row.minParallelMs,
              row.maxParallelMs,
            ]
          );
        }
      }
    } catch (dbErr) {
      console.warn('[benchmarkController] Notice: Unable to persist benchmark to PostgreSQL:', dbErr.message);
    }

    res.json({
      status: "completed",
      message: "Benchmark completed successfully. Fetch GET /api/benchmark for results.",
      maxThreads,
    });
  } catch (err) {
    console.error("[benchmarkController] Error:", err.message);
    res.status(500).json({
      error: "Benchmark failed",
      details: err.message,
    });
  }
};

module.exports = { getBenchmarkResults, runBenchmarkComputation };
