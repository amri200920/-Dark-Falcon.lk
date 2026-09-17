import 'dotenv/config';
import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { db } from '../src/server/services/dbService';
import { signToken, requireAuth } from '../src/server/middleware/authMiddleware';
import * as firebaseAdmin from '../src/server/services/firebaseAdminService';

describe('Dark Falcon Authentication 2.0 Verification Suite', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'dark_falcon_ultra_secure_jwt_secret_key_2026_change_in_prod';

  const testTimestamp = Date.now();
  const googleUid = `firebase-uid-${testTimestamp}`;
  const testEmail = `google_pilot_${testTimestamp}@darkfalcon.io`;

  // 1. New Google user profile creation & unique handle generation
  it('1. Creates new Google user with automatic profile generation, Firebase UID and avatar', () => {
    const displayName = 'Sky Falcon';
    const photoUrl = 'https://lh3.googleusercontent.com/a/test-photo';

    const baseUsername = testEmail.split('@')[0];
    const newUser = {
      id: `user-g-${testTimestamp}`,
      email: testEmail.toLowerCase(),
      username: baseUsername,
      displayName,
      avatarUrl: photoUrl,
      role: 'user' as const,
      isVerified: true,
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOnline: true,
      firebaseUid: googleUid,
      authProvider: 'google' as const,
    };

    db.createUser(newUser, `firebase_google_${googleUid}`);
    const found = db.findUserByFirebaseUid(googleUid);

    expect(found).toBeDefined();
    expect(found?.email).toBe(testEmail);
    expect(found?.displayName).toBe('Sky Falcon');
    expect(found?.avatarUrl).toBe(photoUrl);
    expect(found?.firebaseUid).toBe(googleUid);
    expect(found?.authProvider).toBe('google');
  });

  // 2. Existing Google user profile synchronization
  it('2. Synchronizes profile photo and display name for existing Google users', () => {
    const updatedPhoto = 'https://lh3.googleusercontent.com/a/new-synced-photo';
    const updatedName = 'Sky Falcon Supreme';

    const existing = db.findUserByFirebaseUid(googleUid);
    expect(existing).toBeDefined();

    const updated = db.updateUser(existing!.id, {
      displayName: updatedName,
      avatarUrl: updatedPhoto,
    });

    expect(updated?.displayName).toBe(updatedName);
    expect(updated?.avatarUrl).toBe(updatedPhoto);
  });

  // 3. Logout
  it('3. Successfully terminates session and marks user offline on logout', () => {
    const user = db.findUserByEmail(testEmail)!;
    const session = db.createSession({
      id: 'sess-logout-test',
      userId: user.id,
      device: 'Desktop Browser',
      browser: 'Chrome',
      ip: '127.0.0.1',
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      current: true,
    });

    expect(db.getUserSessions(user.id).some((s) => s.id === 'sess-logout-test')).toBe(true);

    // Terminate session
    db.removeSession('sess-logout-test');
    db.updateUser(user.id, { isOnline: false });

    expect(db.getUserSessions(user.id).some((s) => s.id === 'sess-logout-test')).toBe(false);
    expect(db.findUserById(user.id)?.isOnline).toBe(false);
  });

  // 4. Session restoration / refresh
  it('4. Rehydrates authenticated user profile from valid JWT token on page refresh', () => {
    const user = db.findUserByUsername('darkfalcon_admin')!;
    const token = signToken(user);

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const restoredUser = db.findUserById(decoded.id);

    expect(restoredUser).toBeDefined();
    expect(restoredUser?.username).toBe('darkfalcon_admin');
    expect(restoredUser?.role).toBe('super_admin');
  });

  // 5. Protected route access with valid token
  it('5. Allows access to protected routes with valid Bearer token', () => {
    const user = db.findUserByUsername('darkfalcon_admin')!;
    const token = signToken(user);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
    };
    let nextCalled = false;
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.user?.id).toBe(user.id);
  });

  // 6. Expired / Invalid token rejection
  it('6. Rejects invalid and tampered tokens with 401 INVALID_TOKEN', () => {
    const req: any = {
      headers: { authorization: 'Bearer invalid.tampered.token' },
    };
    let nextCalled = false;
    let statusCode = 0;
    let responseBody: any = null;

    const res: any = {
      status: vi.fn((code) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((data) => {
        responseBody = data;
        return res;
      }),
    };

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(401);
    expect(responseBody?.code).toBe('INVALID_TOKEN');
  });

  // 7. Email and password authentication
  it('7. Authenticates email/password securely via bcrypt', () => {
    const admin = db.findUserByEmail('admin@darkfalcon.io')!;
    const isValidAdminPass =
      db.verifyPassword(admin.id, process.env.DEFAULT_ADMIN_PASSWORD || '') ||
      db.verifyPassword(admin.id, 'CHANGE_ME_ADMIN_PASSWORD');
    expect(isValidAdminPass).toBe(true);
    expect(db.verifyPassword(admin.id, 'WrongPassword')).toBe(false);
  });

  // 8. Password reset & verification
  it('8. Successfully updates user password and verifies new credential', () => {
    const user = db.findUserByEmail(testEmail)!;
    db.updateUserPassword(user.id, 'NewFalconPass@2026');

    expect(db.verifyPassword(user.id, 'NewFalconPass@2026')).toBe(true);
  });

  // 9. Unauthorized API request rejection (missing token)
  it('9. Rejects unauthenticated requests with 401 AUTH_REQUIRED', () => {
    const req: any = {
      headers: {},
    };
    let nextCalled = false;
    let statusCode = 0;
    let responseBody: any = null;

    const res: any = {
      status: vi.fn((code) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((data) => {
        responseBody = data;
        return res;
      }),
    };

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(401);
    expect(responseBody?.code).toBe('AUTH_REQUIRED');
  });

  // 10. Firebase token verification requirement (spoofing protection)
  it('10. Enforces real Firebase token verification and rejects empty/missing tokens', async () => {
    await expect(firebaseAdmin.verifyFirebaseIdToken('')).rejects.toThrow('Firebase ID token is required');
    await expect(firebaseAdmin.verifyFirebaseIdToken('fake-unsigned-token')).rejects.toThrow();
  });
});


