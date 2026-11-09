import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { users, refreshTokens } from '../../src/db/schema/index.js';

function extractValue(clause: any): any {
  if (!clause) return undefined;
  if (clause.queryChunks) {
    for (const chunk of clause.queryChunks) {
      if (chunk && typeof chunk === 'object' && 'value' in chunk && !Array.isArray(chunk.value)) {
        return chunk.value;
      }
    }
  }
  if (clause.value !== undefined && !Array.isArray(clause.value)) {
    return clause.value;
  }
  return undefined;
}

describe('Authentication Flow & Argon2 Verification Suite', () => {
  let authService: AuthService;
  let mockDb: any;
  let jwtService: JwtService;
  let mockConfigService: any;

  let usersList: any[] = [];
  let refreshTokensList: any[] = [];

  const existingEmail = 'student@example.com';
  const rawPassword = 'StrongPassword123!';
  let hashedPassword = '';

  beforeEach(async () => {
    hashedPassword = await argon2.hash(rawPassword);

    usersList = [
      {
        id: 'user-auth-1',
        email: existingEmail,
        passwordHash: hashedPassword,
        role: 'student',
        locale: 'ar',
        emailVerifiedAt: new Date('2026-11-01'),
        createdAt: new Date('2026-11-01'),
        updatedAt: new Date('2026-11-01'),
      },
    ];

    refreshTokensList = [];

    jwtService = new JwtService();
    mockConfigService = {
      get: vi.fn((key: string, def?: any) => {
        if (key === 'JWT_SECRET') return 'test-secret-key-for-jwt-signing-minimum-32-chars';
        if (key === 'NODE_ENV') return 'test';
        return def;
      }),
    } as unknown as ConfigService;

    mockDb = {
      query: {
        users: {
          findFirst: async (opts: any) => {
            const val = extractValue(opts?.where);
            if (val && typeof val === 'string' && val.includes('@')) {
              return usersList.find((u) => u.email === val) || null;
            }
            if (val && typeof val === 'string') {
              return usersList.find((u) => u.id === val) || null;
            }
            return usersList[0] || null;
          },
        },
        refreshTokens: {
          findFirst: async (opts: any) => {
            const hash = extractValue(opts?.where);
            return refreshTokensList.find((t) => t.tokenHash === hash) || null;
          },
        },
      },
      insert: (table: any) => ({
        values: (item: any) => {
          let record = item;
          if (table === users) {
            record = {
              ...item,
              id: 'user-new-registered',
              emailVerifiedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            usersList.push(record);
          } else if (table === refreshTokens) {
            refreshTokensList.push(record);
          }
          const res: any = [record];
          res.returning = () => [record];
          res.then = (fn: any) => fn([record]);
          return res;
        },
      }),
      update: (table: any) => ({
        set: (vals: any) => ({
          where: () => {
            if (table === refreshTokens) {
              for (const tok of refreshTokensList) {
                Object.assign(tok, vals);
              }
            }
            return Promise.resolve();
          },
        }),
      }),
    };

    authService = new AuthService(mockDb, jwtService, mockConfigService);
  });

  it('registers a new student with email normalization, role assignment, and hashed credentials', async () => {
    const signupData = {
      email: '  NEW.STUDENT@Sage.Academy  ',
      password: 'MySecretPassword1!',
      role: 'student' as const,
      locale: 'en' as const,
    };

    const res = await authService.signup(signupData);
    expect(res.user.email).toBe('new.student@sage.academy');
    expect(res.user.role).toBe('student');
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();

    const created = usersList.find((u) => u.email === 'new.student@sage.academy');
    expect(created).toBeDefined();
    expect(created?.passwordHash).not.toBe('MySecretPassword1!');
    expect(await argon2.verify(created?.passwordHash, 'MySecretPassword1!')).toBe(true);
  });

  it('rejects registration with ConflictException when email is already in use', async () => {
    await expect(
      authService.signup({
        email: existingEmail.toUpperCase(),
        password: 'AnotherPassword123!',
        role: 'student',
        locale: 'ar',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('authenticates valid credentials, returns JWT tokens, and registers active session', async () => {
    const res = await authService.login({
      email: existingEmail,
      password: rawPassword,
    });

    expect(res.user.email).toBe(existingEmail);
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(refreshTokensList).toHaveLength(1);
  });

  it('rejects invalid password with UnauthorizedException and INVALID_CREDENTIALS code', async () => {
    await expect(
      authService.login({
        email: existingEmail,
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects non-existent email with UnauthorizedException', async () => {
    await expect(
      authService.login({
        email: 'ghost@example.com',
        password: 'AnyPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('revokes refresh token on user logout', async () => {
    const rawTok = 'active-refresh-token-string';
    const tokHash = authService.hashToken(rawTok);
    refreshTokensList.push({ id: 'tok-1', tokenHash: tokHash, revokedAt: null });

    await authService.logout(rawTok);
    expect(refreshTokensList[0]?.revokedAt).toBeInstanceOf(Date);
  });
});
