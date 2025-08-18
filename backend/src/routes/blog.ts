import express from 'express';
import { pool } from '../database'; // ✅ CORRECT PATH - points to database/index.ts
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/blog';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Helper function to generate slug
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens
    .trim('-'); // Remove leading/trailing hyphens
};

// GET /api/blog - Get all blog posts (with filters)
router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT bp.*, u.name as author_name
    FROM blog_posts bp
    LEFT JOIN users u ON bp.author_id = u.id
    WHERE bp.published = true
    ORDER BY bp.created_at DESC
  `);
  res.json({ success: true, posts: result.rows });
});

// GET /api/blog/admin/stats - Get blog statistics (Admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('✅ Blog admin stats route called');
    console.log('🔍 Pool object for stats:', typeof pool, pool ? 'EXISTS' : 'UNDEFINED'); // ✅ DEBUG LOG
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE published = true) as published_posts,
        COUNT(*) FILTER (WHERE published = false) as draft_posts,
        COUNT(DISTINCT author_id) as total_authors
      FROM blog_posts
    `);

    console.log('📊 Blog stats:', stats.rows[0]);

    res.json({
      success: true,
      stats: stats.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching blog stats:', error);
    res.status(500).json({ error: 'Error fetching blog stats' });
  }
});

// GET /api/blog/:id - Get single blog post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`✅ Blog GET /${id} route called`);
    
    const result = await pool.query(`
      SELECT 
        bp.*,
        u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({
      success: true,
      post: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching blog post:', error);
    res.status(500).json({ error: 'Error fetching blog post' });
  }
});

// POST /api/blog - Create new blog post (Admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('cover_image'), async (req, res) => {
  try {
    console.log('✅ Blog POST / route called');
    console.log('🔍 Pool object for create:', typeof pool, pool ? 'EXISTS' : 'UNDEFINED'); // ✅ DEBUG LOG
    console.log('📝 Request body:', req.body);
    console.log('📁 Uploaded file:', req.file);
    
    const { title, content, excerpt, published = false } = req.body;
    const author_id = (req as any).user.id;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Generate unique slug
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingSlug = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
      if (existingSlug.rows.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Handle cover image
    let cover_image = null;
    if (req.file) {
      cover_image = `/uploads/blog/${req.file.filename}`;
    }

    const result = await pool.query(`
      INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, published, author_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, slug, content, excerpt, cover_image, published, author_id]);

    console.log('✅ Blog post created:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creating blog post:', error);
    res.status(500).json({ error: 'Error creating blog post', details: error.message });
  }
});

// PUT /api/blog/:id - Update blog post (Admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('cover_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, published } = req.body;
    
    console.log(`✅ Blog PUT /${id} route called`);
    console.log('📝 Request body:', req.body);
    
    // Check if post exists
    const existingPost = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    let updateFields = [];
    let params = [];
    let paramCount = 0;

    if (title) {
      updateFields.push(`title = $${++paramCount}`);
      params.push(title);
      
      // Update slug if title changed
      if (title !== existingPost.rows[0].title) {
        let baseSlug = generateSlug(title);
        let slug = baseSlug;
        let counter = 1;

        while (true) {
          const existingSlug = await pool.query('SELECT id FROM blog_posts WHERE slug = $1 AND id != $2', [slug, id]);
          if (existingSlug.rows.length === 0) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        updateFields.push(`slug = $${++paramCount}`);
        params.push(slug);
      }
    }

    if (content !== undefined) {
      updateFields.push(`content = $${++paramCount}`);
      params.push(content);
    }

    if (excerpt !== undefined) {
      updateFields.push(`excerpt = $${++paramCount}`);
      params.push(excerpt);
    }

    if (published !== undefined) {
      updateFields.push(`published = $${++paramCount}`);
      params.push(published);
    }

    // Handle cover image
    if (req.file) {
      updateFields.push(`cover_image = $${++paramCount}`);
      params.push(`/uploads/blog/${req.file.filename}`);
      
      // Delete old image
      if (existingPost.rows[0].cover_image) {
        const oldImagePath = path.join(__dirname, '../..', existingPost.rows[0].cover_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const query = `
      UPDATE blog_posts 
      SET ${updateFields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    console.log('✅ Blog post updated:', result.rows[0]);

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating blog post:', error);
    res.status(500).json({ error: 'Error updating blog post' });
  }
});

// DELETE /api/blog/:id - Delete blog post (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`✅ Blog DELETE /${id} route called`);
    
    // Get post info before deletion
    const existingPost = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Delete post
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);

    // Delete associated image
    if (existingPost.rows[0].cover_image) {
      const imagePath = path.join(__dirname, '../..', existingPost.rows[0].cover_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    console.log('✅ Blog post deleted:', existingPost.rows[0].title);

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting blog post:', error);
    res.status(500).json({ error: 'Error deleting blog post' });
  }
});

// POST /api/blog/upload-image - Upload image for blog content
router.post('/upload-image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('✅ Blog image upload route called');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageUrl = `/uploads/blog/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

console.log('🔗 REAL Blog routes module loaded');

export { router as blogRoutes };