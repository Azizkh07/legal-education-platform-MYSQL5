import express from 'express';
import { pool } from '../database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed!'));
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
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * GET /api/blog
 *
 * Behavior:
 * - public visitors (no token) -> returns only published posts
 * - if query param published=false -> requires authentication:
 *     - admins see all drafts
 *     - regular users see only their own drafts
 * - if no published param and request is authenticated:
 *     - admin: sees ALL posts (published + drafts)
 *     - regular user: sees published posts + their own drafts
 *
 * Also supports optional ?search=term to search title/content.
 */
router.get('/', async (req, res) => {
  try {
    const publishedParam = typeof req.query.published === 'string' ? req.query.published : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : null;

    // Try to decode token if present, but do not fail public requests
    let user: any = null;
    try {
      const header = (req.headers['authorization'] as string) || (req.headers['x-access-token'] as string);
      if (header) {
        const parts = header.split(' ');
        let token = header;
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') token = parts[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        // fetch fresh user info from DB to get is_admin flag and existence
        const ures = await pool.query('SELECT id, is_admin, is_approved FROM users WHERE id = $1', [decoded.id]);
        if (ures.rows.length) {
          user = {
            id: ures.rows[0].id,
            is_admin: ures.rows[0].is_admin,
            is_approved: ures.rows[0].is_approved
          };
        }
      }
    } catch (e) {
      // invalid/expired token -> treat as unauthenticated; do not throw here
      console.warn('[blog] optional token decode failed - treating as unauthenticated');
      user = null;
    }

    // If caller explicitly asked for drafts (published=false) then require auth
    if (publishedParam === 'false') {
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'Access token required to view drafts' });
      }

      // Admin sees all drafts
      if (user.is_admin) {
        const clauses: string[] = ['bp.published = false'];
        const values: any[] = [];
        let idx = 1;
        if (search) {
          clauses.push(`(bp.title ILIKE $${idx} OR bp.content ILIKE $${idx})`);
          values.push(`%${search}%`);
          idx++;
        }
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const sql = `
          SELECT bp.*, u.name as author_name
          FROM blog_posts bp
          LEFT JOIN users u ON bp.author_id = u.id
          ${where}
          ORDER BY bp.created_at DESC
        `;
        const result = await pool.query(sql, values);
        return res.json({ success: true, posts: result.rows });
      }

      // Regular user: only their own drafts
      const values: any[] = [user.id];
      let idx = 2;
      const clauses = ['bp.published = false', `bp.author_id = $1`];

      if (search) {
        clauses.push(`(bp.title ILIKE $${idx} OR bp.content ILIKE $${idx})`);
        values.push(`%${search}%`);
        idx++;
      }

      const where = `WHERE ${clauses.join(' AND ')}`;
      const sql = `
        SELECT bp.*, u.name as author_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        ${where}
        ORDER BY bp.created_at DESC
      `;
      const result = await pool.query(sql, values);
      return res.json({ success: true, posts: result.rows });
    }

    // For published=true or no param:
    // - if no token -> only published
    // - if token && admin -> all posts
    // - if token && regular user -> published OR their own drafts
    const clauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (publishedParam === 'true') {
      clauses.push('bp.published = true');
    } else {
      // no explicit param
      if (!user) {
        clauses.push('bp.published = true');
      } else if (user.is_admin) {
        // admin: no published clause (sees all)
      } else {
        // regular authenticated: show published OR their own posts
        clauses.push(`(bp.published = true OR bp.author_id = $${idx})`);
        values.push(user.id);
        idx++;
      }
    }

    if (search) {
      clauses.push(`(bp.title ILIKE $${idx} OR bp.content ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `
      SELECT bp.*, u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ${where}
      ORDER BY bp.created_at DESC
    `;
    const result = await pool.query(sql, values);

    return res.json({ success: true, posts: result.rows });
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    res.status(500).json({ success: false, error: 'Error fetching posts' });
  }
});

// GET /api/blog/drafts - Get drafts visible to the caller
// - Admins see all drafts
// - Regular authenticated users see only their own drafts
router.get('/drafts', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (user.is_admin || user.isAdmin) {
      const result = await pool.query(`
        SELECT bp.*, u.name as author_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.published = false
        ORDER BY bp.created_at DESC
      `);
      return res.json({ success: true, posts: result.rows });
    } else {
      const result = await pool.query(`
        SELECT bp.*, u.name as author_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.published = false AND bp.author_id = $1
        ORDER BY bp.created_at DESC
      `, [user.id]);
      return res.json({ success: true, posts: result.rows });
    }
  } catch (error) {
    console.error('❌ Error fetching drafts:', error);
    res.status(500).json({ success: false, error: 'Error fetching drafts' });
  }
});

// GET /api/blog/admin/stats - Get blog statistics (Admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE published = true) as published_posts,
        COUNT(*) FILTER (WHERE published = false) as draft_posts,
        COUNT(DISTINCT author_id) as total_authors
      FROM blog_posts
    `);

    res.json({
      success: true,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('❌ Error fetching blog stats:', error);
    res.status(500).json({ success: false, error: 'Error fetching blog stats' });
  }
});

// GET /api/blog/:id - Get single blog post (published or draft if caller has access)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user; // may be undefined if token absent -> but authenticateToken will block, keep for safety

    const result = await pool.query(`
      SELECT bp.*, u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const post = result.rows[0];
    if (!post.published) {
      // draft: allow only author or admin
      if (!user || !(user.is_admin || user.isAdmin) && user.id !== post.author_id) {
        return res.status(403).json({ success: false, error: 'Access denied to draft' });
      }
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error('❌ Error fetching blog post:', error);
    res.status(500).json({ success: false, error: 'Error fetching blog post' });
  }
});

// POST /api/blog - Create new blog post (any authenticated user can create; defaults to draft)
// If the client sets published=true it's accepted (authors may publish their own posts).
router.post('/', authenticateToken, upload.single('cover_image'), async (req, res) => {
  try {
    console.log('✅ Blog POST / route called');
    const { title, content, excerpt } = req.body;
    let published = req.body?.published === 'true' || req.body?.published === true ? true : false;
    const author_id = (req as any).user.id;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    // Generate unique slug
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingSlug = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
      if (existingSlug.rows.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // Handle cover image
    let cover_image = null;
    if (req.file) {
      cover_image = `/uploads/blog/${req.file.filename}`;
    }

    const result = await pool.query(`
      INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, published, author_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [title, slug, content, excerpt, cover_image, published, author_id]);

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post: result.rows[0]
    });
  } catch (error: any) {
    console.error('❌ Error creating blog post:', error);
    res.status(500).json({ success: false, error: 'Error creating blog post', details: error.message });
  }
});

// PUT /api/blog/:id - Update blog post (author or admin)
router.put('/:id', authenticateToken, upload.single('cover_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Check if post exists
    const existingPost = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const post = existingPost.rows[0];
    const isAdmin = !!(user && (user.is_admin || user.isAdmin));
    const isAuthor = !!(user && user.id === post.author_id);

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this post' });
    }

    const { title, content, excerpt } = req.body;
    let published = undefined;
    if (typeof req.body.published !== 'undefined') {
      published = req.body.published === 'true' || req.body.published === true;
    }

    let updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title) {
      updateFields.push(`title = $${paramIndex++}`);
      params.push(title);

      // Update slug if title changed
      if (title !== post.title) {
        let baseSlug = generateSlug(title);
        let slug = baseSlug;
        let counter = 1;
        while (true) {
          const existingSlug = await pool.query('SELECT id FROM blog_posts WHERE slug = $1 AND id != $2', [slug, id]);
          if (existingSlug.rows.length === 0) break;
          slug = `${baseSlug}-${counter++}`;
        }
        updateFields.push(`slug = $${paramIndex++}`);
        params.push(slug);
      }
    }

    if (typeof content !== 'undefined') {
      updateFields.push(`content = $${paramIndex++}`);
      params.push(content);
    }

    if (typeof excerpt !== 'undefined') {
      updateFields.push(`excerpt = $${paramIndex++}`);
      params.push(excerpt);
    }

    if (typeof published !== 'undefined') {
      updateFields.push(`published = $${paramIndex++}`);
      params.push(published);
    }

    // Handle cover image
    if (req.file) {
      updateFields.push(`cover_image = $${paramIndex++}`);
      params.push(`/uploads/blog/${req.file.filename}`);

      // Delete old image file if present
      if (post.cover_image) {
        const oldImagePath = path.join(__dirname, '..', '..', post.cover_image);
        if (fs.existsSync(oldImagePath)) {
          try { fs.unlinkSync(oldImagePath); } catch (e) { console.warn('Could not delete old image', e); }
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    params.push(id); // last param = id
    const query = `
      UPDATE blog_posts
      SET ${updateFields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating blog post:', error);
    res.status(500).json({ success: false, error: 'Error updating blog post' });
  }
});

// DELETE /api/blog/:id - Delete blog post (author or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const existingPost = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const post = existingPost.rows[0];
    const isAdmin = !!(user && (user.is_admin || user.isAdmin));
    const isAuthor = !!(user && user.id === post.author_id);

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
    }

    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);

    // Delete associated image
    if (post.cover_image) {
      const imagePath = path.join(__dirname, '..', '..', post.cover_image);
      if (fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) { console.warn('Could not delete image', e); }
      }
    }

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting blog post:', error);
    res.status(500).json({ success: false, error: 'Error deleting blog post' });
  }
});

// POST /api/blog/upload-image - Upload image for blog content (admin or author)
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    const imageUrl = `/uploads/blog/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ success: false, error: 'Error uploading image' });
  }
});

console.log('🔗 REAL Blog routes module loaded (updated with drafts & author auth)');

export { router as blogRoutes };