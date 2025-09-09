import express from 'express';
import { query } from '../database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'legal-education-platform-super-secret-key-medsaidabidi02-2025-mysql5-version';

console.log('📝 FIXED Blog API loaded for Medsaidabidi02 - 2025-09-09 15:15:29');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/blog';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`📁 Created blog upload directory: ${uploadDir} for Medsaidabidi02`);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = 'blog-' + uniqueSuffix + path.extname(file.originalname);
    console.log(`📝 Generated blog image filename for Medsaidabidi02: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      console.log(`✅ Blog image file validated for Medsaidabidi02: ${file.originalname}`);
      return cb(null, true);
    }
    console.log(`❌ Invalid blog image file for Medsaidabidi02: ${file.originalname}`);
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
 * Public endpoint with authentication-aware behavior
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/blog - Fetching posts for Medsaidabidi02 at 2025-09-09 15:15:29');
    
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
        const ures = await query('SELECT id, is_admin, is_approved FROM users WHERE id = ?', [decoded.id]);
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
      console.warn('[blog] optional token decode failed - treating as unauthenticated for Medsaidabidi02');
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
        if (search) {
          clauses.push('(bp.title LIKE ? OR bp.content LIKE ?)');
          values.push(`%${search}%`, `%${search}%`);
        }
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const sql = `
          SELECT bp.*, u.name as author_name
          FROM blog_posts bp
          LEFT JOIN users u ON bp.author_id = u.id
          ${where}
          ORDER BY bp.created_at DESC
        `;
        const result = await query(sql, values);
        console.log(`✅ Found ${result.rows.length} draft posts for admin Medsaidabidi02`);
        return res.json({ success: true, posts: result.rows });
      }

      // Regular user: only their own drafts
      const values: any[] = [user.id];
      const clauses = ['bp.published = false', 'bp.author_id = ?'];

      if (search) {
        clauses.push('(bp.title LIKE ? OR bp.content LIKE ?)');
        values.push(`%${search}%`, `%${search}%`);
      }

      const where = `WHERE ${clauses.join(' AND ')}`;
      const sql = `
        SELECT bp.*, u.name as author_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        ${where}
        ORDER BY bp.created_at DESC
      `;
      const result = await query(sql, values);
      console.log(`✅ Found ${result.rows.length} own draft posts for user ${user.id} Medsaidabidi02`);
      return res.json({ success: true, posts: result.rows });
    }

    // For published=true or no param:
    const clauses: string[] = [];
    const values: any[] = [];

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
        clauses.push('(bp.published = true OR bp.author_id = ?)');
        values.push(user.id);
      }
    }

    if (search) {
      clauses.push('(bp.title LIKE ? OR bp.content LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `
      SELECT bp.*, u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ${where}
      ORDER BY bp.created_at DESC
    `;
    const result = await query(sql, values);

    console.log(`✅ Found ${result.rows.length} blog posts for Medsaidabidi02`);
    return res.json({ success: true, posts: result.rows });
  } catch (error) {
    console.error('❌ Error fetching posts for Medsaidabidi02:', error);
    res.status(500).json({ success: false, error: 'Error fetching posts' });
  }
});

// GET /api/blog/drafts - Get drafts visible to the caller
router.get('/drafts', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /api/blog/drafts - Fetching drafts for Medsaidabidi02 at 2025-09-09 15:15:29');
    
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (user.is_admin || user.isAdmin) {
      const result = await query(`
        SELECT bp.*, u.name as author_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.published = false
        ORDER BY bp.created_at DESC
      `);
      console.log(`✅ Found ${result.rows.length} draft posts for admin Medsaidabidi02`);
      return res.json({ success: true, posts: result.rows });
    } else {
      const result = await query(`
        SELECT bp.*, u.name as author_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.published = false AND bp.author_id = ?
        ORDER BY bp.created_at DESC
      `, [user.id]);
      console.log(`✅ Found ${result.rows.length} own draft posts for user ${user.id} Medsaidabidi02`);
      return res.json({ success: true, posts: result.rows });
    }
  } catch (error) {
    console.error('❌ Error fetching drafts for Medsaidabidi02:', error);
    res.status(500).json({ success: false, error: 'Error fetching drafts' });
  }
});

// GET /api/blog/admin/stats - Get blog statistics (Admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 GET /api/blog/admin/stats - Fetching stats for admin Medsaidabidi02 at 2025-09-09 15:15:29');
    
    const [totalPosts, publishedPosts, draftPosts, totalAuthors] = await Promise.all([
      query('SELECT COUNT(*) as total_posts FROM blog_posts'),
      query('SELECT COUNT(*) as published_posts FROM blog_posts WHERE published = true'),
      query('SELECT COUNT(*) as draft_posts FROM blog_posts WHERE published = false'),
      query('SELECT COUNT(DISTINCT author_id) as total_authors FROM blog_posts')
    ]);

    const stats = {
      total_posts: parseInt(totalPosts.rows[0].total_posts),
      published_posts: parseInt(publishedPosts.rows[0].published_posts),
      draft_posts: parseInt(draftPosts.rows[0].draft_posts),
      total_authors: parseInt(totalAuthors.rows[0].total_authors)
    };

    console.log('✅ Blog stats calculated for admin Medsaidabidi02:', stats);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Error fetching blog stats for Medsaidabidi02:', error);
    res.status(500).json({ success: false, error: 'Error fetching blog stats' });
  }
});

// GET /api/blog/:id - Get single blog post
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 GET /api/blog/${id} - Fetching single post for Medsaidabidi02 at 2025-09-09 15:15:29`);
    
    const user = (req as any).user;

    const result = await query(`
      SELECT bp.*, u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = ?
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

    console.log(`✅ Found blog post ${id} for Medsaidabidi02`);
    res.json({ success: true, post });
  } catch (error) {
    console.error(`❌ Error fetching blog post ${req.params.id} for Medsaidabidi02:`, error);
    res.status(500).json({ success: false, error: 'Error fetching blog post' });
  }
});

// POST /api/blog - Create new blog post
router.post('/', authenticateToken, upload.single('cover_image'), async (req, res) => {
  try {
    console.log('➕ POST /api/blog - Creating new post for Medsaidabidi02 at 2025-09-09 15:15:29');
    
    const { title, content, excerpt } = req.body;
    let published = req.body?.published === 'true' || req.body?.published === true ? true : false;
    const author_id = (req as any).user.id;

    console.log('📝 Blog post data for Medsaidabidi02:', { title, published, author_id });

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    // Generate unique slug
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingSlug = await query('SELECT id FROM blog_posts WHERE slug = ?', [slug]);
      if (existingSlug.rows.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // Handle cover image
    let cover_image = null;
    if (req.file) {
      cover_image = `/uploads/blog/${req.file.filename}`;
      console.log(`📸 Blog cover image uploaded for Medsaidabidi02: ${cover_image}`);
    }

    const result = await query(`
      INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, published, author_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [title, slug, content, excerpt, cover_image, published, author_id]);

    // Get the created post
    const createdPost = await query('SELECT * FROM blog_posts WHERE id = ?', [result.insertId]);

    console.log('✅ Blog post created successfully for Medsaidabidi02:', createdPost.rows[0]);
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post: createdPost.rows[0]
    });
  } catch (error: any) {
    console.error('❌ Error creating blog post for Medsaidabidi02:', error);
    res.status(500).json({ success: false, error: 'Error creating blog post', details: error.message });
  }
});

// PUT /api/blog/:id - Update blog post
router.put('/:id', authenticateToken, upload.single('cover_image'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 PUT /api/blog/${id} - Updating post for Medsaidabidi02 at 2025-09-09 15:15:29`);
    
    const user = (req as any).user;

    // Check if post exists
    const existingPost = await query('SELECT * FROM blog_posts WHERE id = ?', [id]);
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

    if (title) {
      updateFields.push('title = ?');
      params.push(title);

      // Update slug if title changed
      if (title !== post.title) {
        let baseSlug = generateSlug(title);
        let slug = baseSlug;
        let counter = 1;
        while (true) {
          const existingSlug = await query('SELECT id FROM blog_posts WHERE slug = ? AND id != ?', [slug, id]);
          if (existingSlug.rows.length === 0) break;
          slug = `${baseSlug}-${counter++}`;
        }
        updateFields.push('slug = ?');
        params.push(slug);
      }
    }

    if (typeof content !== 'undefined') {
      updateFields.push('content = ?');
      params.push(content);
    }

    if (typeof excerpt !== 'undefined') {
      updateFields.push('excerpt = ?');
      params.push(excerpt);
    }

    if (typeof published !== 'undefined') {
      updateFields.push('published = ?');
      params.push(published);
    }

    // Handle cover image
    if (req.file) {
      updateFields.push('cover_image = ?');
      params.push(`/uploads/blog/${req.file.filename}`);

      // Delete old image file if present
      if (post.cover_image) {
        const oldImagePath = path.join(__dirname, '..', '..', post.cover_image);
        if (fs.existsSync(oldImagePath)) {
          try { 
            fs.unlinkSync(oldImagePath);
            console.log(`🗑️ Deleted old blog image for Medsaidabidi02: ${oldImagePath}`);
          } catch (e) { 
            console.warn('Could not delete old image for Medsaidabidi02:', e); 
          }
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    // Add updated_at and id
    updateFields.push('updated_at = NOW()');
    params.push(id);

    await query(`UPDATE blog_posts SET ${updateFields.join(', ')} WHERE id = ?`, params);

    // Get the updated post
    const updatedPost = await query('SELECT * FROM blog_posts WHERE id = ?', [id]);

    console.log(`✅ Blog post ${id} updated successfully for Medsaidabidi02`);
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post: updatedPost.rows[0]
    });
  } catch (error) {
    console.error(`❌ Error updating blog post ${req.params.id} for Medsaidabidi02:`, error);
    res.status(500).json({ success: false, error: 'Error updating blog post' });
  }
});

// DELETE /api/blog/:id - Delete blog post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/blog/${id} - Deleting post  at 2025-09-09 15:15:29`);
    
    const user = (req as any).user;

    const existingPost = await query('SELECT * FROM blog_posts WHERE id = ?', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const post = existingPost.rows[0];
    const isAdmin = !!(user && (user.is_admin || user.isAdmin));
    const isAuthor = !!(user && user.id === post.author_id);

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
    }

    await query('DELETE FROM blog_posts WHERE id = ?', [id]);

    // Delete associated image
    if (post.cover_image) {
      const imagePath = path.join(__dirname, '..', '..', post.cover_image);
      if (fs.existsSync(imagePath)) {
        try { 
          fs.unlinkSync(imagePath);
          console.log(`🗑️ Deleted blog image for : ${imagePath}`);
        } catch (e) { 
          console.warn('Could not delete blog image :', e); 
        }
      }
    }

    console.log(`✅ Blog post ${id} (${post.title}) deleted successfully `);
    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error(`❌ Error deleting blog post ${req.params.id} :`, error);
    res.status(500).json({ success: false, error: 'Error deleting blog post' });
  }
});

// POST /api/blog/upload-image - Upload image for blog content
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('📤 POST /api/blog/upload-image - Uploading image  at 2025-09-09 15:15:29');
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    
    const imageUrl = `/uploads/blog/${req.file.filename}`;
    console.log(`✅ Blog image uploaded successfully : ${imageUrl}`);
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('❌ Error uploading blog image ', error);
    res.status(500).json({ success: false, error: 'Error uploading image' });
  }
});

console.log('📝 Blog routes module loaded at 2025-09-09 15:15:29');

export { router as blogRoutes };
export default router;