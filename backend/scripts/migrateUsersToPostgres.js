// migrateUsersToPostgres.js — Safe migration of users.json to PostgreSQL
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/config/database');
const { initDatabase } = require('../src/config/initDatabase');

const USERS_FILE = path.join(__dirname, '../data/users.json');

async function migrateUsers() {
  console.log('\n==================================================');
  console.log('  ParaHist — users.json to PostgreSQL Migration   ');
  console.log('==================================================\n');

  if (!fs.existsSync(USERS_FILE)) {
    console.log(`[Migration] users.json not found at: ${USERS_FILE}. Nothing to migrate.`);
    return { success: true, count: 0 };
  }

  let users = [];
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(raw);
  } catch (err) {
    console.error('[Migration] Failed to parse users.json:', err.message);
    return { success: false, error: err.message };
  }

  if (!Array.isArray(users) || users.length === 0) {
    console.log('[Migration] No users found in users.json to migrate.');
    return { success: true, count: 0 };
  }

  console.log(`[Migration] Found ${users.length} user(s) in users.json. Connecting to database...`);

  // Ensure tables and schema exist
  await initDatabase();

  let migratedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    if (!user.email || !user.password) {
      console.warn(`[Migration] Skipping invalid user entry missing email or password hash.`);
      continue;
    }

    const cleanEmail = user.email.trim().toLowerCase();
    const cleanName = user.name ? user.name.trim() : 'User';
    const role = user.role || 'Student';
    const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();

    try {
      // Check if user already exists
      const existing = await query('SELECT id, email FROM users WHERE LOWER(email) = $1;', [cleanEmail]);
      if (existing.rows.length > 0) {
        skippedCount++;
        continue;
      }

      const userId = user.id || require('crypto').randomUUID();

      // Insert into users
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (email) DO NOTHING;`,
        [userId, cleanName, cleanEmail, user.password, role, createdAt]
      );

      // Extract and insert user_preferences
      const prefs = user.preferences || {};
      const theme = prefs.theme || 'dark';
      const defaultThreads = parseInt(prefs.defaultThreads || 8, 10);
      const defaultHistogramMode = prefs.defaultHistogramMode || 'both';
      const guidedTour = prefs.guidedTour !== undefined ? Boolean(prefs.guidedTour) : true;

      await query(
        `INSERT INTO user_preferences (user_id, theme, default_threads, default_histogram_mode, guided_tour)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           theme = EXCLUDED.theme,
           default_threads = EXCLUDED.default_threads,
           default_histogram_mode = EXCLUDED.default_histogram_mode,
           guided_tour = EXCLUDED.guided_tour;`,
        [userId, theme, defaultThreads, defaultHistogramMode, guidedTour]
      );

      // Extract and insert notification_preferences
      const notifs = prefs.notifications || {};
      const expCompleted = notifs.experimentCompleted !== undefined ? Boolean(notifs.experimentCompleted) : true;
      const benchCompleted = notifs.benchmarkCompleted !== undefined ? Boolean(notifs.benchmarkCompleted) : true;
      const correctnessRes = notifs.correctnessResult !== undefined ? Boolean(notifs.correctnessResult) : true;
      const sysMessages = notifs.systemMessages !== undefined ? Boolean(notifs.systemMessages) : true;
      const emailNotifs = notifs.emailNotifications !== undefined ? Boolean(notifs.emailNotifications) : false;

      await query(
        `INSERT INTO notification_preferences (user_id, experiment_completed, benchmark_completed, correctness_result, system_messages, email_notifications)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           experiment_completed = EXCLUDED.experiment_completed,
           benchmark_completed = EXCLUDED.benchmark_completed,
           correctness_result = EXCLUDED.correctness_result,
           system_messages = EXCLUDED.system_messages,
           email_notifications = EXCLUDED.email_notifications;`,
        [userId, expCompleted, benchCompleted, correctnessRes, sysMessages, emailNotifs]
      );

      migratedCount++;
    } catch (err) {
      console.error(`[Migration] Error migrating user ${cleanEmail}:`, err.message);
    }
  }

  console.log('\n[Migration Summary]');
  console.log(`- Successfully migrated : ${migratedCount} user(s)`);
  console.log(`- Skipped (already exist): ${skippedCount} user(s)`);
  console.log(`- Total processed       : ${users.length} user(s)`);
  console.log(`- users.json backup     : Preserved safely at ${USERS_FILE}\n`);

  return { success: true, migrated: migratedCount, skipped: skippedCount };
}

// Allow direct CLI execution: node backend/scripts/migrateUsersToPostgres.js
if (require.main === module) {
  migrateUsers()
    .then(() => pool.end())
    .catch((err) => {
      console.error('[Migration] Fatal error:', err.message);
      pool.end();
      process.exit(1);
    });
}

module.exports = { migrateUsers };
