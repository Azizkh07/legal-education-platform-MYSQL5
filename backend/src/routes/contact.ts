import express from 'express';
import { pool } from '../database';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for contact form (5 messages per hour per IP)
const contactLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many contact requests. Please try again later.' }
});

// Send contact message
router.post('/', contactLimit, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (message.length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters long' });
    }

    // Insert message
    const result = await pool.query(`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `, [name.trim(), email.trim(), subject.trim(), message.trim()]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('Contact message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all contact messages (admin only)
router.get('/', async (req, res) => {
  try {
    // This would need admin auth middleware, but for now...
    const result = await pool.query(`
      SELECT id, name, email, subject, message, is_read, created_at
      FROM contact_messages
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Mark message as read (admin only)
router.patch('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await pool.query(`
      UPDATE contact_messages 
      SET is_read = true, replied_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, is_read
    `, [messageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

export { router as contactRoutes };