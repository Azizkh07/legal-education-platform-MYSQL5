// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  // Allow preflight requests through
  if (req.method === 'OPTIONS') return next();

  // Support Authorization: Bearer <token> and x-access-token header
  const header = (req.headers['authorization'] as string) || (req.headers['x-access-token'] as string);
  if (!header) {
    console.warn('[auth] Missing Authorization header');
    return res.status(401).json({ error: 'Access token required' });
  }

  const parts = header.split(' ');
  let token = header;
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    token = parts[1];
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // ============ SINGLE SESSION VALIDATION ============
    
    // Check if the session token exists and is still active
    const sessionQuery = `
      SELECT s.id, s.user_id, s.session_token, s.is_active, s.expires_at,
             u.email, u.is_admin, u.is_approved, u.name
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1 AND s.session_token = $2 AND s.jwt_token = $3
    `;
    
    // Your JWT structure uses decoded.id and decoded.sessionToken
    const sessionResult = await pool.query(sessionQuery, [
      decoded.id, 
      decoded.sessionToken,
      token
    ]);

    if (sessionResult.rows.length === 0) {
      console.warn('[auth] Session not found in database for user:', decoded.id);
      return res.status(401).json({ 
        error: 'Invalid session. Please log in again.',
        code: 'SESSION_NOT_FOUND'
      });
    }

    const session = sessionResult.rows[0];

    // Check if session is active
    if (!session.is_active) {
      console.warn('[auth] Session is not active for user:', decoded.id);
      return res.status(401).json({ 
        error: 'Session terminated. Please log in again.',
        code: 'SESSION_INACTIVE'
      });
    }

    // Check if session has expired
    if (new Date() > new Date(session.expires_at)) {
      console.warn('[auth] Session has expired for user:', decoded.id);
      
      // Mark session as inactive
      await pool.query(
        'UPDATE user_sessions SET is_active = false WHERE id = $1',
        [session.id]
      );
      
      return res.status(401).json({ 
        error: 'Session expired. Please log in again.',
        code: 'SESSION_EXPIRED'
      });
    }

    // Check if user is still approved
    if (!session.is_approved) {
      console.warn('[auth] User not approved:', decoded.id);
      
      // Deactivate session for unapproved users
      await pool.query(
        'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
        [session.user_id]
      );
      
      return res.status(403).json({ 
        error: 'User not approved',
        code: 'USER_NOT_APPROVED'
      });
    }

    // ============ SESSION IS VALID ============
    
    // Attach user info to request for downstream handlers
    (req as any).user = {
      id: session.user_id,
      email: session.email,
      isAdmin: session.is_admin || false,
      is_admin: session.is_admin || false,
      name: session.name,
      sessionToken: session.session_token
    };

    // Update last_accessed timestamp
    await pool.query(
      'UPDATE user_sessions SET last_accessed = NOW() WHERE id = $1',
      [session.id]
    );

    next();

  } catch (err: any) {
    console.warn('[auth] JWT/DB error:', err && err.name ? err.name : err);
    
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please log in again.',
        code: 'JWT_EXPIRED'
      });
    }
    
    if (err?.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token format',
        code: 'JWT_INVALID'
      });
    }
    
    // Database or other errors
    console.error('[auth] Unexpected error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.isAdmin || user.is_admin) return next();
  return res.status(403).json({ error: 'Admin privileges required' });
};