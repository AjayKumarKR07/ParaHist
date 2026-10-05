// authRoutes.js — Express router for authentication and account management
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (Require valid JWT)
router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/password', requireAuth, authController.updatePassword);
router.get('/preferences', requireAuth, authController.getPreferences);
router.put('/preferences', requireAuth, authController.updatePreferences);

module.exports = router;
