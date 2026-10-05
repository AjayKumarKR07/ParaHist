// authController.js — Controller handling User Registration and Login
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'parahist_secure_session_secret_key_2026';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email validator
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

const authController = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { name, email, password } = req.body || {};

      // 1. Validate name
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Full Name is required.',
        });
      }

      // 2. Validate email
      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is required.',
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }

      // 3. Validate password (min 8 chars)
      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Password is required.',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must contain at least 8 characters.',
        });
      }

      // 4. Check if email already exists
      const existingUser = User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      // 5. Create user with hashed password
      await User.create({ name, email, password });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
      });
    } catch (err) {
      console.error('[authController.register] Error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Registration failed due to a server error. Please try again.',
      });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body || {};

      // 1. Validate presence of credentials
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
      }

      // 2. Find user by email
      const user = User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // 3. Verify password hash
      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // 4. Generate JWT authentication token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: '7d',
      });

      // 5. Return success response (never return password!)
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (err) {
      console.error('[authController.login] Error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Login failed due to a server error. Please try again.',
      });
    }
  },

  // GET /api/auth/me — Optional token verification endpoint
  async me(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No authentication token provided.' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      return res.json({
        success: true,
        user: User.sanitize(user),
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
  },
};

module.exports = authController;
