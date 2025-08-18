import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { pool } from '../database';
import { config } from '../config';



export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    isAdmin: boolean;
  };
}


export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    console.log('[auth] Decoded JWT:', decoded);

    // Hardcoded admin shortcut
    if (decoded.id === 999 && decoded.email === 'admin@cliniquejuriste.com') {
      req.user = {
        id: 999,
        email: 'admin@cliniquejuriste.com',
        role: 'admin',
        isAdmin: true
      };
      return next();
    }

    // Normal DB lookup (for other users)
    const userResult = await pool.query(
      'SELECT id, email, is_admin, is_approved FROM users WHERE id = $1',
      [decoded.id]
    );
    console.log('[auth] DB user result:', userResult.rows);

    if (userResult.rows.length === 0 || !userResult.rows[0].is_approved) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      role: user.is_admin ? 'admin' : 'user',
      isAdmin: user.is_admin
    };

    next();
  } catch (error) {
    console.log('[auth] JWT error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};