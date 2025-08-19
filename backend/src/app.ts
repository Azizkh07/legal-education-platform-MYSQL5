import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { coursesRoutes } from './routes/courses';
import { blogRoutes } from './routes/blog';
import { videosRoutes } from './routes/videos';
import { contactRoutes } from './routes/contact';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Create Express app
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

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve uploaded files

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

// Increase payload size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

[uploadsDir, videosDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'video') {
      cb(null, videosDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Export multer instance
export const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 * 1024 } // 20GB limit
});

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
app.use('/api/blog', blogRoutes);
app.use('/api/videos', videosRoutes);
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