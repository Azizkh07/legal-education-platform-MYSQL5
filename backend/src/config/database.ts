import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false, // Local development
    });

    this.pool.on('connect', () => {
      console.log('🔗 Connected to PostgreSQL database');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Database error:', err);
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const res = await this.pool.query(text, params);
      return res;
    } catch (error) {
      console.error('❌ Query error:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT NOW()');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
}

export default new Database();