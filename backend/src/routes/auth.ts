import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../database';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '1h' : '7d');

// Helper function to generate unique session token
const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to calculate expiry date
const getExpiryDate = (): Date => {
  const now = new Date();
  const expiryTime = JWT_EXPIRES_IN;
  
  if (expiryTime.endsWith('d')) {
    const days = parseInt(expiryTime.replace('d', ''));
    now.setDate(now.getDate() + days);
  } else if (expiryTime.endsWith('h')) {
    const hours = parseInt(expiryTime.replace('h', ''));
    now.setHours(now.getHours() + hours);
  } else if (expiryTime.endsWith('m')) {
    const minutes = parseInt(expiryTime.replace('m', ''));
    now.setMinutes(now.getMinutes() + minutes);
  } else {
    // Default to 1 hour
    now.setHours(now.getHours() + 1);
  }
  
  return now;
};

// Login route with single session enforcement
// (only the login handler is shown here — replace the login handler in your existing file)
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    email = typeof email === 'string' ? email.trim().toLowerCase() : email;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const userQuery = 'SELECT id, name, email, password, is_admin, is_approved FROM users WHERE lower(trim(email)) = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    const user = userResult.rows[0];
    if (!user.is_approved) {
      return res.status(403).json({ success: false, message: 'Compte non approuvé' });
    }

    const isValid = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    // === SINGLE-SESSION (BLOCK NEW LOGIN) LOGIC ===
    // If an active session exists for this user, return 409 WITHOUT creating a new session.
    const activeSessionQuery = `
      SELECT id, session_token, expires_at 
      FROM user_sessions 
      WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
      LIMIT 1
    `;
    const activeSessionResult = await pool.query(activeSessionQuery, [user.id]);

    if (activeSessionResult.rows.length > 0) {
      // Active session exists - block new login
      return res.status(409).json({
        success: false,
        message: 'Account already logged in elsewhere',
        code: 'SESSION_CONFLICT'
      });
    }

    // No active session: proceed to create session (same as before)
    const sessionToken = generateSessionToken();
    const expiryDate = getExpiryDate();

    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin || false,
        sessionToken: sessionToken
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const insertSessionQuery = `
      INSERT INTO user_sessions (user_id, session_token, jwt_token, expires_at, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id
    `;

    await pool.query(insertSessionQuery, [
      user.id,
      sessionToken,
      jwtToken,
      expiryDate
    ]);

    return res.json({
      success: true,
      token: jwtToken,
      sessionToken: sessionToken,
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
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Logout route to properly terminate session
router.post('/logout', async (req, res) => {
  try {
    const header = (req.headers['authorization'] as string) || (req.headers['x-access-token'] as string);
    
    if (!header) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }

    const parts = header.split(' ');
    let token = header;
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }

    // Decode token to get user info
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Deactivate session
    await pool.query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND session_token = $2',
      [decoded.id, decoded.sessionToken]
    );

    console.log('✅ Logout successful for user id:', decoded.id);
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    // Even if there's an error, we should allow logout
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  }
});

// Session validation route
router.get('/validate-session', async (req, res) => {
  try {
    const header = (req.headers['authorization'] as string) || (req.headers['x-access-token'] as string);
    
    if (!header) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const parts = header.split(' ');
    let token = header;
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if session is still active
    const sessionQuery = `
      SELECT s.*, u.name, u.email, u.is_admin, u.is_approved
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1 AND s.session_token = $2 AND s.is_active = true AND s.expires_at > NOW()
    `;
    
    const sessionResult = await pool.query(sessionQuery, [decoded.id, decoded.sessionToken]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Session invalide ou expirée'
      });
    }

    const session = sessionResult.rows[0];
    
    res.json({
      success: true,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        isAdmin: session.is_admin || false,
        is_admin: session.is_admin || false
      }
    });

  } catch (error) {
    console.error('❌ Session validation error:', error);
    res.status(401).json({
      success: false,
      message: 'Session invalide'
    });
  }
});

// Clean up expired sessions (call this periodically)
router.delete('/cleanup-sessions', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = false'
    );
    
    console.log('🧹 Cleaned up', result.rowCount, 'expired sessions');
    
    res.json({
      success: true,
      message: `Cleaned up ${result.rowCount} expired sessions`
    });
  } catch (error) {
    console.error('❌ Session cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des sessions'
    });
  }
});

// Admin helper: reset password for any user
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

    // Terminate all active sessions for this user when password is reset
    await pool.query('UPDATE user_sessions SET is_active = false WHERE user_id = $1', [result.rows[0].id]);

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

// Debug route: list all users
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