import express from 'express';
import { pool } from '../database';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();

console.log('🔗 SECURE Video routes module loaded');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;
    if (file.fieldname === 'video') {
      uploadDir = path.join(__dirname, '../../public/uploads/videos');
    } else if (file.fieldname === 'thumbnail') {
      uploadDir = path.join(__dirname, '../../public/uploads/thumbnails');
    } else {
      uploadDir = path.join(__dirname, '../../public/uploads');
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Not a video file!') as any);
    }
  } else if (file.fieldname === 'thumbnail') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image file!') as any);
    }
  } else {
    cb(new Error('Unexpected field name!') as any);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB for videos
    files: 2 // Video + thumbnail
  }
});

// Helper functions
const isAdmin = (req: AuthRequest): boolean => {
  return req.user?.isAdmin || req.user?.is_admin || req.user?.role === 'admin' || false;
};

const getDefaultCourseId = async (): Promise<number> => {
  try {
    let result = await pool.query(
      "SELECT id FROM courses WHERE title = 'General Videos' OR title = 'Default' ORDER BY id LIMIT 1"
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    
    result = await pool.query(`
      INSERT INTO courses (title, description, is_active, created_at, updated_at)
      VALUES ('General Videos', 'Videos not assigned to a specific course', true, NOW(), NOW())
      RETURNING id
    `);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ Error getting/creating default course:', error);
    return 1;
  }
};

// Verify user access to video with enhanced security
const verifyVideoAccess = async (userId: number | undefined, videoId?: number): Promise<boolean> => {
  // Allow preview access for 10 seconds even without login
  if (!userId) {
    return true; // Allow preview access
  }
  
  // Admin can access everything
  const userResult = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length > 0 && userResult.rows[0].is_admin) {
    return true;
  }
  
  // Regular users can access all videos (for now - you can add enrollment logic later)
  return true;
};

// Get all videos (public route)
router.get('/', async (req: AuthRequest, res) => {
  try {
    console.log('📹 Getting all videos...');
    
    const result = await pool.query(`
      SELECT v.*, c.title as course_title 
      FROM videos v 
      LEFT JOIN courses c ON v.course_id = c.id
      WHERE v.is_active = true
      ORDER BY v.created_at DESC
    `);

    console.log(`✅ Found ${result.rows.length} active videos`);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
});

// Get single video details
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    console.log(`📹 Getting video ${id}...`);
    
    // Admin can see any video
    if (req.user && isAdmin(req)) {
      const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      return res.json(result.rows[0]);
    }
    
    // For non-admin users, only show active videos
    const result = await pool.query(`
      SELECT v.*, c.title as course_title 
      FROM videos v 
      LEFT JOIN courses c ON v.course_id = c.id
      WHERE v.id = $1 AND v.is_active = true
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found or not available' });
    }
    
    console.log(`✅ Found video: ${result.rows[0].title}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// SECURE VIDEO STREAMING with authentication and anti-download protection
router.get('/stream/:filename', async (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, '../../public/uploads/videos', filename);
  const authHeader = req.headers.authorization;
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers.referer || '';
  
  console.log('🎬 Secure streaming request for:', filename);
  console.log('🔒 Auth header present:', !!authHeader);
  console.log('🖥️ User agent:', userAgent);
  console.log('🔗 Referer:', referer);
  
  if (!fs.existsSync(videoPath)) {
    console.log('❌ Video file not found:', videoPath);
    return res.status(404).json({ error: 'Video not found' });
  }
  
  let userId: number | undefined;
  let isAuthenticated = false;
  
  // Check authentication
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key') as any;
      userId = decoded.id;
      isAuthenticated = true;
      console.log('✅ User authenticated:', decoded.email);
    } catch (error) {
      console.log('❌ Invalid token:', error);
    }
  }
  
  // Verify access
  const hasAccess = await verifyVideoAccess(userId);
  if (!hasAccess) {
    console.log('❌ Access denied for user:', userId);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  // Enhanced anti-download security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; media-src 'self'");
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');
  
  // Prevent caching and downloads
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Make it harder to download
  res.setHeader('Content-Disposition', 'inline; filename=""');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive, noimageindex');
  
  // CORS headers for video streaming (restricted to your domain)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');
  res.setHeader('Accept-Ranges', 'bytes');
  
  // For non-authenticated users, limit to small chunks (for 10-second preview)
  if (!isAuthenticated) {
    const maxPreviewSize = Math.min(fileSize, 3 * 1024 * 1024); // 3MB max for preview
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = Math.min(parts[1] ? parseInt(parts[1], 10) : start + maxPreviewSize, start + maxPreviewSize, fileSize - 1);
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      
      console.log(`📺 Streaming preview ${start}-${end}/${fileSize} for ${filename}`);
      file.pipe(res);
    } else {
      const end = maxPreviewSize - 1;
      const file = fs.createReadStream(videoPath, { start: 0, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes 0-${end}/${fileSize}`,
        'Content-Length': maxPreviewSize,
        'Content-Type': 'video/mp4'
      });
      
      console.log(`📺 Streaming preview 0-${end}/${fileSize} for ${filename}`);
      file.pipe(res);
    }
  } else {
    // Full video streaming for authenticated users
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      
      console.log(`📺 Streaming full range ${start}-${end}/${fileSize} for ${filename}`);
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      });
      
      console.log(`📺 Streaming full video ${filename} (${fileSize} bytes)`);
      fs.createReadStream(videoPath).pipe(res);
    }
  }
});

// Create a new video (admin only)
router.post('/', 
  authenticateToken,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), 
  async (req: AuthRequest, res) => {
    try {
      console.log('📤 Upload request received...');
      
      if (!isAdmin(req)) {
        console.log('❌ Access denied - not admin');
        return res.status(403).json({ 
          error: 'Admin access required',
          details: 'You must be logged in as an admin to upload videos'
        });
      }
      
      console.log('✅ Admin access confirmed');
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.video || files.video.length === 0) {
        console.log('❌ No video file uploaded');
        return res.status(400).json({ error: 'No video file uploaded' });
      }
      
      const videoFile = files.video[0];
      const thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;
      
      const { title, description, course_id } = req.body;
      const is_active = req.body.is_active === 'true';
      
      const finalCourseId = await getDefaultCourseId();
      
      const file_path = `/uploads/videos/${videoFile.filename}`;
      const file_size = videoFile.size;
      const mime_type = videoFile.mimetype;
      
      let thumbnail_path = null;
      if (thumbnailFile) {
        thumbnail_path = `/uploads/thumbnails/${thumbnailFile.filename}`;
      }
      
      console.log('💾 Saving to database...', {
        title,
        description,
        course_id: finalCourseId,
        file_path,
        thumbnail_path,
        file_size,
        is_active
      });
      
      const result = await pool.query(`
        INSERT INTO videos (
          title, description, course_id, file_path, file_size, 
          mime_type, thumbnail_path, is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [
        title, 
        description || null, 
        finalCourseId,
        file_path,
        file_size,
        mime_type,
        thumbnail_path,
        is_active
      ]);
      
      console.log('✅ Video uploaded successfully:', result.rows[0]);
      res.status(201).json(result.rows[0]);
      
    } catch (error) {
      console.error('❌ Create video error:', error);
      res.status(500).json({ 
        error: 'Failed to create video',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Update a video (admin only)
router.put('/:id', 
  authenticateToken,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), 
  async (req: AuthRequest, res) => {
    try {
      console.log(`📝 Updating video ${req.params.id}...`);
      
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { id } = req.params;
      const { title, description, course_id } = req.body;
      const is_active = req.body.is_active === 'true';
      
      // Check if video exists
      const checkResult = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Handle course_id for update
      let finalCourseId = checkResult.rows[0].course_id; // Keep existing if not provided
      if (course_id && course_id !== 'null' && course_id !== '') {
        finalCourseId = parseInt(course_id);
      }
      
      let updateQuery = `
        UPDATE videos
        SET title = $1, description = $2, course_id = $3, is_active = $4, updated_at = NOW()
      `;
      
      let params = [title, description, finalCourseId, is_active];
      
      // If new video file uploaded, update file fields
      if (files && files.video && files.video.length > 0) {
        const videoFile = files.video[0];
        const file_path = `/uploads/videos/${videoFile.filename}`;
        const file_size = videoFile.size;
        const mime_type = videoFile.mimetype;
        
        // Delete old video file if possible
        try {
          const oldFilePath = checkResult.rows[0].file_path;
          if (oldFilePath) {
            const fullPath = path.join(__dirname, '../../public', oldFilePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }
        } catch (err) {
          console.error('Error deleting old video file:', err);
        }
        
        updateQuery += `, file_path = $${params.length + 1}, file_size = $${params.length + 2}, mime_type = $${params.length + 3}`;
        params.push(file_path, file_size, mime_type);
      }
      
      // If new thumbnail uploaded, update thumbnail field
      if (files && files.thumbnail && files.thumbnail.length > 0) {
        const thumbnailFile = files.thumbnail[0];
        const thumbnail_path = `/uploads/thumbnails/${thumbnailFile.filename}`;
        
        // Delete old thumbnail file if possible
        try {
          const oldThumbnailPath = checkResult.rows[0].thumbnail_path;
          if (oldThumbnailPath) {
            const fullPath = path.join(__dirname, '../../public', oldThumbnailPath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }
        } catch (err) {
          console.error('Error deleting old thumbnail file:', err);
        }
        
        updateQuery += `, thumbnail_path = $${params.length + 1}`;
        params.push(thumbnail_path);
      }
      
      updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
      params.push(id);
      
      const result = await pool.query(updateQuery, params);
      
      console.log(`✅ Updated video: ${title}`);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update video error:', error);
      res.status(500).json({ error: 'Failed to update video' });
    }
  }
);

// Delete a video (admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log(`🗑️ Deleting video ${req.params.id}...`);
    
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    const videoResult = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    
    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = videoResult.rows[0];
    
    // Delete files
    try {
      if (video.file_path) {
        const fullPath = path.join(__dirname, '../../public', video.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('🗑️ Deleted video file:', fullPath);
        }
      }
      if (video.thumbnail_path) {
        const fullPath = path.join(__dirname, '../../public', video.thumbnail_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('🗑️ Deleted thumbnail file:', fullPath);
        }
      }
    } catch (err) {
      console.error('Error deleting files:', err);
    }
    
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);
    
    console.log(`✅ Video deleted successfully: ${video.title}`);
    res.json({ 
      message: 'Video deleted successfully',
      deletedVideo: {
        id: video.id,
        title: video.title
      }
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Get admin video statistics
router.get('/admin/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('📊 Getting video admin stats...');
    
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_videos,
        COUNT(*) FILTER (WHERE is_active = true) as active_videos,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_videos,
        SUM(file_size) as total_size,
        AVG(file_size) as average_size,
        COUNT(DISTINCT course_id) as courses_with_videos
      FROM videos
    `);

    const recentVideos = await pool.query(`
      SELECT title, created_at, file_size
      FROM videos 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('✅ Video stats retrieved');
    res.json({
      ...stats.rows[0],
      recent_videos: recentVideos.rows
    });
  } catch (error) {
    console.error('❌ Get video stats error:', error);
    res.status(500).json({ error: 'Failed to get video stats' });
  }
});

// Handle OPTIONS requests for CORS
router.options('/stream/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

export { router as videosRoutes };

// Last updated: 2025-08-19 16:10:29 | Azizkh07