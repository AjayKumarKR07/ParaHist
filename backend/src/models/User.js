// User.js — PostgreSQL-backed User Model for ParaHist
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

// Default user preferences for ParaHist laboratory
function getDefaultPreferences() {
  return {
    theme: 'dark',
    defaultThreads: 8,
    defaultHistogramMode: 'both',
    guidedTour: true,
    notifications: {
      experimentCompleted: true,
      benchmarkCompleted: true,
      correctnessResult: true,
      systemMessages: true,
      emailNotifications: false,
    },
  };
}

/**
 * Helper to construct a unified user object from joined database rows.
 */
function mapUserRow(row) {
  if (!row) return null;
  const defaults = getDefaultPreferences();

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password_hash, // internal use only for bcrypt verification
    role: row.role || 'Student',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    preferences: {
      theme: row.theme || defaults.theme,
      defaultThreads: row.default_threads !== undefined && row.default_threads !== null ? parseInt(row.default_threads, 10) : defaults.defaultThreads,
      defaultHistogramMode: row.default_histogram_mode || defaults.defaultHistogramMode,
      guidedTour: row.guided_tour !== undefined && row.guided_tour !== null ? Boolean(row.guided_tour) : defaults.guidedTour,
      notifications: {
        experimentCompleted: row.experiment_completed !== undefined && row.experiment_completed !== null ? Boolean(row.experiment_completed) : defaults.notifications.experimentCompleted,
        benchmarkCompleted: row.benchmark_completed !== undefined && row.benchmark_completed !== null ? Boolean(row.benchmark_completed) : defaults.notifications.benchmarkCompleted,
        correctnessResult: row.correctness_result !== undefined && row.correctness_result !== null ? Boolean(row.correctness_result) : defaults.notifications.correctnessResult,
        systemMessages: row.system_messages !== undefined && row.system_messages !== null ? Boolean(row.system_messages) : defaults.notifications.systemMessages,
        emailNotifications: Boolean(row.email_notifications),
      },
    },
  };
}

const User = {
  getDefaultPreferences,

  // Find a user by lowercase email
  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();
    try {
      const res = await query(
        `SELECT u.*,
                up.theme, up.default_threads, up.default_histogram_mode, up.guided_tour,
                np.experiment_completed, np.benchmark_completed, np.correctness_result, np.system_messages, np.email_notifications
         FROM users u
         LEFT JOIN user_preferences up ON u.id = up.user_id
         LEFT JOIN notification_preferences np ON u.id = np.user_id
         WHERE LOWER(u.email) = $1
         LIMIT 1;`,
        [cleanEmail]
      );
      if (res.rows.length === 0) return null;
      return mapUserRow(res.rows[0]);
    } catch (err) {
      console.error('[User.findByEmail] PostgreSQL error:', err.message);
      return null;
    }
  },

  // Find a user by ID
  async findById(id) {
    if (!id) return null;
    try {
      const res = await query(
        `SELECT u.*,
                up.theme, up.default_threads, up.default_histogram_mode, up.guided_tour,
                np.experiment_completed, np.benchmark_completed, np.correctness_result, np.system_messages, np.email_notifications
         FROM users u
         LEFT JOIN user_preferences up ON u.id = up.user_id
         LEFT JOIN notification_preferences np ON u.id = np.user_id
         WHERE u.id = $1
         LIMIT 1;`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return mapUserRow(res.rows[0]);
    } catch (err) {
      console.error('[User.findById] PostgreSQL error:', err.message);
      return null;
    }
  },

  // Create a new user with hashed password and default preferences
  async create({ name, email, password }) {
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // Hash password with bcryptjs (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = crypto.randomUUID ? crypto.randomUUID() : 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const defaults = getDefaultPreferences();

    // Insert user into PostgreSQL
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'Student', NOW(), NOW());`,
      [userId, cleanName, cleanEmail, hashedPassword]
    );

    // Insert default user_preferences
    await query(
      `INSERT INTO user_preferences (user_id, theme, default_threads, default_histogram_mode, guided_tour)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO NOTHING;`,
      [userId, defaults.theme, defaults.defaultThreads, defaults.defaultHistogramMode, defaults.guidedTour]
    );

    // Insert default notification_preferences
    await query(
      `INSERT INTO notification_preferences (user_id, experiment_completed, benchmark_completed, correctness_result, system_messages, email_notifications)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO NOTHING;`,
      [
        userId,
        defaults.notifications.experimentCompleted,
        defaults.notifications.benchmarkCompleted,
        defaults.notifications.correctnessResult,
        defaults.notifications.systemMessages,
        defaults.notifications.emailNotifications,
      ]
    );

    const createdUser = await User.findById(userId);
    return User.sanitize(createdUser);
  },

  // Compare plaintext password with hashed password
  async comparePassword(candidatePassword, hashedPassword) {
    if (!candidatePassword || !hashedPassword) return false;
    return bcrypt.compare(candidatePassword, hashedPassword);
  },

  // Update profile fields (e.g., name)
  async updateProfile(id, { name }) {
    if (!id) return null;
    const cleanName = typeof name === 'string' ? name.trim() : null;
    if (!cleanName) return null;

    try {
      await query(
        `UPDATE users
         SET name = $1, updated_at = NOW()
         WHERE id = $2;`,
        [cleanName, id]
      );
      const user = await User.findById(id);
      return User.sanitize(user);
    } catch (err) {
      console.error('[User.updateProfile] PostgreSQL error:', err.message);
      return null;
    }
  },

  // Update user password with pre-hashed password
  async updatePassword(id, newHashedPassword) {
    if (!id || !newHashedPassword) return false;
    try {
      await query(
        `UPDATE users
         SET password_hash = $1, updated_at = NOW()
         WHERE id = $2;`,
        [newHashedPassword, id]
      );
      return true;
    } catch (err) {
      console.error('[User.updatePassword] PostgreSQL error:', err.message);
      return false;
    }
  },

  // Update user laboratory preferences
  async updatePreferences(id, newPrefs = {}) {
    if (!id) return null;

    try {
      // 1. Update user_preferences if any general prefs provided
      const prefFields = [];
      const prefValues = [id];
      let pIdx = 2;

      if (newPrefs.theme && ['dark', 'light', 'system'].includes(newPrefs.theme)) {
        prefFields.push(`theme = $${pIdx++}`);
        prefValues.push(newPrefs.theme);
      }
      if (newPrefs.defaultThreads !== undefined) {
        prefFields.push(`default_threads = $${pIdx++}`);
        prefValues.push(parseInt(newPrefs.defaultThreads, 10));
      }
      if (newPrefs.defaultHistogramMode && ['sequential', 'parallel', 'both'].includes(newPrefs.defaultHistogramMode)) {
        prefFields.push(`default_histogram_mode = $${pIdx++}`);
        prefValues.push(newPrefs.defaultHistogramMode);
      }
      if (newPrefs.guidedTour !== undefined) {
        prefFields.push(`guided_tour = $${pIdx++}`);
        prefValues.push(Boolean(newPrefs.guidedTour));
      }

      if (prefFields.length > 0) {
        prefFields.push(`updated_at = NOW()`);
        await query(
          `UPDATE user_preferences
           SET ${prefFields.join(', ')}
           WHERE user_id = $1;`,
          prefValues
        );
      }

      // 2. Update notification_preferences if notifications object provided
      if (newPrefs.notifications && typeof newPrefs.notifications === 'object') {
        const notifFields = [];
        const notifValues = [id];
        let nIdx = 2;

        const notifs = newPrefs.notifications;
        if (notifs.experimentCompleted !== undefined) {
          notifFields.push(`experiment_completed = $${nIdx++}`);
          notifValues.push(Boolean(notifs.experimentCompleted));
        }
        if (notifs.benchmarkCompleted !== undefined) {
          notifFields.push(`benchmark_completed = $${nIdx++}`);
          notifValues.push(Boolean(notifs.benchmarkCompleted));
        }
        if (notifs.correctnessResult !== undefined) {
          notifFields.push(`correctness_result = $${nIdx++}`);
          notifValues.push(Boolean(notifs.correctnessResult));
        }
        if (notifs.systemMessages !== undefined) {
          notifFields.push(`system_messages = $${nIdx++}`);
          notifValues.push(Boolean(notifs.systemMessages));
        }
        if (notifs.emailNotifications !== undefined) {
          notifFields.push(`email_notifications = $${nIdx++}`);
          notifValues.push(Boolean(notifs.emailNotifications));
        }

        if (notifFields.length > 0) {
          notifFields.push(`updated_at = NOW()`);
          await query(
            `UPDATE notification_preferences
             SET ${notifFields.join(', ')}
             WHERE user_id = $1;`,
            notifValues
          );
        }
      }

      const updatedUser = await User.findById(id);
      return User.sanitize(updatedUser);
    } catch (err) {
      console.error('[User.updatePreferences] PostgreSQL error:', err.message);
      return null;
    }
  },

  // Sanitize user object to never expose password or password_hash
  sanitize(user) {
    if (!user) return null;
    const { password, password_hash, ...safeUser } = user;
    const defaults = getDefaultPreferences();

    return {
      id: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role || 'Student',
      createdAt: safeUser.createdAt || new Date().toISOString(),
      updatedAt: safeUser.updatedAt || new Date().toISOString(),
      preferences: {
        ...defaults,
        ...(safeUser.preferences || {}),
        notifications: {
          ...defaults.notifications,
          ...((safeUser.preferences && safeUser.preferences.notifications) || {}),
        },
      },
    };
  },
};

module.exports = User;
