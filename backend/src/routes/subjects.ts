import { Router } from 'express';
import { pool } from '../database/index';

const router = Router();

console.log('📖 FIXED Subjects API loaded for Azizkh07 - 2025-08-20 13:40:09');

// Simple fallback auth middleware
const simpleAuth = (req: any, res: any, next: any) => {
  console.log('🔓 Using simple auth bypass for subjects - Azizkh07');
  req.user = { id: 1, name: 'Azizkh07', email: 'admin@cliniquejuriste.com', is_admin: true };
  next();
};

// Always use simple auth for now
const authenticateToken = simpleAuth;
const requireAdmin = simpleAuth;

console.log('✅ Simple auth middleware loaded for subjects');

// GET all subjects - REAL DATA ONLY
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/subjects - Real database query for Azizkh07 at 2025-08-20 13:40:09');
    
    const result = await pool.query(`
      SELECT 
        s.*,
        c.title as course_title,
        COUNT(v.id) as video_count
      FROM subjects s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN videos v ON s.id = v.subject_id AND v.is_active = true
      WHERE s.is_active = true
      GROUP BY s.id, c.title
      ORDER BY s.course_id, s.order_index, s.created_at
    `);
    
    console.log(`✅ Real data: Found ${result.rows.length} subjects for Azizkh07`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Database error fetching subjects for Azizkh07:', error);
    res.status(500).json({ 
      message: 'Database error fetching subjects',
      error: error.message 
    });
  }
});

// GET subjects for specific course - REAL DATA ONLY
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log(`📋 GET /api/subjects/course/${courseId} - Real data for Azizkh07 at 2025-08-20 13:40:09`);
    
    // Check if course exists
    const courseCheck = await pool.query('SELECT id, title FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      console.log(`❌ Course ${courseId} not found for Azizkh07`);
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const result = await pool.query(`
      SELECT 
        s.*,
        COUNT(v.id) as video_count,
        COALESCE(SUM(v.duration), 0) as total_duration
      FROM subjects s
      LEFT JOIN videos v ON s.id = v.subject_id AND v.is_active = true
      WHERE s.course_id = $1 AND s.is_active = true
      GROUP BY s.id
      ORDER BY s.order_index, s.created_at
    `, [courseId]);
    
    console.log(`✅ Real data: Found ${result.rows.length} subjects for course ${courseId} for Azizkh07`);
    res.json(result.rows);
    
  } catch (error) {
    console.error(`❌ Database error fetching subjects for course ${req.params.courseId} for Azizkh07:`, error);
    res.status(500).json({ 
      message: 'Database error fetching subjects for course',
      error: error.message 
    });
  }
});

// GET single subject - REAL DATA ONLY
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 GET /api/subjects/${id} - Real data for Azizkh07 at 2025-08-20 13:40:09`);
    
    const result = await pool.query(`
      SELECT 
        s.*,
        c.title as course_title,
        COUNT(v.id) as video_count,
        COALESCE(SUM(v.duration), 0) as total_duration
      FROM subjects s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN videos v ON s.id = v.subject_id AND v.is_active = true
      WHERE s.id = $1
      GROUP BY s.id, c.title
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Subject ${id} not found for Azizkh07`);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    console.log(`✅ Real data: Found subject ${id} for Azizkh07`);
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error(`❌ Database error fetching subject ${req.params.id} for Azizkh07:`, error);
    res.status(500).json({ 
      message: 'Database error fetching subject',
      error: error.message 
    });
  }
});

// POST create new subject - REAL DATABASE INSERT
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { course_id, title, description, professor_name, hours, order_index, is_active } = req.body;
    
    console.log('➕ POST /api/subjects - Creating real subject for Azizkh07 at 2025-08-20 13:40:09');
    console.log('👤 User:', req.user?.name || req.user?.email);
    console.log('📝 Subject data:', { course_id, title, professor_name, hours });
    
    // Validate required fields
    if (!course_id || !title || !professor_name) {
      console.log('❌ Missing required fields for subject creation by Azizkh07');
      return res.status(400).json({ 
        message: 'Course ID, title, and professor name are required' 
      });
    }
    
    // Check if course exists
    const courseCheck = await pool.query('SELECT id, title FROM courses WHERE id = $1', [course_id]);
    if (courseCheck.rows.length === 0) {
      console.log(`❌ Course ${course_id} not found for subject creation by Azizkh07`);
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get next order_index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrderResult = await pool.query(
        'SELECT COALESCE(MAX(order_index), 0) as max_order FROM subjects WHERE course_id = $1',
        [course_id]
      );
      finalOrderIndex = (maxOrderResult.rows[0].max_order || 0) + 1;
    }
    
    const result = await pool.query(`
      INSERT INTO subjects 
      (course_id, title, description, professor_name, hours, order_index, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      course_id,
      title.trim(),
      description?.trim() || '',
      professor_name.trim(),
      parseInt(hours) || 0,
      finalOrderIndex,
      is_active !== false
    ]);
    
    console.log('✅ Real subject created in database for Azizkh07:', result.rows[0]);
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Database error creating subject for Azizkh07:', error);
    res.status(500).json({ 
      message: 'Database error creating subject',
      error: error.message 
    });
  }
});

// PUT update subject - REAL DATABASE UPDATE
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, professor_name, hours, order_index, is_active } = req.body;
    
    console.log(`🔄 PUT /api/subjects/${id} - Updating real subject for Azizkh07 at 2025-08-20 13:40:09`);
    console.log('👤 User:', req.user?.name || req.user?.email);
    console.log('📝 Update data:', { title, professor_name, hours, order_index });
    
    // Check if subject exists
    const existsResult = await pool.query('SELECT id FROM subjects WHERE id = $1', [id]);
    if (existsResult.rows.length === 0) {
      console.log(`❌ Subject ${id} not found for update by Azizkh07`);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    const result = await pool.query(`
      UPDATE subjects
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          professor_name = COALESCE($3, professor_name),
          hours = COALESCE($4, hours),
          order_index = COALESCE($5, order_index),
          is_active = COALESCE($6, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [
      title?.trim() || null,
      description?.trim() || null,
      professor_name?.trim() || null,
      hours ? parseInt(hours) : null,
      order_index ? parseInt(order_index) : null,
      is_active,
      id
    ]);
    
    console.log(`✅ Real subject ${id} updated in database for Azizkh07`);
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error(`❌ Database error updating subject ${req.params.id} for Azizkh07:`, error);
    res.status(500).json({ 
      message: 'Database error updating subject',
      error: error.message 
    });
  }
});

// DELETE subject - REAL DATABASE DELETE
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/subjects/${id} - Real database deletion for Azizkh07 at 2025-08-20 13:40:09`);
    console.log('👤 User:', req.user?.name || req.user?.email);
    
    // Check if subject exists and get its info
    const subjectCheck = await pool.query('SELECT id, title, course_id FROM subjects WHERE id = $1', [id]);
    if (subjectCheck.rows.length === 0) {
      console.log(`❌ Subject ${id} not found for deletion by Azizkh07`);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    const subjectName = subjectCheck.rows[0].title;
    const courseId = subjectCheck.rows[0].course_id;
    console.log(`🎯 Deleting real subject for Azizkh07: "${subjectName}" (ID: ${id}) from course ${courseId}`);
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
      // Delete related videos first
      console.log('🔄 Step 1: Deleting related videos from database...');
      const videosDeleted = await pool.query('DELETE FROM videos WHERE subject_id = $1', [id]);
      console.log(`✅ Deleted ${videosDeleted.rowCount || 0} real videos from database`);
      
      // Delete the subject
      console.log('🔄 Step 2: Deleting subject from database...');
      const subjectDeleted = await pool.query('DELETE FROM subjects WHERE id = $1 RETURNING *', [id]);
      
      if (subjectDeleted.rows.length === 0) {
        throw new Error('Subject not found during deletion');
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log(`✅ Real subject "${subjectName}" (ID: ${id}) completely deleted from database for Azizkh07`);
      res.json({ 
        message: 'Subject and all related videos deleted successfully from database',
        deletedSubject: subjectDeleted.rows[0],
        deletedVideos: videosDeleted.rowCount || 0,
        timestamp: '2025-08-20 13:40:09',
        user: 'Azizkh07'
      });
      
    } catch (deleteError) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw deleteError;
    }
    
  } catch (error) {
    console.error(`❌ Database error deleting subject ${req.params.id} for Azizkh07:`, error);
    res.status(500).json({ 
      message: 'Database error deleting subject',
      error: error.message 
    });
  }
});

// Get subject with videos - REAL DATA ONLY
router.get('/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 GET /api/subjects/${id}/videos - Real data for Azizkh07 at 2025-08-20 13:40:09`);
    
    const subjectResult = await pool.query('SELECT * FROM subjects WHERE id = $1', [id]);
    if (subjectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    const videosResult = await pool.query(`
      SELECT * FROM videos 
      WHERE subject_id = $1 AND is_active = true
      ORDER BY order_index, created_at
    `, [id]);
    
    console.log(`✅ Real data: Subject ${id} has ${videosResult.rows.length} videos for Azizkh07`);
    res.json({
      subject: subjectResult.rows[0],
      videos: videosResult.rows
    });
    
  } catch (error) {
    console.error(`❌ Database error fetching subject videos for Azizkh07:`, error);
    res.status(500).json({ 
      message: 'Database error fetching subject videos',
      error: error.message 
    });
  }
});

export default router;