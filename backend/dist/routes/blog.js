"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/public', async (req, res) => {
    try {
        const result = await database_1.default.query(`
      SELECT 
        id, 
        title, 
        slug, 
        excerpt,
        cover_image, 
        created_at 
      FROM blog_posts 
      WHERE published = TRUE 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Get public blog posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await database_1.default.query(`
      SELECT 
        bp.*,
        u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.slug = $1 AND bp.published = TRUE
    `, [slug]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Article non trouvé'
            });
            return;
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Get blog post error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.get('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const result = await database_1.default.query(`
      SELECT 
        bp.*,
        u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ORDER BY bp.created_at DESC
    `);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Get all blog posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
            return;
        }
        const { title, slug, content, excerpt, cover_image, published } = req.body;
        if (!title || !slug || !content) {
            res.status(400).json({
                success: false,
                message: 'Titre, slug et contenu requis'
            });
            return;
        }
        const slugCheck = await database_1.default.query('SELECT id FROM blog_posts WHERE slug = $1', [slug.toLowerCase().trim()]);
        if (slugCheck.rows.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Ce slug existe déjà'
            });
            return;
        }
        const result = await database_1.default.query(`
      INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, published, author_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `, [
            title.trim(),
            slug.toLowerCase().trim(),
            content.trim(),
            excerpt?.trim() || null,
            cover_image || null,
            published || false,
            req.user.id
        ]);
        res.status(201).json({
            success: true,
            message: 'Article créé avec succès',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Create blog post error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
exports.default = router;
