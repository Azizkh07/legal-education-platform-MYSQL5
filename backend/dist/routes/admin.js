"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/stats', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const stats = await Promise.all([
            database_1.default.query('SELECT COUNT(*) as total_users FROM users WHERE is_admin = FALSE'),
            database_1.default.query('SELECT COUNT(*) as approved_users FROM users WHERE is_admin = FALSE AND is_approved = TRUE'),
            database_1.default.query('SELECT COUNT(*) as total_courses FROM courses WHERE is_active = TRUE'),
            database_1.default.query('SELECT COUNT(*) as total_videos FROM videos WHERE is_active = TRUE'),
            database_1.default.query('SELECT COUNT(*) as published_posts FROM blog_posts WHERE published = TRUE'),
            database_1.default.query('SELECT COUNT(*) as active_sessions FROM sessions WHERE expires_at > NOW()'),
        ]);
        res.json({
            success: true,
            data: {
                total_users: parseInt(stats[0].rows[0].total_users),
                approved_users: parseInt(stats[1].rows[0].approved_users),
                total_courses: parseInt(stats[2].rows[0].total_courses),
                total_videos: parseInt(stats[3].rows[0].total_videos),
                published_posts: parseInt(stats[4].rows[0].published_posts),
                active_sessions: parseInt(stats[5].rows[0].active_sessions),
            }
        });
    }
    catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.get('/users', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search;
        let whereClause = 'WHERE 1=1';
        let queryParams = [limit, offset];
        if (search) {
            whereClause += ' AND (LOWER(name) LIKE $3 OR LOWER(email) LIKE $3)';
            queryParams.push(`%${search.toLowerCase()}%`);
        }
        const countResult = await database_1.default.query(`SELECT COUNT(*) FROM users ${whereClause.replace('$3', search ? '$1' : '')}`, search ? [`%${search.toLowerCase()}%`] : []);
        const totalCount = parseInt(countResult.rows[0].count);
        const result = await database_1.default.query(`
      SELECT 
        id, 
        name, 
        email, 
        is_approved, 
        is_admin, 
        last_ip, 
        created_at,
        (SELECT COUNT(*) FROM user_courses WHERE user_id = users.id AND is_active = TRUE) as enrolled_courses
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);
        res.json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.post('/users', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { name, email, password, is_admin = false } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Nom, email et mot de passe requis'
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Format d\'email invalide'
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const result = await database_1.default.query(`
      INSERT INTO users (name, email, password, is_approved, is_admin) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, name, email, is_approved, is_admin, created_at
    `, [
            name.trim(),
            email.toLowerCase().trim(),
            hashedPassword,
            true,
            is_admin
        ]);
        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        if (error && typeof error === 'object' && error.code === '23505') {
            res.status(400).json({
                success: false,
                message: 'Cet email existe déjà'
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la création'
            });
        }
    }
});
router.patch('/users/:id/approval', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { is_approved } = req.body;
        if (isNaN(userId)) {
            res.status(400).json({
                success: false,
                message: 'ID utilisateur invalide'
            });
            return;
        }
        const result = await database_1.default.query('UPDATE users SET is_approved = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, is_approved, is_admin', [is_approved, userId]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
            return;
        }
        res.json({
            success: true,
            message: `Utilisateur ${is_approved ? 'approuvé' : 'rejeté'} avec succès`,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Update user approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.post('/assign-course', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { user_id, course_id } = req.body;
        if (!user_id || !course_id) {
            res.status(400).json({
                success: false,
                message: 'ID utilisateur et ID cours requis'
            });
            return;
        }
        const userExists = await database_1.default.query('SELECT id FROM users WHERE id = $1', [user_id]);
        const courseExists = await database_1.default.query('SELECT id FROM courses WHERE id = $1 AND is_active = TRUE', [course_id]);
        if (userExists.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
            return;
        }
        if (courseExists.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
            return;
        }
        const result = await database_1.default.query('INSERT INTO user_courses (user_id, course_id) VALUES ($1, $2) ON CONFLICT (user_id, course_id) DO NOTHING RETURNING *', [user_id, course_id]);
        res.status(201).json({
            success: true,
            message: 'Utilisateur assigné au cours avec succès'
        });
    }
    catch (error) {
        console.error('Assign user to course error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.delete('/assign-course', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { user_id, course_id } = req.body;
        if (!user_id || !course_id) {
            res.status(400).json({
                success: false,
                message: 'ID utilisateur et ID cours requis'
            });
            return;
        }
        await database_1.default.query('DELETE FROM user_courses WHERE user_id = $1 AND course_id = $2', [user_id, course_id]);
        res.json({
            success: true,
            message: 'Utilisateur retiré du cours avec succès'
        });
    }
    catch (error) {
        console.error('Remove user from course error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.get('/course-assignments/:courseId', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        if (isNaN(courseId)) {
            res.status(400).json({
                success: false,
                message: 'ID de cours invalide'
            });
            return;
        }
        const result = await database_1.default.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        uc.assigned_at,
        uc.is_active
      FROM users u
      JOIN user_courses uc ON u.id = uc.user_id
      WHERE uc.course_id = $1
      ORDER BY uc.assigned_at DESC
    `, [courseId]);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Get course assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.get('/courses', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const result = await database_1.default.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT uc.id) as enrolled_users,
        COUNT(DISTINCT v.id) as video_count
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
        console.error('Get admin courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.post('/courses', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
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
            message: 'Erreur serveur lors de la création du cours'
        });
    }
});
router.put('/courses/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const { title, description, cover_image, is_active } = req.body;
        if (isNaN(courseId)) {
            res.status(400).json({
                success: false,
                message: 'ID de cours invalide'
            });
            return;
        }
        if (!title || !description) {
            res.status(400).json({
                success: false,
                message: 'Titre et description requis'
            });
            return;
        }
        const result = await database_1.default.query(`
      UPDATE courses 
      SET title = $1, description = $2, cover_image = $3, is_active = $4, updated_at = NOW()
      WHERE id = $5 
      RETURNING *
    `, [title.trim(), description.trim(), cover_image || null, is_active !== false, courseId]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Cours mis à jour avec succès',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour'
        });
    }
});
router.delete('/courses/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        if (isNaN(courseId)) {
            res.status(400).json({
                success: false,
                message: 'ID de cours invalide'
            });
            return;
        }
        const result = await database_1.default.query('UPDATE courses SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id, title', [courseId]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Cours supprimé avec succès',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression'
        });
    }
});
exports.default = router;
