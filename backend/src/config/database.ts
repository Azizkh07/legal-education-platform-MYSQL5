import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  private pool: mysql.Pool;

  constructor() {
    // Parse the DATABASE_URL or use individual components
    const dbUrl = process.env.DATABASE_URL;
    let connectionConfig: mysql.PoolOptions;

    if (dbUrl) {
      // Parse MySQL URL format: mysql://user:password@host:port/database
      const url = new URL(dbUrl);
      connectionConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 3307, // Default to 3307
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        charset: 'utf8mb4'
      };
    } else {
      // Fallback to individual environment variables
      connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3307'),
        user: process.env.DB_USER || 'legal_app_user',
        password: process.env.DB_PASSWORD || 'ROOT',
        database: process.env.DB_NAME || 'legal_education_mysql5',
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        charset: 'utf8mb4'
      };
    }

    this.pool = mysql.createPool(connectionConfig);

    // Test connection
    this.testConnection();
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const [rows] = await this.pool.execute(text, params);
      return { rows };
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
      const [rows] = await this.pool.execute('SELECT NOW() as now');
      console.log('🔗 Connected to MySQL database on port 3307');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  // Get pool for advanced operations
  getPool(): mysql.Pool {
    return this.pool;
  }
}

export default new Database();