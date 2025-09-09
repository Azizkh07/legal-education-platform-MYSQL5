import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { URL } from 'url';

// Load environment variables
dotenv.config();

console.log('🗄️ FIXED Database connection for Medsaidabidi02 - 2025-09-09 15:48:55');

// Parse DATABASE_URL or use individual environment variables
let dbConfig: any;

if (process.env.DATABASE_URL) {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbConfig = {
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port) || 3307,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1), // Remove leading slash
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      ssl: false
    };
    
    console.log('✅ Using DATABASE_URL for Medsaidabidi02:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      hasPassword: !!dbConfig.password
    });
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format for Medsaidabidi02:', error);
    throw new Error('Invalid DATABASE_URL format');
  }
} else {
  // Fallback to individual environment variables
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'legal_education_platform',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    ssl: false
  };
  
  console.log('⚠️ Using fallback individual DB vars for Medsaidabidi02');
}

console.log('⚙️ Creating MySQL pool for Medsaidabidi02 with config:', {
  ...dbConfig,
  password: dbConfig.password ? '[HIDDEN]' : '[EMPTY]'
});

const pool = mysql.createPool(dbConfig);

// Enhanced query helper that handles undefined values
export const query = async (sql: string, params: any[] = []) => {
  try {
    console.log('🔍 Executing query for Medsaidabidi02:', {
      sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      paramCount: params.length,
      timestamp: '2025-09-09 15:48:55'
    });

    // Convert undefined values to null for MySQL compatibility
    const cleanParams = params.map(param => param === undefined ? null : param);
    
    const [rows, fields] = await pool.execute(sql, cleanParams);
    
    console.log('✅ Query executed successfully for Medsaidabidi02');
    return { rows: rows as any[], fields };
  } catch (error: any) {
    console.error('❌ Database query error for Medsaidabidi02:', error);
    console.error('📄 Failed SQL:', sql);
    console.error('📋 Failed params:', params);
    
    // Provide more specific error information
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 ACCESS DENIED - Check your MySQL credentials for Medsaidabidi02');
      console.error('💡 Current DATABASE_URL user:', dbConfig.user);
      console.error('💡 Try updating your DATABASE_URL in .env file');
    }
    
    throw error;
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection for Medsaidabidi02...');
    const result = await query('SELECT 1 as test, NOW() as current_time, USER() as current_user');
    console.log('✅ Database connection test successful for Medsaidabidi02:', result.rows[0]);
    return true;
  } catch (error: any) {
    console.error('❌ Database connection test failed for Medsaidabidi02:', error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 SOLUTION: Check your DATABASE_URL credentials');
      console.error('🔐 Current DATABASE_URL format: mysql://user:password@host:port/database');
      console.error('🔐 Your DATABASE_URL: mysql://legal_app_user:ROOT@localhost:3307/legal_education_mysql5');
    }
    
    return false;
  }
};

export { pool };
export default { query, testConnection };