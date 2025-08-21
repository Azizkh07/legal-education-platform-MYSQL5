import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../database';

const router = express.Router();

// Helpers
const generateEmailFromName = (name: string) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}.${suffix}@cliniquejuristes.com`;
};

const generatePassword = () => {
  return (
    Math.random().toString(36).slice(-6) +
    Math.random().toString(36).toUpperCase().slice(-2) +
    '!' +
    Math.floor(10 + Math.random() * 89)
  );
};

// Create a new user (admin)
router.post('/create', async (req, res) => {
  try {
    const { name, email, password, isAdmin = false, isApproved = false } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const finalEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : generateEmailFromName(name);
    const finalPassword = password && password.trim() !== '' ? password : generatePassword();

    // Check duplicate
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [finalEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const hashed = await bcrypt.hash(finalPassword, 10);

    const insertQuery = `
      INSERT INTO users (name, email, password, is_admin, is_approved)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, is_admin, is_approved, created_at, updated_at
    `;
    const result = await pool.query(insertQuery, [name, finalEmail, hashed, isAdmin, isApproved]);
    const newUser = result.rows[0];

    return res.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
      credentials: {
        email: finalEmail,
        password: finalPassword
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ success: false, message: 'Error creating user' });
  }
});

// Get all users (admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, is_admin, is_approved, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({ success: true, users: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Approve user
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET is_approved = true WHERE id = $1 RETURNING id, name, email, is_admin, is_approved, created_at, updated_at`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User approved', user: result.rows[0] });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ success: false, message: 'Error approving user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isAdmin, isApproved } = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (isAdmin !== undefined) { fields.push(`is_admin = $${idx++}`); values.push(isAdmin); }
    if (isApproved !== undefined) { fields.push(`is_approved = $${idx++}`); values.push(isApproved); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, is_admin, is_approved, created_at, updated_at`;
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User updated', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// Reset user password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ success: false, message: 'Email and new password are required' });

    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(`UPDATE users SET password = $1 WHERE email = $2 RETURNING id, name, email, is_admin, is_approved`, [hashed, email]);

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Password reset successful', user: result.rows[0], newPassword });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

export { router as usersRoutes };