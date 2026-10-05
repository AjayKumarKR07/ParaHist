// User.js — Clean, persistent JSON-backed User model
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

// Ensure data directory and users.json file exist
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read all users from disk
function getAllUsers() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[User Model] Error reading users file:', err.message);
    return [];
  }
}

// Save all users to disk safely (atomic write via temp file)
function saveAllUsers(users) {
  ensureStorage();
  const tmpFile = USERS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(users, null, 2), 'utf-8');
  fs.renameSync(tmpFile, USERS_FILE);
}

// User helper methods
const User = {
  getDefaultPreferences,

  // Find a user by lowercase email
  findByEmail(email) {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();
    const users = getAllUsers();
    return users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  // Find a user by ID
  findById(id) {
    if (!id) return null;
    const users = getAllUsers();
    return users.find(u => u.id === id) || null;
  },

  // Create a new user with hashed password and default preferences
  async create({ name, email, password }) {
    ensureStorage();
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // Hash password with bcryptjs (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: 'Student',
      createdAt: new Date().toISOString(),
      preferences: getDefaultPreferences(),
    };

    const users = getAllUsers();
    users.push(newUser);
    saveAllUsers(users);

    return User.sanitize(newUser);
  },

  // Compare plaintext password with hashed password
  async comparePassword(candidatePassword, hashedPassword) {
    if (!candidatePassword || !hashedPassword) return false;
    return bcrypt.compare(candidatePassword, hashedPassword);
  },

  // Update profile fields (e.g., name)
  updateProfile(id, { name }) {
    if (!id) return null;
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    if (name && typeof name === 'string' && name.trim().length > 0) {
      users[idx].name = name.trim();
    }

    saveAllUsers(users);
    return User.sanitize(users[idx]);
  },

  // Update user password with pre-hashed password
  async updatePassword(id, newHashedPassword) {
    if (!id || !newHashedPassword) return false;
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;

    users[idx].password = newHashedPassword;
    saveAllUsers(users);
    return true;
  },

  // Update user laboratory preferences
  updatePreferences(id, newPrefs = {}) {
    if (!id) return null;
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    const currentPrefs = users[idx].preferences || getDefaultPreferences();
    const mergedNotifications = {
      ...(currentPrefs.notifications || getDefaultPreferences().notifications),
      ...(newPrefs.notifications || {}),
    };

    users[idx].preferences = {
      ...currentPrefs,
      ...newPrefs,
      notifications: mergedNotifications,
    };

    saveAllUsers(users);
    return User.sanitize(users[idx]);
  },

  // Sanitize user object to never expose password and ensure backwards compatibility
  sanitize(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    const defaults = getDefaultPreferences();
    return {
      ...safeUser,
      role: safeUser.role || 'Student',
      createdAt: safeUser.createdAt || new Date().toISOString(),
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
