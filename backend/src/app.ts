import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { usersRoutes } from './routes/users';
import { userCoursesRoutes } from './routes/userCourses';
import { debugRoutes } from './routes/debug';

console.log('🚀 App starting for Azizkh07 at 2025-08-20 14:10:04');

const app = express();

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------------------------------------------------------------------
// CORS configuration - explicit to allow Authorization header and preflight
// ---------------------------------------------------------------------------
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://yourdomain.com']
  : ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin as string) !== -1) {
      return callback(null, true);
    }
    // For development convenience you can allow all origins by uncommenting below
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Use configured CORS and ensure preflight responses are handled before other middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Extra safety: set CORS/headers on every response (no-op if cors already handled)
app.use((req, res, next) => {
  const origin = req.header('origin') || '*';
  // In production you probably want to echo allowed origin only
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  // if this is a preflight request end it here
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
// ---------------------------------------------------------------------------

// Security middleware (disabled for development)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  
  // Rate limiting for production
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);
  console.log('🔒 Security middleware enabled for production');
} else {
  console.log('⚠️ Rate limiting DISABLED for development - Azizkh07');
}

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ✅ FIXED: Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('📁 Static file serving enabled for uploads - Azizkh07');

// ✅ FIXED: Import routes with proper error handling
console.log('🔗 Setting up routes for Azizkh07...');

let coursesRoutes, subjectsRoutes, videoRoutes, authRoutes, blogRoutes;

try {
  // Import courses routes
  const coursesModule = require('./routes/courses');
  coursesRoutes = coursesModule.default || coursesModule;
  console.log('✅ Courses routes imported successfully for Azizkh07');
} catch (error: any) {
  console.error('❌ Failed to import courses routes for Azizkh07:', error.message || error);
  coursesRoutes = express.Router(); // Fallback empty router
}

try {
  // Import subjects routes
  const subjectsModule = require('./routes/subjects');
  subjectsRoutes = subjectsModule.default || subjectsModule;
  console.log('✅ Subjects routes imported successfully for Azizkh07');
} catch (error: any) {
  console.error('❌ Failed to import subjects routes for Azizkh07:', error.message || error);
  subjectsRoutes = express.Router(); // Fallback empty router
}

try {
  // Import videos routes
  const videosModule = require('./routes/videos');
  videoRoutes = videosModule.default || videosModule.videoRoutes || videosModule;
  console.log('✅ Videos routes imported successfully for Azizkh07');
} catch (error: any) {
  console.error('❌ Failed to import videos routes for Azizkh07:', error.message || error);
  videoRoutes = express.Router(); // Fallback empty router
}

try {
  // Import auth routes
  const authModule = require('./routes/auth');
  authRoutes = authModule.authRoutes || authModule.default || authModule;
  console.log('✅ Auth routes imported successfully for Azizkh07');
} catch (error: any) {
  console.error('❌ Failed to import auth routes for Azizkh07:', error.message || error);
  authRoutes = express.Router(); // Fallback empty router
}

try {
  // Import blog routes
  const blogModule = require('./routes/blog');
  blogRoutes = blogModule.default || blogModule.blogRoutes || blogModule;
  console.log('✅ Blog routes imported successfully for Azizkh07');
} catch (error: any) {
  console.error('❌ Failed to import blog routes for Azizkh07:', error.message || error);
  blogRoutes = express.Router(); // Fallback empty router
}

// ✅ FIXED: Use routes with validation
app.use('/api/courses', coursesRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/user-courses', userCoursesRoutes);
app.use('/api/debug', debugRoutes);

console.log('🔗 All routes configured for Azizkh07 at 2025-08-20 14:10:04');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Legal Education Platform API is running',
    user: 'Azizkh07',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Catch-all for undefined routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404: Route not found for Azizkh07: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global error handler for Azizkh07:', error);
  
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

export default app;

console.log('✅ App configuration completed for Azizkh07 at 2025-08-20 14:10:04');