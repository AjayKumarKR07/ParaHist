// reportRoutes.js — Express router for Experiment PDF Reports
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { optionalAuth } = require("../middleware/authMiddleware");

// Generate and download PDF Experiment Report (supports both POST with body and GET)
router.post("/pdf", optionalAuth, reportController.downloadPdfReport);
router.get("/pdf", optionalAuth, reportController.downloadPdfReport);

module.exports = router;
