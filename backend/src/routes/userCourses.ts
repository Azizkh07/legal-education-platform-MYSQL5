import express from 'express';
import { pool } from '../database';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/user-courses/enroll
 * Body: { userId: number, courseId: number }
 * Admin only: assign a user to a course
 */
router.post('/enroll', authenticateToken, requireAdmin, async (req, res) => {
    // Temporary debug: log arrival and headers.auth
    console.log('[user-courses] POST /enroll received - headers.authorization =', req.headers.authorization ? '[RECEIVED]' : '[MISSING]');
    console.log('[user-courses] Request info:', { method: req.method, path: req.path, ip: req.ip, bodyPreview: req.body ? Object.keys(req.body) : null });
  
    try {
      const { userId, courseId } = req.body;
      if (!userId || !courseId) return res.status(400).json({ success: false, message: 'userId and courseId required' });
  
      // Avoid duplicate
      const exists = await pool.query('SELECT 1 FROM user_courses WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
      if (exists.rows.length > 0) {
        return res.json({ success: true, message: 'User already enrolled', enrolled: true });
      }
  
      await pool.query('INSERT INTO user_courses (user_id, course_id, created_at) VALUES ($1, $2, NOW())', [userId, courseId]);
      res.json({ success: true, message: 'User enrolled in course' });
    } catch (error) {
      console.error('Error enrolling user:', error);
      res.status(500).json({ success: false, message: 'Error enrolling user' });
    }
  });
/**
 * DELETE /api/user-courses/enroll
 * Body: { userId: number, courseId: number }
 * Admin only: remove enrollment
 */
router.delete('/enroll', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // req.body for DELETE might be missing in some clients; handle both body and query
    const userId = req.body.userId ?? req.query.userId;
    const courseId = req.body.courseId ?? req.query.courseId;
    if (!userId || !courseId) return res.status(400).json({ success: false, message: 'userId and courseId required' });

    const result = await pool.query('DELETE FROM user_courses WHERE user_id = $1 AND course_id = $2 RETURNING id', [userId, courseId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    res.json({ success: true, message: 'Enrollment removed' });
  } catch (error) {
    console.error('Error removing enrollment:', error);
    res.status(500).json({ success: false, message: 'Error removing enrollment' });
  }
});

/**
 * GET /api/user-courses/me
 * Authenticated: returns array of course ids user is enrolled in and optional course objects
 */
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const result = await pool.query(`
      SELECT c.id, c.title, c.description, c.category, c.cover_image, c.is_active
      FROM user_courses uc
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.user_id = $1
    `, [userId]);

    const courseIds = result.rows.map((r: any) => r.id);
    res.json({ success: true, courses: result.rows, courseIds });
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({ success: false, message: 'Error fetching enrollments' });
  }
});

/**
 * GET /api/user-courses/user/:id
 * Admin: get enrollments for a user
 */
router.get('/user/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ success: false, message: 'Invalid user id' });

    const result = await pool.query(`
      SELECT c.id, c.title, c.description, c.category, c.cover_image, c.is_active
      FROM user_courses uc
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.user_id = $1
    `, [userId]);

    const courseIds = result.rows.map((r: any) => r.id);
    res.json({ success: true, courses: result.rows, courseIds });
  } catch (error) {
    console.error('Error fetching user enrollments (admin):', error);
    res.status(500).json({ success: false, message: 'Error fetching enrollments' });
  }
});

export { router as userCoursesRoutes };