import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../services/dbService';
import { User, UserRole } from '../../shared/types';

export interface AuthenticatedRequest extends Request {
user?: User;
}

const JWT_SECRET =
process.env.JWT_SECRET ||
'dark_falcon_ultra_secure_jwt_secret_key_2026_change_in_prod';

export function signToken(user: User): string {
return jwt.sign(
{
id: user.id,
username: user.username,
email: user.email,
displayName: user.displayName,
avatarUrl: user.avatarUrl,
role: user.role,
tokenVersion: user.tokenVersion || 1,
},
JWT_SECRET,
{ expiresIn: '7d' }
);
}

export function requireAuth(
req: AuthenticatedRequest,
res: Response,
next: NextFunction
): void {
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
email?: string;
displayName?: string;
avatarUrl?: string;
role: UserRole;
tokenVersion?: number;
};

const user = db.findUserById(decoded.id);

console.log('🦅 AUTH DEBUG:', {
  userId: decoded.id,
  username: decoded.username,
  email: decoded.email,
  userFound: Boolean(user),
  tokenVersion: decoded.tokenVersion,
});

if (!user) {
  console.warn(
    '🦅 AUTH DEBUG: User missing from database for valid JWT:',
    decoded.id
  );

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    code: 'USER_NOT_FOUND',
    message:
      'Authenticated user could not be found. Please sign in again.',
  });
  return;
}

if (user.isBanned) {
  res.status(403).json({
    success: false,
    error: 'Forbidden',
    code: 'ACCOUNT_BANNED',
    message:
      'This account has been banned due to violations of Dark Falcon community rules.',
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

if (
  decoded.tokenVersion !== undefined &&
  user.tokenVersion !== undefined &&
  decoded.tokenVersion < user.tokenVersion
) {
  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    code: 'TOKEN_REVOKED',
    message:
      'This session has been revoked or password was changed. Please sign in again.',
  });
  return;
}

req.user = user;
next();

} catch (err) {
console.error('🦅 AUTH DEBUG: JWT verification failed:', err);

res.status(401).json({
  success: false,
  error: 'Unauthorized',
  code: 'INVALID_TOKEN',
  message:
    'Session has expired or token is invalid. Please log in again.',
});

}
}

export function optionalAuth(
req: AuthenticatedRequest,
res: Response,
next: NextFunction
): void {
const authHeader = req.headers.authorization;

if (authHeader && authHeader.startsWith('Bearer ')) {
const token = authHeader.split(' ')[1];

try {
  const decoded = jwt.verify(token, JWT_SECRET) as {
    id: string;
  };

  const user = db.findUserById(decoded.id);

  if (user && !user.isBanned && !user.isSuspended) {
    req.user = user;
  }
} catch {
  // Optional authentication failures are ignored.
}

}

next();
}

export function requireModerator(
req: AuthenticatedRequest,
res: Response,
next: NextFunction
): void {
requireAuth(req, res, () => {
if (
!req.user ||
!['moderator', 'admin', 'super_admin'].includes(req.user.role)
) {
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

export function requireAdmin(
req: AuthenticatedRequest,
res: Response,
next: NextFunction
): void {
requireAuth(req, res, () => {
if (
!req.user ||
!['admin', 'super_admin'].includes(req.user.role)
) {
res.status(403).json({
success: false,
error: 'Forbidden',
code: 'ADMIN_REQUIRED',
message:
'Administrator privileges required to access this console.',
});
return;
}

next();

});
}

export function requireSuperAdmin(
req: AuthenticatedRequest,
res: Response,
next: NextFunction
): void {
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
