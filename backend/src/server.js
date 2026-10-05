/**
 * server.js — ParaHist Express API Server
 *
 * Endpoints:
 *   GET  /api/health          — liveness check
 *   GET  /api/system          — hardware/platform info
 *   GET  /api/dataset         — MNIST dataset metadata
 *   GET  /api/histogram       — read histogram_seq.csv + histogram_par.csv
 *   POST /api/histogram/run   — trigger C++ histogram (body: { threads })
 *   GET  /api/benchmark       — read benchmark_summary.csv + benchmark_results.csv
 *   POST /api/benchmark       — trigger C++ benchmark (body: { maxThreads })
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const systemRoutes     = require("./routes/systemRoutes");
const datasetRoutes    = require("./routes/datasetRoutes");
const histogramRoutes  = require("./routes/histogramRoutes");
const benchmarkRoutes  = require("./routes/benchmarkRoutes");
const authRoutes       = require("./routes/authRoutes");
const reportRoutes     = require("./routes/reportRoutes");
const experimentRoutes = require("./routes/experimentRoutes");
const { testConnection } = require("./config/database");
const { initDatabase }   = require("./config/initDatabase");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────────

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Simple request logger
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ParaHist API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/system",      systemRoutes);
app.use("/api/dataset",     datasetRoutes);
app.use("/api/histogram",   histogramRoutes);
app.use("/api/benchmark",   benchmarkRoutes);
app.use("/api/report",      reportRoutes);
app.use("/api/experiments", experimentRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    availableRoutes: [
      "GET  /api/health",
      "GET  /api/system",
      "GET  /api/dataset",
      "GET  /api/histogram",
      "POST /api/histogram/run",
      "GET  /api/benchmark",
      "POST /api/benchmark",
    ],
  });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[server] Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║   ParaHist API — Listening on :${PORT}  ║`);
  console.log(`╚══════════════════════════════════════╝`);
  console.log(`  Health:      http://localhost:${PORT}/api/health`);
  console.log(`  Dataset:     http://localhost:${PORT}/api/dataset`);
  console.log(`  Histogram:   http://localhost:${PORT}/api/histogram`);
  console.log(`  Benchmark:   http://localhost:${PORT}/api/benchmark`);
  console.log(`  Experiments: http://localhost:${PORT}/api/experiments\n`);

  // Verify PostgreSQL connection and initialize schema
  const isConnected = await testConnection();
  if (isConnected) {
    await initDatabase();
  }
});

module.exports = app;
