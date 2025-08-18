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
        description, 
        cover_image, 
        created_at 
      FROM courses 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Get public courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.get('/my-courses', auth_1.authenticateToken, auth_1.requireApproved, async (req, res) => {
    try {
        const authRequest = req;
        if (!authRequest.user) {
            res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
            return;
        }
        const result = await database_1.default.query(`
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.cover_image, 
        c.created_at,
        uc.assigned_at,
        COUNT(v.id) as video_count
      FROM courses c
      JOIN user_courses uc ON c.id = uc.course_id
      LEFT JOIN videos v ON c.id = v.course_id AND v.is_active = TRUE
      WHERE uc.user_id = $1 AND uc.is_active = TRUE AND c.is_active = TRUE
      GROUP BY c.id, uc.assigned_at
      ORDER BY uc.assigned_at DESC
    `, [authRequest.user.id]);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Get user courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, auth_1.requireApproved, async (req, res) => {
    try {
        const authRequest = req;
        if (!authRequest.user) {
            res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
            return;
        }
        const courseId = parseInt(req.params.id);
        if (isNaN(courseId)) {
            res.status(400).json({
                success: false,
                message: 'ID de cours invalide'
            });
            return;
        }
        if (!authRequest.user.is_admin) {
            const accessResult = await database_1.default.query('SELECT 1 FROM user_courses WHERE user_id = $1 AND course_id = $2 AND is_active = TRUE', [authRequest.user.id, courseId]);
            if (accessResult.rows.length === 0) {
                res.status(403).json({
                    success: false,
                    message: 'Accès refusé à ce cours'
                });
                return;
            }
        }
        const courseResult = await database_1.default.query('SELECT * FROM courses WHERE id = $1 AND is_active = TRUE', [courseId]);
        if (courseResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
            return;
        }
        const videosResult = await database_1.default.query(`
      SELECT 
        id, 
        title, 
        duration, 
        created_at,
        file_size
      FROM videos 
      WHERE course_id = $1 AND is_active = TRUE 
      ORDER BY created_at ASC
    `, [courseId]);
        res.json({
            success: true,
            data: {
                course: courseResult.rows[0],
                videos: videosResult.rows
            }
        });
    }
    catch (error) {
        console.error('Get course details error:', error);
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
        c.*,
        COUNT(uc.id) as enrolled_users,
        COUNT(v.id) as video_count
      FROM courses c
      LEFT JOIN user_courses uc ON c.id = uc.course_id AND uc.is_active = TRUE
      LEFT JOIN videos v ON c.id = v.course_id AND v.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { title, description, cover_image } = req.body;
        if (!title || !description) {
            res.status(400).json({
                success: false,
                message: 'Titre et description requis'
            });
            return;
        }
        const result = await database_1.default.query(`
      INSERT INTO courses (title, description, cover_image) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `, [title.trim(), description.trim(), cover_image || null]);
        res.status(201).json({
            success: true,
            message: 'Cours créé avec succès',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
exports.default = router;
