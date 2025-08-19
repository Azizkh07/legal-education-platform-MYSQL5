import express from 'express';
import { pool } from '../database';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Set up storage for uploaded videos and thumbnails
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
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

// File filter for videos and images
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
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
    files: 2 // Allow video + thumbnail
  }
});

// Helper function to check admin access
const isAdmin = (req: AuthRequest): boolean => {
  if (req.user?.isAdmin || req.user?.is_admin || req.user?.role === 'admin') {
    return true;
  }
  return false;
};

// Helper function to get or create default course
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

// Stream video file with CORS support
router.get('/stream/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, '../../public/uploads/videos', filename);
  
  console.log('🎬 Streaming video:', filename);
  console.log('📁 Video path:', videoPath);
  
  if (!fs.existsSync(videoPath)) {
    console.log('❌ Video file not found:', videoPath);
    return res.status(404).json({ error: 'Video not found' });
  }
  
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range');
  res.header('Accept-Ranges', 'bytes');
  
  if (range) {
    // Support for video seeking and partial content
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
      'Access-Control-Allow-Origin': '*'
    };
    res.writeHead(206, head);
    file.pipe(res);
    console.log(`📺 Streaming range ${start}-${end}/${fileSize} for ${filename}`);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
    console.log(`📺 Streaming full video ${filename} (${fileSize} bytes)`);
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
      
      // Always use default course for simplicity
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
      
      // Insert video into database
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

// Delete a video (admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
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
        }
      }
      if (video.thumbnail_path) {
        const fullPath = path.join(__dirname, '../../public', video.thumbnail_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (err) {
      console.error('Error deleting files:', err);
    }
    
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);
    
    console.log('✅ Video deleted successfully');
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export { router as videosRoutes };

// Last updated: 2025-08-19 15:32:15 | Azizkh07