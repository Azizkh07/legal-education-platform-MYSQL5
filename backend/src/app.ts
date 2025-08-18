import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { coursesRoutes } from './routes/courses';
import { blogRoutes } from './routes/blog';  // 🔥 USE BLOG INSTEAD
import { videosRoutes } from './routes/videos';
import { usersRoutes } from './routes/users';
import { contactRoutes } from './routes/contact';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", "data:", "blob:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add logging for file access
app.use('/uploads', (req, res, next) => {
  console.log(`📁 File access: ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/blog', blogRoutes);     // 🔥 MAIN BLOG ROUTES
app.use('/api/videos', authenticateToken, videosRoutes);
app.use('/api/user', authenticateToken, usersRoutes);
app.use('/api/contact', contactRoutes);

// Add placeholder image routes for development
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.redirect(`https://via.placeholder.com/${width}x${height}/06B6D4/ffffff?text=Legal+Education`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    storage: 'local'
  });
});

app.use(errorHandler);

export default app;