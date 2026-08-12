const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Uncomment if your VPS Postgres requires SSL (e.g. managed DB providers)
  // ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error on idle client', err);
});

/**
 * Simple query helper. Use this everywhere instead of importing pg directly
 * so we have a single place to add logging / metrics later.
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV !== 'production') {
    console.log('SQL', { text, duration: Date.now() - start, rows: res.rowCount });
  }
  return res;
}

async function getClient() {
  // Use this when you need a transaction: BEGIN / COMMIT / ROLLBACK
  const client = await pool.connect();
  return client;
}

module.exports = { pool, query, getClient };
