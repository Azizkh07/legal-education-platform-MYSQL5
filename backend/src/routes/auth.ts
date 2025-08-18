import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../database';

const router = express.Router();

// Login route that matches your database structure
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for:', email);
    console.log('🔍 Request body:', { email, passwordLength: password?.length });

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      });
    }

    // Check for hardcoded admin first
   /* if (email === 'admin@cliniquejuriste.com' && password === 'admin123') {
      console.log('✅ Hardcoded admin login successful');
      
      const token = jwt.sign(
        { 
          id: 999, 
          email: 'admin@cliniquejuriste.com', 
          isAdmin: true
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: 999,
          name: 'Admin',
          email: 'admin@cliniquejuriste.com',
          isAdmin: true,
          is_admin: true
        }
      });
    }*/

    // Check database for regular users
    console.log('🔍 Checking database for user...');
    
    // Query only the columns that exist in your table
    const userQuery = 'SELECT id, name, email, password, is_admin, created_at FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    console.log('📊 Database query result:', {
      rowCount: userResult.rowCount,
      foundUser: !!userResult.rows[0]
    });

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
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
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // Check password
    let isPasswordValid = false;

    try {
      if (user.password) {
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('🔐 Password comparison result:', isPasswordValid);
      } else {
        console.log('❌ User has no password in database');
      }
    } catch (error) {
      console.error('❌ Password comparison error:', error);
      
      // Fallback: check if it's a plain text password (for testing)
      if (user.password === password) {
        console.log('⚠️ Plain text password match (not secure)');
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiants invalides' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        isAdmin: user.is_admin || false
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for user:', user.email);

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

// Test route to fix Sophie's password
router.post('/fix-sophie-password', async (req, res) => {
  try {
    console.log('🔧 Fixing Sophie password...');
    
    const email = 'sophie.leroy@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update Sophie's password
    const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, name, email, is_admin';
    const result = await pool.query(updateQuery, [hashedPassword, email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sophie not found in database'
      });
    }
    
    console.log('✅ Sophie password updated:', result.rows[0]);
    
    res.json({
      success: true,
      message: 'Sophie password updated',
      user: result.rows[0],
      credentials: {
        email: email,
        password: password
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing Sophie password:', error);
    res.status(500).json({ success: false, message: 'Error fixing password' });
  }
});

// Debug route to check all users
router.get('/debug-users', async (req, res) => {
  try {
    console.log('🔍 Checking all users in database...');
    
    const result = await pool.query('SELECT id, name, email, is_admin, created_at FROM users ORDER BY id');
    
    console.log('📊 All users:', result.rows);
    
    res.json({
      success: true,
      users: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    res.status(500).json({ success: false, message: 'Error checking users' });
  }
});




export { router as authRoutes };