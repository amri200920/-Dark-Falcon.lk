import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../services/dbService';
import { User, UserRole } from '../../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dark_falcon_ultra_secure_jwt_secret_key_2026_change_in_prod';

export function signToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      tokenVersion: user.tokenVersion || 1,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      message: 'Authentication token is required to access this resource.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      role: UserRole;
      tokenVersion?: number;
    };
    const user = db.findUserById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'USER_NOT_FOUND',
        message: 'The authenticated user account no longer exists.',
      });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'ACCOUNT_BANNED',
        message: 'This account has been banned due to violations of Dark Falcon community rules.',
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'ACCOUNT_SUSPENDED',
        message: 'This account is currently suspended.',
      });
      return;
    }

    // Token revocation check: if user's tokenVersion was incremented, reject older tokens
    if (decoded.tokenVersion && user.tokenVersion && decoded.tokenVersion < user.tokenVersion) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'TOKEN_REVOKED',
        message: 'This session has been revoked or password was changed. Please sign in again.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
      message: 'Session has expired or token is invalid. Please log in again.',
    });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = db.findUserById(decoded.id);
      if (user && !user.isBanned) {
        req.user = user;
      }
    } catch {
      // ignore
    }
  }
  next();
}

export function requireModerator(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || !['moderator', 'admin', 'super_admin'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'MODERATOR_REQUIRED',
        message: 'Moderator privileges required.',
      });
      return;
    }
    next();
  });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'ADMIN_REQUIRED',
        message: 'Administrator privileges required to access this console.',
      });
      return;
    }
    next();
  });
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'SUPER_ADMIN_REQUIRED',
        message: 'Super Administrator privileges required.',
      });
      return;
    }
    next();
  });
}
