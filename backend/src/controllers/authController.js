// authController.js — Controller handling User Auth, Profile, Security, and Preferences
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');

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

      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must contain at least 2 characters.',
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
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      // 5. Create user with hashed password
      const newUser = await User.create({ name, email, password });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: newUser,
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
      const user = await User.findByEmail(email);
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

      // 5. Return success response with sanitized user
      return res.status(200).json({
        success: true,
        token,
        user: User.sanitize(user),
      });
    } catch (err) {
      console.error('[authController.login] Error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Login failed due to a server error. Please try again.',
      });
    }
  },

  // GET /api/auth/me — Verified current session
  async me(req, res) {
    try {
      // req.user is guaranteed by requireAuth
      const freshUser = (await User.findById(req.userId)) || req.user;
      return res.json({
        success: true,
        user: User.sanitize(freshUser),
      });
    } catch (err) {
      console.error('[authController.me] Error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
    }
  },

  // PUT /api/auth/profile — Update user profile information
  async updateProfile(req, res) {
    try {
      const { name, email } = req.body || {};

      // Verify user identity strictly from req.userId (never trust client payload IDs)
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // If email is sent and differs, notify that email changes are protected
      if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Email address cannot be changed. Contact administrator if needed.',
        });
      }

      // Validate name
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Full Name cannot be empty.',
        });
      }

      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full Name must contain at least 2 characters.',
        });
      }

      const updatedUser = await User.updateProfile(req.userId, { name: name.trim() });
      if (!updatedUser) {
        return res.status(500).json({ success: false, message: 'Failed to update profile.' });
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: updatedUser,
      });
    } catch (err) {
      console.error('[authController.updateProfile] Error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
  },

  // PUT /api/auth/password — Change user password securely
  async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body || {};

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required.',
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Verify current password with bcrypt
      const isMatch = await User.comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      // Validate new password rules (min 8 characters)
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must contain at least 8 characters.',
        });
      }

      // Check confirm password if provided
      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation password do not match.',
        });
      }

      // Ensure new password is not identical to current password
      const isSame = await User.comparePassword(newPassword, user.password);
      if (isSame) {
        return res.status(400).json({
          success: false,
          message: 'New password cannot be the same as your current password.',
        });
      }

      // Hash new password using bcryptjs (salt rounds = 10)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Save user password
      await User.updatePassword(req.userId, hashedPassword);

      // Return safe response (never return password hash!)
      return res.json({
        success: true,
        message: 'Password updated successfully.',
      });
    } catch (err) {
      console.error('[authController.updatePassword] Error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error changing password.' });
    }
  },

  // GET /api/auth/preferences — Fetch user preferences
  async getPreferences(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const sanitized = User.sanitize(user);
      return res.json({
        success: true,
        preferences: sanitized.preferences,
      });
    } catch (err) {
      console.error('[authController.getPreferences] Error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to retrieve preferences.' });
    }
  },

  // PUT /api/auth/preferences — Update user preferences
  async updatePreferences(req, res) {
    try {
      const rawPrefs = req.body || {};
      const cleanPrefs = {};

      // Validate theme
      if (rawPrefs.theme && ['dark', 'light', 'system'].includes(rawPrefs.theme)) {
        cleanPrefs.theme = rawPrefs.theme;
      }

      // Validate defaultThreads
      if (rawPrefs.defaultThreads !== undefined) {
        const threads = parseInt(rawPrefs.defaultThreads, 10);
        if ([1, 2, 4, 8, 16].includes(threads)) {
          cleanPrefs.defaultThreads = threads;
        }
      }

      // Validate defaultHistogramMode
      if (rawPrefs.defaultHistogramMode && ['sequential', 'parallel', 'both'].includes(rawPrefs.defaultHistogramMode)) {
        cleanPrefs.defaultHistogramMode = rawPrefs.defaultHistogramMode;
      }

      // Validate guidedTour
      if (typeof rawPrefs.guidedTour === 'boolean') {
        cleanPrefs.guidedTour = rawPrefs.guidedTour;
      }

      // Validate notifications
      if (rawPrefs.notifications && typeof rawPrefs.notifications === 'object') {
        cleanPrefs.notifications = {};
        const allowedNotifKeys = [
          'experimentCompleted',
          'benchmarkCompleted',
          'correctnessResult',
          'systemMessages',
          'emailNotifications',
        ];
        for (const k of allowedNotifKeys) {
          if (typeof rawPrefs.notifications[k] === 'boolean') {
            cleanPrefs.notifications[k] = rawPrefs.notifications[k];
          }
        }
      }

      const updatedUser = await User.updatePreferences(req.userId, cleanPrefs);
      if (!updatedUser) {
        return res.status(500).json({ success: false, message: 'Failed to update preferences.' });
      }

      return res.json({
        success: true,
        message: 'Preferences updated successfully.',
        preferences: updatedUser.preferences,
        user: updatedUser,
      });
    } catch (err) {
      console.error('[authController.updatePreferences] Error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error updating preferences.' });
    }
  },
};

module.exports = authController;
