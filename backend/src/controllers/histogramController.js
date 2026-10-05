// histogramController.js — reads histogram CSVs and optionally triggers C++ run
const fs   = require("fs");
const path = require("path");
const { resolveResultsDir, runHistogram } = require("../services/cppRunner");

const EXPECTED_BINS        = 256;
const EXPECTED_TOTAL_PIXELS = 42000 * 784; // 32,928,000

/**
 * Parse a histogram CSV file (pixel_value,frequency) into an array of 256 bins.
 * Returns exactly 256 objects: { pixel: 0..255, frequency: <number> }
 */
function parseHistogramCsv(filePath) {
  const raw   = fs.readFileSync(filePath, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const bins  = [];

  for (let i = 1; i < lines.length; i++) {          // skip header row
    const cols = lines[i].split(",");
    if (cols.length < 2) continue;
    const pixel     = parseInt(cols[0].trim(), 10);
    const frequency = parseInt(cols[1].trim(), 10);
    if (isNaN(pixel) || isNaN(frequency)) continue;
    bins.push({ pixel, frequency });
  }
  return bins;
}

/**
 * Validate correctness:
 *  1. Both arrays have exactly 256 entries.
 *  2. Every bin matches (sequential[i].frequency === parallel[i].frequency).
 *  3. Sum of each array equals EXPECTED_TOTAL_PIXELS (32,928,000).
 *
 * Returns { correct, mismatchedBins, seqTotal, parTotal }
 */
function validateHistograms(sequential, parallel) {
  const mismatchedBins = [];
  let seqTotal = 0;
  let parTotal = 0;

  if (sequential.length !== EXPECTED_BINS || parallel.length !== EXPECTED_BINS) {
    return {
      correct:        false,
      mismatchedBins: [],
      seqTotal:       sequential.reduce((s, b) => s + b.frequency, 0),
      parTotal:       parallel.reduce((s, b) => s + b.frequency, 0),
      binCountMatch:  false,
    };
  }

  for (let i = 0; i < EXPECTED_BINS; i++) {
    seqTotal += sequential[i].frequency;
    parTotal += parallel[i].frequency;
    if (sequential[i].frequency !== parallel[i].frequency) {
      mismatchedBins.push({
        pixel:      sequential[i].pixel,
        sequential: sequential[i].frequency,
        parallel:   parallel[i].frequency,
      });
    }
  }

  return {
    correct:       mismatchedBins.length === 0,
    mismatchedBins,
    seqTotal,
    parTotal,
    seqTotalValid: seqTotal === EXPECTED_TOTAL_PIXELS,
    parTotalValid: parTotal === EXPECTED_TOTAL_PIXELS,
    binCountMatch: true,
  };
}

/**
 * Find the pixel value with the highest frequency.
 */
function mostFrequent(bins) {
  if (!bins || bins.length === 0) return { pixel: null, frequency: 0 };
  return bins.reduce((best, b) => (b.frequency > best.frequency ? b : best), bins[0]);
}

// ─── GET /api/histogram ───────────────────────────────────────────────────────
// Read existing CSV results and return enriched JSON.
const getHistogram = (req, res) => {
  const resultsDir = resolveResultsDir();
  const seqFile    = path.join(resultsDir, "histogram_seq.csv");
  const parFile    = path.join(resultsDir, "histogram_par.csv");

  const seqExists = fs.existsSync(seqFile);
  const parExists = fs.existsSync(parFile);

  if (!seqExists && !parExists) {
    return res.status(404).json({
      error:
        "No histogram results found. Run POST /api/histogram/run to compute.",
    });
  }

  const sequential = seqExists ? parseHistogramCsv(seqFile) : [];
  const parallel   = parExists ? parseHistogramCsv(parFile) : [];

  // Correctness validation (only when both files exist)
  let validation = null;
  if (seqExists && parExists) {
    validation = validateHistograms(sequential, parallel);
  }

  const seqMostFreq = mostFrequent(sequential);
  const parMostFreq = mostFrequent(parallel);

  res.json({
    sequential,
    parallel,
    bins:              EXPECTED_BINS,
    expectedTotal:     EXPECTED_TOTAL_PIXELS,

    // Correctness fields
    correctness:       validation ? validation.correct : null,
    mismatchedBins:    validation ? validation.mismatchedBins : [],
    seqTotal:          validation ? validation.seqTotal : sequential.reduce((s, b) => s + b.frequency, 0),
    parTotal:          validation ? validation.parTotal : parallel.reduce((s, b) => s + b.frequency, 0),
    seqTotalValid:     validation ? validation.seqTotalValid : null,
    parTotalValid:     validation ? validation.parTotalValid : null,
    binCountMatch:     validation ? validation.binCountMatch : null,

    // Stats
    mostFrequentPixel: seqMostFreq.pixel,
    mostFrequentCount: seqMostFreq.frequency,

    source:            "results/histogram_seq.csv + results/histogram_par.csv",
  });
};

// ─── POST /api/histogram/run ──────────────────────────────────────────────────
// Trigger C++ OpenMP histogram computation via WSL.
const runHistogramComputation = async (req, res) => {
  const raw         = req.body?.threads;
  const threadCount = parseInt(raw, 10);

  if (!Number.isInteger(threadCount) || threadCount < 1 || threadCount > 64) {
    return res
      .status(400)
      .json({ error: "threads must be an integer between 1 and 64" });
  }

  try {
    console.log(
      `[histogramController] Starting C++ histogram: ${threadCount} OpenMP thread(s)...`
    );
    const result = await runHistogram(threadCount);

    // Parse timing from C++ stdout
    const seqMs = result.stdout.match(/Sequential time\s+:\s+([\d.]+)/)?.[1];
    const parMs = result.stdout.match(/Parallel time\s+:\s+([\d.]+)/)?.[1];
    const speedup = result.stdout.match(/Speedup\s+:\s+([\d.]+)/)?.[1];
    const eff     = result.stdout.match(/Efficiency\s+:\s+([\d.]+)/)?.[1];
    const correct = /Histogram correctness:\s*PASS/i.test(result.stdout);

    res.json({
      status:          "completed",
      threads:         threadCount,
      message:         `Histogram computed successfully with ${threadCount} thread(s).`,
      correctness:     correct,
      sequentialMs:    seqMs ? parseFloat(seqMs) : null,
      parallelMs:      parMs ? parseFloat(parMs) : null,
      speedup:         speedup ? parseFloat(speedup) : null,
      efficiency:      eff ? parseFloat(eff) : null,
    });
  } catch (err) {
    console.error("[histogramController] Error:", err.message);
    res.status(500).json({
      error:   "Histogram computation failed",
      details: err.message,
    });
  }
};

module.exports = { getHistogram, runHistogramComputation };
