/**
 * cppRunner.js
 *
 * Safely spawns the C++/OpenMP parahist executable.
 *
 * Strategy:
 *  - On Windows: execFile is used to call wsl.exe (full system path), which
 *    runs the Linux ELF binary inside WSL2. This bypasses Device Guard (WDAC)
 *    which blocks newly compiled .exe files in OneDrive / Desktop locations.
 *    The full path C:\Windows\system32\wsl.exe is used because Node.js child
 *    processes may not inherit System32 on PATH.
 *  - On Linux/WSL: execFile calls the binary directly.
 *
 * Security:
 *  - execFile (no shell) — never constructs shell strings from user input.
 *  - Thread count is validated to be an integer between 1 and 64.
 *  - Executable path comes from .env only, never from user input.
 */

// Full path to wsl.exe — avoids PATH lookup failures in Node.js child processes
const WSL_EXE = "C:\\Windows\\system32\\wsl.exe";

const { execFile } = require("child_process");
const path = require("path");
const fs   = require("fs");

// Project root: two levels up from backend/src/services/
const PROJECT_ROOT =
  process.env.PROJECT_ROOT ||
  path.resolve(__dirname, "..", "..", "..");

const IS_WINDOWS = process.platform === "win32";

/**
 * Convert an absolute Windows path to a WSL /mnt/<drive>/... path.
 *   C:\Users\foo\bar  →  /mnt/c/Users/foo/bar
 */
function toWslPath(winPath) {
  return winPath
    .replace(/\\/g, "/")
    .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`);
}

/**
 * Resolve the Linux (ELF) binary that wsl.exe will execute.
 * Order of preference:
 *   1. wsl_build/parahist
 *   2. build/parahist  (Linux ELF placed alongside the Windows .exe by CMake)
 */
function resolveLinuxBinary() {
  const candidates = [
    path.join(PROJECT_ROOT, "wsl_build", "parahist"),
    path.join(PROJECT_ROOT, "build",     "parahist"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/**
 * Resolve a directly-executable binary for the current platform.
 * Used on Linux/macOS only.
 */
function resolveNativeBinary() {
  const configured = process.env.CPP_EXECUTABLE || "build/parahist";
  const candidates = [
    path.resolve(PROJECT_ROOT, configured),
    path.join(PROJECT_ROOT, "build", "parahist"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/**
 * Resolve the dataset path.
 */
function resolveDatasetPath() {
  const rel = process.env.DATASET_PATH || "dataset/train.csv";
  return path.resolve(PROJECT_ROOT, rel);
}

/**
 * Resolve the results directory.
 */
function resolveResultsDir() {
  const rel = process.env.RESULTS_DIR || "results";
  return path.resolve(PROJECT_ROOT, rel);
}

/**
 * Expose a "best" executable path for display in /api/system.
 */
function resolveCppExecutable() {
  if (IS_WINDOWS) {
    return resolveLinuxBinary() || resolveNativeBinary();
  }
  return resolveNativeBinary();
}

// ── Core spawn helper ─────────────────────────────────────────────────────────

/**
 * Build the [executable, args] pair to pass to execFile.
 *
 * On Windows we call:
 *   wsl.exe <wsl-path-to-binary> <wsl-path-to-dataset> [extra args...]
 *
 * On Linux we call:
 *   <native-binary> <dataset> [extra args...]
 */
function buildExecArgs(extraArgs) {
  const dataset = resolveDatasetPath();

  if (IS_WINDOWS) {
    const bin = resolveLinuxBinary();
    if (!bin) return null;

    const wslBin     = toWslPath(bin);
    const wslDataset = toWslPath(dataset);

    return {
      exe:  WSL_EXE,
      args: [wslBin, wslDataset, ...extraArgs],
      dataset,
    };
  }

  // Linux / macOS — run directly
  const bin = resolveNativeBinary();
  if (!bin) return null;

  return { exe: bin, args: [dataset, ...extraArgs], dataset };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run histogram computation with <threads> OpenMP threads.
 * @param {number} threads  1–64
 * @returns {Promise<{stdout, stderr, exitCode}>}
 */
function runHistogram(threads) {
  return new Promise((resolve, reject) => {
    const threadCount = parseInt(threads, 10);
    if (!Number.isInteger(threadCount) || threadCount < 1 || threadCount > 64) {
      return reject(new Error("threads must be an integer between 1 and 64"));
    }

    const cmd = buildExecArgs([String(threadCount)]);
    if (!cmd) {
      return reject(
        new Error(
          "C++ binary not found. " +
          "Build the project in WSL first:\n" +
          "  wsl -e bash -c 'cd /mnt/c/path/to/project && cmake -B build && cmake --build build'"
        )
      );
    }

    if (!fs.existsSync(cmd.dataset)) {
      return reject(new Error(`Dataset not found: ${cmd.dataset}`));
    }

    console.log(`[cppRunner] exec: ${cmd.exe} ${cmd.args.join(" ")}`);

    execFile(cmd.exe, cmd.args, { cwd: PROJECT_ROOT, timeout: 120_000 },
      (error, stdout, stderr) => {
        if (error && error.code !== 0) {
          return reject(
            new Error(`Process failed (code ${error.code}).\nstderr: ${stderr}\nstdout: ${stdout}`)
          );
        }
        resolve({ stdout, stderr, exitCode: 0 });
      }
    );
  });
}

/**
 * Run the full benchmark suite.
 * @param {number} maxThreads  Maximum thread count (1–64)
 * @returns {Promise<{stdout, stderr, exitCode}>}
 */
function runBenchmark(maxThreads = 16) {
  return new Promise((resolve, reject) => {
    const threadCount = parseInt(maxThreads, 10);
    if (!Number.isInteger(threadCount) || threadCount < 1 || threadCount > 64) {
      return reject(new Error("maxThreads must be between 1 and 64"));
    }

    const cmd = buildExecArgs(["--benchmark", String(threadCount)]);
    if (!cmd) {
      return reject(new Error("C++ binary not found. Please build the project in WSL."));
    }

    if (!fs.existsSync(cmd.dataset)) {
      return reject(new Error(`Dataset not found: ${cmd.dataset}`));
    }

    console.log(`[cppRunner] benchmark: ${cmd.exe} ${cmd.args.join(" ")}`);

    // Benchmarks can take several minutes
    execFile(cmd.exe, cmd.args, { cwd: PROJECT_ROOT, timeout: 600_000 },
      (error, stdout, stderr) => {
        if (error && error.code !== 0) {
          return reject(
            new Error(`Benchmark failed (code ${error.code}).\nstderr: ${stderr}`)
          );
        }
        resolve({ stdout, stderr, exitCode: 0 });
      }
    );
  });
}

module.exports = {
  runHistogram,
  runBenchmark,
  resolveCppExecutable,
  resolveDatasetPath,
  resolveResultsDir,
  PROJECT_ROOT,
  IS_WINDOWS,
  toWslPath,
};
