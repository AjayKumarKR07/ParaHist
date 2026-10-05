// reportController.js — Controller handling PDF Experiment Report generation
const { generateExperimentReport } = require("../services/pdfReportGenerator");

const reportController = {
  // POST /api/report/pdf (or GET /api/report/pdf)
  async downloadPdfReport(req, res) {
    try {
      const rawData = req.method === "POST" ? req.body || {} : req.query || {};

      const threads = rawData.threads ? parseInt(rawData.threads, 10) : undefined;
      const sequentialMs = rawData.sequentialMs ? parseFloat(rawData.sequentialMs) : undefined;
      const parallelMs = rawData.parallelMs ? parseFloat(rawData.parallelMs) : undefined;
      const speedup = rawData.speedup ? parseFloat(rawData.speedup) : undefined;
      const efficiency = rawData.efficiency ? parseFloat(rawData.efficiency) : undefined;
      const correctness = rawData.correctness !== undefined ? Boolean(rawData.correctness) : undefined;

      const customMetrics = {
        threads,
        sequentialMs,
        parallelMs,
        speedup,
        efficiency,
        correctness,
      };

      // Resolve user name without exposing sensitive details
      const userName = req.user?.name || rawData.userName || "ParaHist Researcher";

      // Generate dated filename: ParaHist_Experiment_Report_YYYY-MM-DD.pdf
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const filename = `ParaHist_Experiment_Report_${dateStr}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

      await generateExperimentReport({
        customMetrics,
        userName,
        outputStream: res,
      });
    } catch (err) {
      console.error("[reportController] Error generating PDF report:", err.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Unable to generate experiment report. Please try again.",
        });
      }
    }
  },
};

module.exports = reportController;
