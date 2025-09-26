import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import database from '../config/database';

const router = express.Router();

console.log('🔐 FIXED Auth API loaded for Medsaidabidi02 - 2025-09-09 15:17:20');

const JWT_SECRET = process.env.JWT_SECRET || 'legal-education-platform-super-secret-key-medsaidabidi02-2025-mysql5-version';
// Make token lifetime configurable; longer in development for convenience
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '1h' : '7d');

// Login route that matches your database structure
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    console.log('🔐 Login attempt received for Medsaidabidi02 at 2025-09-09 15:17:20');
    // Normalize input
    email = typeof email === 'string' ? email.trim().toLowerCase() : email;
    console.log('🔍 Normalized email for Medsaidabidi02:', email);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password for Medsaidabidi02');
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // database.query only the columns that exist in your table and include is_approved
    const userResult = await database.query(
      'SELECT id, name, email, password, is_admin, is_approved, created_at FROM users WHERE LOWER(TRIM(email)) = ?',
      [email]
    );

    console.log('📊 Database database.query result for Medsaidabidi02:', {
      rowCount: userResult.rows.length,
      foundUser: !!userResult.rows[0]
    });

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database for email:', email, 'by Medsaidabidi02');
      // 401 for invalid credentials (do not reveal which)
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const user = userResult.rows[0];
    console.log('👤 Found user for Medsaidabidi02:', {
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
      console.log('⛔ Login blocked - account not approved for user id:', user.id, 'by Medsaidabidi02');
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
        console.log('🔐 Password comparison result for Medsaidabidi02:', isPasswordValid);
      } catch (err) {
        console.error('❌ Password compare error for Medsaidabidi02:', err);
        // fallback plain-text match only for emergency debugging (NOT recommended)
        if (user.password === password) {
          console.warn('⚠️ Plain text password matched (insecure fallback) for Medsaidabidi02');
          isPasswordValid = true;
        }
      }
    } else {
      console.log('❌ User has no password in DB for id:', user.id, 'by Medsaidabidi02');
    }

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user id:', user.id, 'by Medsaidabidi02');
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Generate JWT token using configurable expiry
    const token = jwt.sign(
      {  id: user.id,
         email: user.email,
        isAdmin: user.is_admin},
      process.env.JWT_SECRET,
      { expiresIn: '24h'}
    );

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
    console.error('❌ Login error for Medsaidabidi02:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Register route (for new users)
router.post('/register', async (req, res) => {
  try {
    let { name, email, password } = req.body;

    console.log('📝 Registration attempt received for Medsaidabidi02 at 2025-09-09 15:17:20');
    console.log('📝 Registration data:', { name, email: email ? 'provided' : 'missing' });

    // Validate input
    if (!name || !email || !password) {
      console.log('❌ Missing required fields for registration by Medsaidabidi02');
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe requis'
      });
    }

    // Normalize input
    email = email.trim().toLowerCase();
    name = name.trim();

    // Check if user already exists
    const existingUser = await database.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', [email]);
    if (existingUser.rows.length > 0) {
      console.log('❌ User already exists with email:', email, 'by Medsaidabidi02');
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (not approved by default, not admin)
    const result = await database.query(
      'INSERT INTO users (name, email, password, is_admin, is_approved) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, false, false]
    );

    // Get the created user
    const newUser = await database.query(
      'SELECT id, name, email, is_admin, is_approved, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ User registered successfully for Medsaidabidi02:', newUser.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès. En attente d\'approbation.',
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error('❌ Registration error for Medsaidabidi02:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
});

// Admin helper: reset password for any user (POST /api/auth/reset-password-admin)
router.post('/reset-password-admin', async (req, res) => {
  try {
    let { email, newPassword } = req.body;
    console.log('🔧 Password reset attempt for admin by Medsaidabidi02 at 2025-09-09 15:17:20');
    console.log('📧 Target email:', email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email est requis' });
    }

    email = String(email).trim().toLowerCase();
    newPassword = newPassword && String(newPassword).trim() !== '' 
      ? String(newPassword) 
      : (Math.random().toString(36).slice(-8) + 'A!');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await database.query('UPDATE users SET password = ?, updated_at = NOW() WHERE LOWER(TRIM(email)) = ?', [hashedPassword, email]);

    // Get updated user
    const result = await database.query('SELECT id, name, email, is_admin, is_approved FROM users WHERE LOWER(TRIM(email)) = ?', [email]);

    if (result.rows.length === 0) {
      console.log('❌ Reset password: user not found for email', email, 'by Medsaidabidi02');
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    console.log('🔧 Password reset for user by Medsaidabidi02:', result.rows[0]);
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
    console.error('❌ Error resetting password (admin) for Medsaidabidi02:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Change password (for authenticated users)
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.log('🔑 Password change attempt for Medsaidabidi02 at 2025-09-09 15:17:20');

    // Extract user from token (you'll need to implement token verification middleware)
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token d\'accès requis' });
    }

    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    // Get user from database
    const userResult = await database.query('SELECT id, password FROM users WHERE id = ?', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      console.log('❌ Invalid current password for user:', decoded.id, 'by Medsaidabidi02');
      return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect' });
    }

    // Hash and update new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await database.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedNewPassword, decoded.id]);

    console.log('✅ Password changed successfully for user:', decoded.id, 'by Medsaidabidi02');
    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Error changing password for Medsaidabidi02:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token d\'accès requis' });
    }

    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
    }

    // Get fresh user data from database
    const userResult = await database.query(
      'SELECT id, name, email, is_admin, is_approved FROM users WHERE id = ?',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const user = userResult.rows[0];

    // Check if user is still approved
    if (!user.is_approved) {
      return res.status(403).json({ success: false, message: 'Compte non approuvé' });
    }

    console.log('✅ Token verified successfully for user:', user.id, 'by Medsaidabidi02');
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin || false,
        is_admin: user.is_admin || false
      }
    });

  } catch (error) {
    console.error('❌ Error verifying token for Medsaidabidi02:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Debug route: list all users (keeps existing behavior)
router.get('/debug-users', async (req, res) => {
  try {
    console.log('🔍 Listing users (debug) for Medsaidabidi02 at 2025-09-09 15:17:20');
    const result = await database.query('SELECT id, name, email, is_admin, is_approved, created_at FROM users ORDER BY id');
    console.log('📊 Users for Medsaidabidi02:', result.rows);
    res.json({ success: true, users: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('❌ Error listing users for Medsaidabidi02:', error);
    res.status(500).json({ success: false, message: 'Error checking users' });
  }
});

// Logout endpoint (optional - mainly for client-side token cleanup)
router.post('/logout', (req, res) => {
  console.log('👋 Logout request received for Medsaidabidi02 at 2025-09-09 15:17:20');
  // With JWT, logout is typically handled client-side by removing the token
  // You could implement a token blacklist here if needed
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

console.log('🔐 Auth routes module loaded for Medsaidabidi02 at 2025-09-09 15:17:20');

export { router as authRoutes };
export default router;