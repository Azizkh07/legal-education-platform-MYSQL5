import { Router } from 'express';
import { pool } from '../database/index';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

console.log('🎬 FIXED Videos API loaded for Azizkh07 - 2025-08-20 14:13:22');

// ✅ FIXED: Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = '';
    
    if (file.fieldname === 'video') {
      uploadPath = 'uploads/videos';
    } else if (file.fieldname === 'thumbnail') {
      uploadPath = 'uploads/thumbnails';
    } else {
      uploadPath = 'uploads';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`📁 Created directory: ${uploadPath} for Azizkh07`);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    console.log(`📝 Generated filename for Azizkh07: ${filename}`);
    cb(null, filename);
  }
});

// File filter for validation
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log(`🔍 Validating file for Azizkh07: ${file.fieldname} - ${file.originalname}`);
  
  if (file.fieldname === 'video') {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for video field'));
    }
  } else if (file.fieldname === 'thumbnail') {
    // Accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnail field'));
    }
  } else {
    cb(new Error('Unexpected field'));
  }
};

// ✅ FIXED: Create multer instance with proper configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 * 1024, // 20GB for videos
    fieldSize: 10 * 1024 * 1024 // 10MB for other fields
  }
});

// Simple auth bypass for development
const simpleAuth = (req: any, res: any, next: any) => {
  console.log('🔓 Using simple auth bypass for videos - Azizkh07');
  req.user = { id: 1, name: 'Azizkh07', email: 'admin@cliniquejuriste.com', is_admin: true };
  next();
};

// GET all videos with subject/course info
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/videos - Real data for Azizkh07 at 2025-08-20 14:13:22');
    
    const result = await pool.query(`
      SELECT 
        v.*,
        v.video_path,
        v.file_path,
        s.title as subject_title,
        s.professor_name,
        c.title as course_title,
        c.id as course_id
      FROM videos v
      LEFT JOIN subjects s ON v.subject_id = s.id
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE v.is_active = true
      ORDER BY v.created_at DESC
    `);
    
    // Transform data to ensure video_path is available
    const videos = result.rows.map(video => ({
      ...video,
      video_path: video.video_path || video.file_path // Fallback to file_path if video_path is null
    }));
    
    console.log(`✅ Found ${videos.length} videos for Azizkh07`);
    res.json(videos);
    
  } catch (error) {
    console.error('❌ Database error for Azizkh07:', error);
    res.status(500).json({ message: 'Database error fetching videos' });
  }
});

// ✅ ADDED: GET /api/videos/admin/stats endpoint
router.get('/admin/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/videos/admin/stats - Stats for Azizkh07 at 2025-08-20 14:13:22');
    
    const [videosCount, subjectsWithVideos, totalSize] = await Promise.all([
      // Total and active videos
      pool.query(`
        SELECT 
          COUNT(*) as total_videos,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_videos
        FROM videos
      `),
      // Subjects with videos
      pool.query(`
        SELECT COUNT(DISTINCT subject_id) as subjects_with_videos 
        FROM videos 
        WHERE subject_id IS NOT NULL AND is_active = true
      `),
      // Total file size
      pool.query(`
        SELECT COALESCE(SUM(file_size), 0) as total_size 
        FROM videos 
        WHERE is_active = true
      `)
    ]);
    
    const stats = {
      total_videos: parseInt(videosCount.rows[0].total_videos),
      active_videos: parseInt(videosCount.rows[0].active_videos),
      subjects_with_videos: parseInt(subjectsWithVideos.rows[0].subjects_with_videos),
      total_size: parseInt(totalSize.rows[0].total_size)
    };
    
    console.log('✅ Video stats calculated for Azizkh07:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error calculating video stats for Azizkh07:', error);
    res.status(500).json({ message: 'Error calculating video statistics' });
  }
});

// GET single video
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 GET /api/videos/${id} - Real data for Azizkh07 at 2025-08-20 14:13:22`);
    
    const result = await pool.query(`
      SELECT 
        v.*,
        v.video_path,
        v.file_path,
        s.title as subject_title,
        s.professor_name,
        c.title as course_title,
        c.id as course_id
      FROM videos v
      LEFT JOIN subjects s ON v.subject_id = s.id
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE v.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const video = {
      ...result.rows[0],
      video_path: result.rows[0].video_path || result.rows[0].file_path
    };
    
    console.log(`✅ Found video ${id} for Azizkh07`);
    res.json(video);
    
  } catch (error) {
    console.error(`❌ Database error fetching video ${req.params.id} for Azizkh07:`, error);
    res.status(500).json({ message: 'Database error fetching video' });
  }
});

// ✅ FIXED: POST upload new video with database schema compatibility
router.post('/', simpleAuth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, subject_id, is_active } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    console.log('📤 POST /api/videos - Upload for Azizkh07 at 2025-08-20 14:13:22');
    console.log('📝 Data:', { 
      title, 
      subject_id, 
      files: files ? Object.keys(files) : 'no files',
      user: req.user?.name 
    });
    
    // Validate required fields
    if (!title || !subject_id) {
      return res.status(400).json({ 
        message: 'Title and subject_id are required',
        received: { title: !!title, subject_id: !!subject_id }
      });
    }
    
    if (!files?.video?.[0]) {
      return res.status(400).json({ 
        message: 'Video file is required',
        files_received: files ? Object.keys(files) : 'none'
      });
    }
    
    // Check if subject exists
    const subjectCheck = await pool.query(
      'SELECT id, title FROM subjects WHERE id = $1', 
      [subject_id]
    );
    
    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Subject not found',
        subject_id: subject_id
      });
    }
    
    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail?.[0];
    
    console.log('📁 Files for Azizkh07:', {
      video: {
        filename: videoFile.filename,
        size: (videoFile.size / (1024 * 1024)).toFixed(2) + ' MB',
        mimetype: videoFile.mimetype
      },
      thumbnail: thumbnailFile ? {
        filename: thumbnailFile.filename,
        size: (thumbnailFile.size / 1024).toFixed(2) + ' KB',
        mimetype: thumbnailFile.mimetype
      } : 'none'
    });
    
    // Get next order_index for this subject
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM videos WHERE subject_id = $1',
      [subject_id]
    );
    const orderIndex = orderResult.rows[0].next_order;
    
    // ✅ FIXED: Insert video record with both video_path and file_path for compatibility
    const result = await pool.query(`
      INSERT INTO videos (
        title, description, subject_id, video_path, file_path, thumbnail_path, 
        file_size, duration, order_index, is_active, mime_type
      )
      VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      title.trim(),
      description?.trim() || '',
      parseInt(subject_id),
      videoFile.filename, // Both video_path and file_path get the same value
      thumbnailFile?.filename || null,
      videoFile.size,
      0, // Duration will need to be calculated separately
      orderIndex,
      is_active !== 'false',
      videoFile.mimetype
    ]);
    
    console.log('✅ Video uploaded successfully for Azizkh07:', {
      id: result.rows[0].id,
      title: result.rows[0].title,
      video_path: result.rows[0].video_path,
      file_path: result.rows[0].file_path,
      subject_id: result.rows[0].subject_id
    });
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Video upload error for Azizkh07:', error);
    res.status(500).json({ 
      message: 'Video upload failed',
      error: error.message 
    });
  }
});

// DELETE video
router.delete('/:id', simpleAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/videos/${id} for Azizkh07 at 2025-08-20 14:13:22`);
    
    // Get video info before deletion
    const videoInfo = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    
    if (videoInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const video = videoInfo.rows[0];
    
    // Delete video record from database
    const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
    
    // Try to delete physical files (don't fail if files don't exist)
    try {
      const videoPath = video.video_path || video.file_path;
      if (videoPath) {
        const fullVideoPath = path.join('uploads/videos', videoPath);
        if (fs.existsSync(fullVideoPath)) {
          fs.unlinkSync(fullVideoPath);
          console.log(`🗑️ Deleted video file: ${fullVideoPath}`);
        }
      }
      
      if (video.thumbnail_path) {
        const thumbPath = path.join('uploads/thumbnails', video.thumbnail_path);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
          console.log(`🗑️ Deleted thumbnail file: ${thumbPath}`);
        }
      }
    } catch (fileError) {
      console.log('⚠️ Could not delete physical files (they may not exist):', fileError.message);
    }
    
    console.log(`✅ Video ${id} deleted successfully for Azizkh07`);
    res.json({ 
      message: 'Video deleted successfully', 
      video: result.rows[0] 
    });
    
  } catch (error) {
    console.error(`❌ Delete error for Azizkh07:`, error);
    res.status(500).json({ message: 'Failed to delete video' });
  }
});

// ✅ FIXED: Serve video files with streaming support
router.get('/stream/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const videoPath = path.join('uploads/videos', filename);
    
    console.log(`🎬 Streaming video for Azizkh07: ${filename} at 2025-08-20 14:13:22`);
    
    if (!fs.existsSync(videoPath)) {
      console.log(`❌ Video file not found: ${videoPath}`);
      return res.status(404).json({ message: 'Video file not found' });
    }
    
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Support partial content for video streaming
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
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
    
  } catch (error) {
    console.error(`❌ Video streaming error for Azizkh07:`, error);
    res.status(500).json({ message: 'Error streaming video' });
  }
});

// ✅ ADDED: Serve thumbnail files
router.get('/thumbnail/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const thumbnailPath = path.join('uploads/thumbnails', filename);
    
    console.log(`🖼️ Serving thumbnail for Azizkh07: ${filename} at 2025-08-20 14:13:22`);
    
    if (!fs.existsSync(thumbnailPath)) {
      console.log(`❌ Thumbnail file not found: ${thumbnailPath}`);
      return res.status(404).json({ message: 'Thumbnail file not found' });
    }
    
    res.sendFile(path.resolve(thumbnailPath));
    
  } catch (error) {
    console.error(`❌ Thumbnail serving error for Azizkh07:`, error);
    res.status(500).json({ message: 'Error serving thumbnail' });
  }
});

// ✅ CRITICAL: Export the router as default AND named export
export default router;
export { router as videoRoutes };

console.log('🎬 Video routes module loaded for Azizkh07 at 2025-08-20 14:13:22');