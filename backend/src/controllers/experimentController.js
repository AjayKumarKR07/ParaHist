// experimentController.js — Experiment History and Detail APIs for ParaHist
const { query } = require('../config/database');

const experimentController = {
  // GET /api/experiments — List experiments for the authenticated user
  async listUserExperiments(req, res) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const result = await query(
        `SELECT id, threads,
                sequential_ms AS "sequentialMs",
                parallel_ms   AS "parallelMs",
                speedup, efficiency, correctness,
                mismatched_bins AS "mismatchedBins",
                sequential_total AS "seqTotal",
                parallel_total AS "parTotal",
                most_frequent_pixel AS "mostFrequentPixel",
                most_frequent_count AS "mostFrequentCount",
                created_at AS "createdAt"
         FROM experiments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 100;`,
        [userId]
      );

      return res.json({
        success: true,
        count: result.rows.length,
        experiments: result.rows,
      });
    } catch (err) {
      console.error('[experimentController.listUserExperiments] Error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to retrieve experiments.' });
    }
  },

  // GET /api/experiments/:id — Get details + 256 bins for a single experiment
  async getExperimentDetails(req, res) {
    try {
      const userId = req.userId;
      const experimentId = parseInt(req.params.id, 10);

      if (!experimentId || isNaN(experimentId)) {
        return res.status(400).json({ success: false, message: 'Invalid experiment ID.' });
      }

      // Fetch experiment and verify ownership
      const expRes = await query(
        `SELECT id, user_id, threads,
                sequential_ms AS "sequentialMs",
                parallel_ms   AS "parallelMs",
                speedup, efficiency, correctness,
                mismatched_bins AS "mismatchedBins",
                sequential_total AS "seqTotal",
                parallel_total AS "parTotal",
                expected_total AS "expectedTotal",
                bin_count AS "binCount",
                most_frequent_pixel AS "mostFrequentPixel",
                most_frequent_count AS "mostFrequentCount",
                created_at AS "createdAt"
         FROM experiments
         WHERE id = $1;`,
        [experimentId]
      );

      if (expRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Experiment not found.' });
      }

      const experiment = expRes.rows[0];

      // Enforce strict user isolation: never allow one user to view another's experiment
      if (experiment.user_id && experiment.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied to this experiment.' });
      }

      // Fetch 256 bins
      const binsRes = await query(
        `SELECT pixel_value AS pixel,
                sequential_count AS "sequentialCount",
                parallel_count AS "parallelCount"
         FROM experiment_histogram
         WHERE experiment_id = $1
         ORDER BY pixel_value ASC;`,
        [experimentId]
      );

      return res.json({
        success: true,
        experiment: {
          ...experiment,
          user_id: undefined, // omit internal FK
          bins: binsRes.rows,
        },
      });
    } catch (err) {
      console.error('[experimentController.getExperimentDetails] Error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to retrieve experiment details.' });
    }
  },
};

module.exports = experimentController;
