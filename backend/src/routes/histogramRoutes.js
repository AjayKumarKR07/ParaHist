const express = require("express");
const router = express.Router();
const {
  getHistogram,
  runHistogramComputation,
} = require("../controllers/histogramController");

router.get("/", getHistogram);
router.post("/run", runHistogramComputation);

module.exports = router;
