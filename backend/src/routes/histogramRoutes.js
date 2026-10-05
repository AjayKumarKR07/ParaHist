const express = require("express");
const router = express.Router();
const {
  getHistogram,
  runHistogramComputation,
} = require("../controllers/histogramController");
const { optionalAuth } = require("../middleware/authMiddleware");

router.get("/", getHistogram);
router.post("/run", optionalAuth, runHistogramComputation);

module.exports = router;
