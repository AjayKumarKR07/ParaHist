// authMiddleware.js — JWT verification middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'parahist_secure_session_secret_key_2026';

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please log in again.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Malformed token payload.',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    // Attach verified user and userId to request
    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    console.error('[requireAuth middleware] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication verification failed due to internal error.',
    });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) {
            const user = await User.findById(decoded.id);
            if (user) {
              req.user = user;
              req.userId = user.id;
            }
          }
        } catch {
          // Token invalid, ignore silently for optional auth
        }
      }
    }
  } catch {
    // Ignore error
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  JWT_SECRET,
};
