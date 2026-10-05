const express = require("express");
const router = express.Router();
const {
  getBenchmarkResults,
  runBenchmarkComputation,
} = require("../controllers/benchmarkController");

router.get("/", getBenchmarkResults);
router.post("/", runBenchmarkComputation);

module.exports = router;
