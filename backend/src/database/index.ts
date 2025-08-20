import { Pool } from 'pg';
import { config } from '../config';

// Use DATABASE_URL directly (your format)
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database for Azizkh07 at 2025-08-20 13:03:29');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error for Azizkh07:', err);
});

// Test query on startup
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database test query failed for Azizkh07:', err);
  } else {
    console.log('✅ Database test query successful for Azizkh07:', result.rows[0]);
  }
});