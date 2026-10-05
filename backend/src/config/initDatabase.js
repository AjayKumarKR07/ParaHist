// initDatabase.js — Idempotent PostgreSQL Schema Initializer for ParaHist
const { query } = require('./database');

/**
 * Initializes the database schema using CREATE TABLE IF NOT EXISTS.
 * Safe to run on every application startup.
 * Never drops tables, never deletes existing data.
 */
async function initDatabase() {
  try {
    console.log('[initDatabase] Checking/verifying ParaHist PostgreSQL schema...');

    // 1. Table: users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Student',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Table: user_preferences
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'dark',
        default_threads INTEGER DEFAULT 8,
        default_histogram_mode VARCHAR(20) DEFAULT 'both',
        guided_tour BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Table: notification_preferences
    await query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        experiment_completed BOOLEAN DEFAULT true,
        benchmark_completed BOOLEAN DEFAULT true,
        correctness_result BOOLEAN DEFAULT true,
        system_messages BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Table: experiments
    await query(`
      CREATE TABLE IF NOT EXISTS experiments (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        threads INTEGER NOT NULL,
        sequential_ms DOUBLE PRECISION,
        parallel_ms DOUBLE PRECISION,
        speedup DOUBLE PRECISION,
        efficiency DOUBLE PRECISION,
        correctness BOOLEAN DEFAULT true,
        mismatched_bins INTEGER DEFAULT 0,
        sequential_total BIGINT,
        parallel_total BIGINT,
        expected_total BIGINT DEFAULT 32928000,
        bin_count INTEGER DEFAULT 256,
        most_frequent_pixel INTEGER,
        most_frequent_count BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Table: experiment_histogram
    await query(`
      CREATE TABLE IF NOT EXISTS experiment_histogram (
        id BIGSERIAL PRIMARY KEY,
        experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
        pixel_value INTEGER NOT NULL CHECK (pixel_value >= 0 AND pixel_value <= 255),
        sequential_count BIGINT NOT NULL,
        parallel_count BIGINT NOT NULL
      );
    `);

    // 6. Table: benchmark_runs
    await query(`
      CREATE TABLE IF NOT EXISTS benchmark_runs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        threads INTEGER NOT NULL,
        sequential_ms DOUBLE PRECISION,
        parallel_ms DOUBLE PRECISION,
        speedup DOUBLE PRECISION,
        efficiency DOUBLE PRECISION,
        min_time DOUBLE PRECISION,
        max_time DOUBLE PRECISION,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Indexes (Section 20)
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_experiments_user_id ON experiments(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON experiments(created_at DESC);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_benchmark_runs_user_id ON benchmark_runs(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_experiment_histogram_exp_id ON experiment_histogram(experiment_id);`);

    console.log('✓ ParaHist PostgreSQL schema and indexes verified successfully.');
    return true;
  } catch (err) {
    console.error('⚠ [initDatabase] Error initializing schema:', err.message);
    return false;
  }
}

module.exports = { initDatabase };
