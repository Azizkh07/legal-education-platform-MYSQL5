import express from 'express';
import { pool } from '../database';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get videos for a course (user must be enrolled)
router.get('/course/:courseId', async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    // Check if user is enrolled or is admin
    const enrollmentResult = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (enrollmentResult.rows.length === 0 && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Get videos
    const result = await pool.query(`
      SELECT id, title, description, duration_seconds, order_position, is_free
      FROM videos
      WHERE course_id = $1
      ORDER BY order_position
    `, [courseId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
});

export { router as videosRoutes };