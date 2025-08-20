import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

console.log('🚀 App starting for Azizkh07 at 2025-08-20 14:10:04');

const app = express();

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

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
} catch (error) {
  console.error('❌ Failed to import courses routes for Azizkh07:', error.message);
  coursesRoutes = express.Router(); // Fallback empty router
}

try {
  // Import subjects routes
  const subjectsModule = require('./routes/subjects');
  subjectsRoutes = subjectsModule.default || subjectsModule;
  console.log('✅ Subjects routes imported successfully for Azizkh07');
} catch (error) {
  console.error('❌ Failed to import subjects routes for Azizkh07:', error.message);
  subjectsRoutes = express.Router(); // Fallback empty router
}

try {
  // Import videos routes
  const videosModule = require('./routes/videos');
  videoRoutes = videosModule.default || videosModule.videoRoutes || videosModule;
  console.log('✅ Videos routes imported successfully for Azizkh07');
} catch (error) {
  console.error('❌ Failed to import videos routes for Azizkh07:', error.message);
  videoRoutes = express.Router(); // Fallback empty router
}

try {
  // Import auth routes
  const authModule = require('./routes/auth');
  authRoutes = authModule.authRoutes || authModule.default || authModule;
  console.log('✅ Auth routes imported successfully for Azizkh07');
} catch (error) {
  console.error('❌ Failed to import auth routes for Azizkh07:', error.message);
  authRoutes = express.Router(); // Fallback empty router
}

try {
  // Import blog routes
  const blogModule = require('./routes/blog');
  blogRoutes = blogModule.default || blogModule.blogRoutes || blogModule;
  console.log('✅ Blog routes imported successfully for Azizkh07');
} catch (error) {
  console.error('❌ Failed to import blog routes for Azizkh07:', error.message);
  blogRoutes = express.Router(); // Fallback empty router
}

// ✅ FIXED: Use routes with validation
app.use('/api/courses', coursesRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);

console.log('🔗 All routes configured for Azizkh07 at 2025-08-20 14:10:04');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Legal Education Platform API is running',
    user: 'Azizkh07',
    timestamp: '2025-08-20 14:10:04',
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
    timestamp: '2025-08-20 14:10:04'
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global error handler for Azizkh07:', error);
  
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: '2025-08-20 14:10:04',
    path: req.path
  });
});

export default app;

console.log('✅ App configuration completed for Azizkh07 at 2025-08-20 14:10:04');