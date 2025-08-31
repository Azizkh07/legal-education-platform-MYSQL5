import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../database';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Make token lifetime configurable; longer in development for convenience
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '1h' : '7d');

// Login route that matches your database structure
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    console.log('🔐 Login attempt received');
    // Normalize input
    email = typeof email === 'string' ? email.trim().toLowerCase() : email;
    console.log('🔍 Normalized email:', email);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Query only the columns that exist in your table and include is_approved
    const userQuery = 'SELECT id, name, email, password, is_admin, is_approved, created_at FROM users WHERE lower(trim(email)) = $1';
    const userResult = await pool.query(userQuery, [email]);

    console.log('📊 Database query result:', {
      rowCount: userResult.rowCount,
      foundUser: !!userResult.rows[0]
    });

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database for email:', email);
      // 401 for invalid credentials (do not reveal which)
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const user = userResult.rows[0];
    console.log('👤 Found user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin,
      is_approved: user.is_approved,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Block login if account not approved
    if (!user.is_approved) {
      console.log('⛔ Login blocked - account not approved for user id:', user.id);
      return res.status(403).json({
        success: false,
        message: 'Compte non approuvé. Veuillez demander l\'approbation à un administrateur.'
      });
    }

    // Check password
    let isPasswordValid = false;
    if (user.password) {
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('🔐 Password comparison result:', isPasswordValid);
      } catch (err) {
        console.error('❌ Password compare error:', err);
        // fallback plain-text match only for emergency debugging (NOT recommended)
        if (user.password === password) {
          console.warn('⚠️ Plain text password matched (insecure fallback)');
          isPasswordValid = true;
        }
      }
    } else {
      console.log('❌ User has no password in DB for id:', user.id);
    }

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user id:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Generate JWT token using configurable expiry
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin || false
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('✅ Login successful for user id:', user.id, 'expiresIn:', JWT_EXPIRES_IN);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin || false,
        is_admin: user.is_admin || false
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Admin helper: reset password for any user (POST /api/auth/reset-password-admin)
// Body: { email: string, newPassword?: string }
// NOTE: This route is not protected in this snippet. In production you should protect it (e.g. admin-only).
router.post('/reset-password-admin', async (req, res) => {
  try {
    let { email, newPassword } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email est requis' });

    email = String(email).trim().toLowerCase();
    newPassword = newPassword && String(newPassword).trim() !== '' ? String(newPassword) : (Math.random().toString(36).slice(-8) + 'A!');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = 'UPDATE users SET password = $1 WHERE lower(trim(email)) = $2 RETURNING id, name, email, is_admin, is_approved';
    const result = await pool.query(updateQuery, [hashedPassword, email]);

    if (result.rows.length === 0) {
      console.log('❌ Reset password: user not found for email', email);
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    console.log('🔧 Password reset for user:', result.rows[0]);
    res.json({
      success: true,
      message: 'Mot de passe mis à jour',
      user: result.rows[0],
      credentials: {
        email,
        password: newPassword
      }
    });
  } catch (error) {
    console.error('❌ Error resetting password (admin):', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Debug route: list all users (keeps existing behavior)
router.get('/debug-users', async (req, res) => {
  try {
    console.log('🔍 Listing users (debug)');
    const result = await pool.query('SELECT id, name, email, is_admin, is_approved, created_at FROM users ORDER BY id');
    console.log('📊 Users:', result.rows);
    res.json({ success: true, users: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('❌ Error listing users:', error);
    res.status(500).json({ success: false, message: 'Error checking users' });
  }
});

export { router as authRoutes };