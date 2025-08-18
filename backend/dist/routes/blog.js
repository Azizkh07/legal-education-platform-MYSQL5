"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogRoutes = void 0;
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
exports.blogRoutes = router;
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/blog';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blog-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
};
router.get('/', async (req, res) => {
    const result = await database_1.pool.query(`
    SELECT bp.*, u.name as author_name
    FROM blog_posts bp
    LEFT JOIN users u ON bp.author_id = u.id
    WHERE bp.published = true
    ORDER BY bp.created_at DESC
  `);
    res.json({ success: true, posts: result.rows });
});
router.get('/admin/stats', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        console.log('✅ Blog admin stats route called');
        console.log('🔍 Pool object for stats:', typeof database_1.pool, database_1.pool ? 'EXISTS' : 'UNDEFINED');
        const stats = await database_1.pool.query(`
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
    }
    catch (error) {
        console.error('❌ Error fetching blog stats:', error);
        res.status(500).json({ error: 'Error fetching blog stats' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`✅ Blog GET /${id} route called`);
        const result = await database_1.pool.query(`
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
    }
    catch (error) {
        console.error('❌ Error fetching blog post:', error);
        res.status(500).json({ error: 'Error fetching blog post' });
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, upload.single('cover_image'), async (req, res) => {
    try {
        console.log('✅ Blog POST / route called');
        console.log('🔍 Pool object for create:', typeof database_1.pool, database_1.pool ? 'EXISTS' : 'UNDEFINED');
        console.log('📝 Request body:', req.body);
        console.log('📁 Uploaded file:', req.file);
        const { title, content, excerpt, published = false } = req.body;
        const author_id = req.user.id;
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        let baseSlug = generateSlug(title);
        let slug = baseSlug;
        let counter = 1;
        while (true) {
            const existingSlug = await database_1.pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
            if (existingSlug.rows.length === 0)
                break;
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        let cover_image = null;
        if (req.file) {
            cover_image = `/uploads/blog/${req.file.filename}`;
        }
        const result = await database_1.pool.query(`
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
    }
    catch (error) {
        console.error('❌ Error creating blog post:', error);
        res.status(500).json({ error: 'Error creating blog post', details: error.message });
    }
});
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, upload.single('cover_image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, published } = req.body;
        console.log(`✅ Blog PUT /${id} route called`);
        console.log('📝 Request body:', req.body);
        const existingPost = await database_1.pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
        if (existingPost.rows.length === 0) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        let updateFields = [];
        let params = [];
        let paramCount = 0;
        if (title) {
            updateFields.push(`title = $${++paramCount}`);
            params.push(title);
            if (title !== existingPost.rows[0].title) {
                let baseSlug = generateSlug(title);
                let slug = baseSlug;
                let counter = 1;
                while (true) {
                    const existingSlug = await database_1.pool.query('SELECT id FROM blog_posts WHERE slug = $1 AND id != $2', [slug, id]);
                    if (existingSlug.rows.length === 0)
                        break;
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
        if (req.file) {
            updateFields.push(`cover_image = $${++paramCount}`);
            params.push(`/uploads/blog/${req.file.filename}`);
            if (existingPost.rows[0].cover_image) {
                const oldImagePath = path_1.default.join(__dirname, '../..', existingPost.rows[0].cover_image);
                if (fs_1.default.existsSync(oldImagePath)) {
                    fs_1.default.unlinkSync(oldImagePath);
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
        const result = await database_1.pool.query(query, params);
        console.log('✅ Blog post updated:', result.rows[0]);
        res.json({
            success: true,
            message: 'Blog post updated successfully',
            post: result.rows[0]
        });
    }
    catch (error) {
        console.error('❌ Error updating blog post:', error);
        res.status(500).json({ error: 'Error updating blog post' });
    }
});
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`✅ Blog DELETE /${id} route called`);
        const existingPost = await database_1.pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
        if (existingPost.rows.length === 0) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        await database_1.pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
        if (existingPost.rows[0].cover_image) {
            const imagePath = path_1.default.join(__dirname, '../..', existingPost.rows[0].cover_image);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        console.log('✅ Blog post deleted:', existingPost.rows[0].title);
        res.json({
            success: true,
            message: 'Blog post deleted successfully'
        });
    }
    catch (error) {
        console.error('❌ Error deleting blog post:', error);
        res.status(500).json({ error: 'Error deleting blog post' });
    }
});
router.post('/upload-image', auth_1.authenticateToken, auth_1.requireAdmin, upload.single('image'), async (req, res) => {
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
    }
    catch (error) {
        console.error('❌ Error uploading image:', error);
        res.status(500).json({ error: 'Error uploading image' });
    }
});
console.log('🔗 REAL Blog routes module loaded');
