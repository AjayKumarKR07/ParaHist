// experimentRoutes.js — Express router for Experiment History APIs
const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experimentController');
const { requireAuth } = require('../middleware/authMiddleware');

// All experiment history endpoints require authenticated user session
router.get('/', requireAuth, experimentController.listUserExperiments);
router.get('/:id', requireAuth, experimentController.getExperimentDetails);

module.exports = router;
