import express from 'express';
import { pool } from '../database';
import { AuthRequest, requireAdmin } from '../middleware/auth';
import { upload, uploadVideo, uploadImage } from '../services/fileUpload';
import { generateVideoKey } from '../services/videoSecurity';
import bcrypt from 'bcrypt';

const router = express.Router();

// Apply admin check to all routes
router.use(requireAdmin);

// ===== COURSE MANAGEMENT =====

// Create new course
router.post('/courses', upload.single('cover_image'), async (req: AuthRequest, res) => {
  try {
    const { title, description, excerpt, category_id, level } = req.body;
    const adminId = req.user!.id;

    console.log('📚 Creating course:', title);

    // Generate slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    let coverImageUrl = null;
    if (req.file) {
      coverImageUrl = await uploadImage(req.file);
      console.log('🖼️ Cover image uploaded:', coverImageUrl);
    }

    const result = await pool.query(`
      INSERT INTO courses (title, slug, description, excerpt, cover_image, category_id, instructor_id, level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, slug, description, excerpt, coverImageUrl, category_id, adminId, level]);

    console.log('✅ Course created:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Upload video to course
router.post('/courses/:courseId/videos', upload.single('video'), async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, order_position, is_free } = req.body;

    console.log('🎥 Uploading video for course:', courseId);

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    console.log('📁 Video file details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename
    });

    // Generate video key for security
    const videoKey = generateVideoKey();
    const videoPath = await uploadVideo(req.file, videoKey);

    const result = await pool.query(`
      INSERT INTO videos (course_id, title, description, video_url, video_key, order_position, is_free)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [courseId, title, description, videoPath, videoKey, order_position || 0, is_free === 'true']);

    console.log('✅ Video uploaded:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Upload video error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// ===== ARTICLE MANAGEMENT =====

// Create new article
router.post('/articles', upload.single('cover_image'), async (req: AuthRequest, res) => {
  try {
    const { title, content, excerpt, category_id, is_featured } = req.body;
    const adminId = req.user!.id;

    console.log('📝 Creating article:', title);

    // Generate slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    let coverImageUrl = null;
    if (req.file) {
      coverImageUrl = await uploadImage(req.file);
      console.log('🖼️ Article image uploaded:', coverImageUrl);
    }

    const result = await pool.query(`
      INSERT INTO articles (title, slug, content, excerpt, cover_image, author_id, category_id, is_featured, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `, [title, slug, content, excerpt, coverImageUrl, adminId, category_id, is_featured === 'true']);

    console.log('✅ Article created:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Rest of admin routes remain the same...
// (users management, dashboard stats, etc.)

export { router as adminRoutes };