"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const config_1 = require("../config");
exports.pool = new pg_1.Pool({
    connectionString: config_1.config.databaseUrl,
    ssl: config_1.config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});
exports.pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});
exports.pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('❌ Database test query failed:', err);
    }
    else {
        console.log('✅ Database test query successful:', result.rows[0]);
    }
});
