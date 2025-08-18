"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Database {
    constructor() {
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: false,
        });
        this.pool.on('connect', () => {
            console.log('🔗 Connected to PostgreSQL database');
        });
        this.pool.on('error', (err) => {
            console.error('❌ Database error:', err);
        });
    }
    async query(text, params) {
        try {
            const res = await this.pool.query(text, params);
            return res;
        }
        catch (error) {
            console.error('❌ Query error:', error);
            throw error;
        }
    }
    async close() {
        await this.pool.end();
    }
    async testConnection() {
        try {
            await this.query('SELECT NOW()');
            return true;
        }
        catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }
}
exports.default = new Database();
