"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videosRoutes = void 0;
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const router = express_1.default.Router();
exports.videosRoutes = router;
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const enrollmentResult = await database_1.pool.query('SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
        if (enrollmentResult.rows.length === 0 && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Not enrolled in this course' });
        }
        const result = await database_1.pool.query(`
      SELECT id, title, description, duration_seconds, order_position, is_free
      FROM videos
      WHERE course_id = $1
      ORDER BY order_position
    `, [courseId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({ error: 'Failed to get videos' });
    }
});
