const express = require("express");
const router = express.Router();
const {
  getBenchmarkResults,
  runBenchmarkComputation,
} = require("../controllers/benchmarkController");
const { optionalAuth } = require("../middleware/authMiddleware");

router.get("/", getBenchmarkResults);
router.post("/", optionalAuth, runBenchmarkComputation);

module.exports = router;
