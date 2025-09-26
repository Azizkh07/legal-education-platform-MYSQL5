import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  private pool: mysql.Pool;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    let connectionConfig: mysql.PoolOptions;

    if (dbUrl) {
      const url = new URL(dbUrl);
      connectionConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 3307,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0,
        charset: 'utf8mb4'
      };
    } else {
      connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3307'),
        user: process.env.DB_USER || 'legal_app_user',
        password: process.env.DB_PASSWORD || 'ROOT',
        database: process.env.DB_NAME || 'legal_education_mysql5',
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0,
        charset: 'utf8mb4'
      };
    }

    this.pool = mysql.createPool(connectionConfig);
    this.testConnection();
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const [rows, fields] = await this.pool.execute(text, params);
      
      // Handle INSERT/UPDATE/DELETE results
      if (rows && typeof rows === 'object' && 'insertId' in rows) {
        return {
          rows: [],
          fields,
          insertId: (rows as any).insertId,
          affectedRows: (rows as any).affectedRows
        };
      }
      
      // Handle SELECT results
      return { 
        rows: Array.isArray(rows) ? rows : [], 
        fields,
        insertId: undefined,
        affectedRows: undefined
      };
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async testConnection(): Promise<boolean> {
    try {
      const [rows] = await this.pool.execute('SELECT NOW() as now');
      console.log('🔗 Connected to MySQL database');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  getPool(): mysql.Pool {
    return this.pool;
  }
}

export default new Database();