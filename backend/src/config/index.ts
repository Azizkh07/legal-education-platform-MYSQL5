import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT - FIX THE TYPES
  jwtSecret: process.env.JWT_SECRET || 'legal-education-platform-super-secret-key-medsaidabidi02-2025',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h', // This should be string
  
  // Database - FROM YOUR .ENV
  databaseUrl: process.env.DATABASE_URL || 'postgresql://legal_app_user:ROOT@localhost:5432/legal_education',
  
  // File Storage
  storage: {
    type: 'local' as const,
    uploadsPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '500') * 1024 * 1024,
    baseUrl: process.env.BASE_URL || 'http://localhost:5000'
  },
  
  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:5000'
} as const;