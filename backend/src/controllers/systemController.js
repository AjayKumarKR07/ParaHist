// systemController.js — returns hardware/platform information
const os = require("os");
const {
  resolveCppExecutable,
  resolveDatasetPath,
  PROJECT_ROOT,
  IS_WINDOWS,
  toWslPath,
} = require("../services/cppRunner");
const fs = require("fs");

const getSystemInfo = (req, res) => {
  const exe        = resolveCppExecutable();
  const exeExists  = exe ? fs.existsSync(exe) : false;
  const dataset    = resolveDatasetPath();
  const dsExists   = fs.existsSync(dataset);

  res.json({
    platform:          process.platform,
    arch:              process.arch,
    hostname:          os.hostname(),
    cpus:              os.cpus().length,
    cpuModel:          os.cpus()[0]?.model || "Unknown",
    totalMemoryGB:     (os.totalmem() / 1e9).toFixed(2),
    freeMemoryGB:      (os.freemem() / 1e9).toFixed(2),
    nodeVersion:       process.version,
    projectRoot:       PROJECT_ROOT,
    cppExecutable:     exe || "Not found",
    cppExecutableExists: exeExists,
    executionStrategy: IS_WINDOWS ? "wsl.exe (Windows Device Guard bypass)" : "direct execFile",
    wslPath:           (IS_WINDOWS && exe) ? toWslPath(exe) : null,
    datasetExists:     dsExists,
    openmpNote:        "OpenMP 4.5 · GCC 15.2 · WSL2/Linux",
  });
};

module.exports = { getSystemInfo };
