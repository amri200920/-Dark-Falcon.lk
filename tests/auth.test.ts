import { describe, it, expect } from 'vitest';
import { db } from '../src/server/services/dbService';
import { signToken } from '../src/server/middleware/authMiddleware';
import jwt from 'jsonwebtoken';

describe('Dark Falcon Authentication & Session Architecture', () => {
  it('verifies unique username creation and case-insensitive check', () => {
    const testUser = {
      id: 'test-user-1',
      email: 'pilot_test@darkfalcon.io',
      username: 'sovereign_falcon',
      displayName: 'Test Aviator',
      role: 'user' as const,
      isVerified: true,
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createUser(testUser, 'UltraSecret@2026');

    const foundLower = db.findUserByUsername('sovereign_falcon');
    const foundUpper = db.findUserByUsername('SOVEREIGN_FALCON');
    const foundMixed = db.findUserByUsername('Sovereign_Falcon');

    expect(foundLower).toBeDefined();
    expect(foundUpper).toBeDefined();
    expect(foundMixed).toBeDefined();
    expect(foundLower?.id).toBe('test-user-1');
  });

  it('verifies bcrypt password matching and invalid rejection', () => {
    const valid = db.verifyPassword('test-user-1', 'UltraSecret@2026');
    const invalid = db.verifyPassword('test-user-1', 'WrongPassword123');

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  it('generates valid JWT token with user credentials', () => {
    const user = db.findUserById('test-user-1')!;
    const token = signToken(user);
    const decoded: any = jwt.decode(token);

    expect(decoded.id).toBe('test-user-1');
    expect(decoded.username).toBe('sovereign_falcon');
    expect(decoded.role).toBe('user');
  });

  it('creates and tracks active hardware sessions', () => {
    const session = db.createSession({
      id: 'test-sess-1',
      userId: 'test-user-1',
      device: 'Windows Desktop Falcon Terminal',
      browser: 'Chrome',
      ip: '192.168.1.1',
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      current: true,
    });

    const userSessions = db.getUserSessions('test-user-1');
    expect(userSessions.some((s) => s.id === 'test-sess-1')).toBe(true);
  });
});
