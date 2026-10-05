// database.js — Reusable PostgreSQL Connection Pool for ParaHist
const { Pool } = require('pg');

// Parse connection configuration
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? { connectionString }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'parahist',
    };

// Pool settings optimized for Express REST API
const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Pool error handling to prevent unhandled process crashes
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool] Unexpected error on idle client:', err.message);
});

/**
 * Execute a query with automatic client checkout and release.
 * @param {string} text - SQL query string
 * @param {Array} [params] - Query parameters
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 50) {
    console.log(`[SQL] ${duration}ms query:`, text.substring(0, 80));
  }
  return res;
}

/**
 * Test database connectivity with a lightweight probe.
 * Does not throw; logs status and returns boolean.
 */
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS current_time, current_database() AS db;');
    console.log(`✓ PostgreSQL connected: database "${res.rows[0].db}" at ${res.rows[0].current_time.toISOString()}`);
    return true;
  } catch (err) {
    // Sanitize message: never expose credentials or connection strings in logs
    console.warn(`⚠ PostgreSQL connection notice: Unable to connect to database "${poolConfig.database || 'parahist'}". Error: ${err.message}`);
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection,
};
