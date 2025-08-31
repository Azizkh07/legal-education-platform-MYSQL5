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
    // Attach user info to request for downstream handlers
    (req as any).user = decoded;

    // Validate user exists and is approved
    try {
      const result = await pool.query('SELECT id, email, is_admin, is_approved FROM users WHERE id = $1', [decoded.id]);
      if (!result.rows.length) {
        return res.status(401).json({ error: 'User not found' });
      }
      if (!result.rows[0].is_approved) {
        return res.status(403).json({ error: 'User not approved' });
      }
    } catch (dbErr) {
      console.error('[auth] DB check error:', dbErr);
      return res.status(500).json({ error: 'Internal server error' });
    }

    next();
  } catch (err: any) {
    console.warn('[auth] JWT error:', err && err.name ? err.name : err);
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.isAdmin || user.is_admin) return next();
  return res.status(403).json({ error: 'Admin privileges required' });
};