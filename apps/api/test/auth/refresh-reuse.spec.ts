import { describe, it, expect, beforeEach } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { AppErrorCode } from '@sage/shared';

describe('Refresh Token Rotation & Family Reuse Revocation', () => {
  let authService: AuthService;
  let mockUsers: any[];
  let mockRefreshTokens: any[];

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

  beforeEach(() => {
    mockUsers = [];
    mockRefreshTokens = [];

    const mockDb: any = {
      query: {
        users: {
          findFirst: async () => mockUsers[0] || null,
        },
        refreshTokens: {
          findFirst: async (options: any) => {
            const val = extractValue(options?.where);
            if (val) {
              return mockRefreshTokens.find((t) => t.tokenHash === val) || null;
            }
            return null;
          },
        },
      },
      insert: () => ({
        values: (data: any) => {
          const record = {
            id: `token-${mockRefreshTokens.length + 1}`,
            createdAt: new Date(),
            revokedAt: null,
            replacedBy: null,
            ...data,
          };
          mockRefreshTokens.push(record);
          return {
            returning: async () => [record],
          };
        },
      }),
      update: () => ({
        set: (updateValues: any) => ({
          where: (clause: any) => {
            const target = extractValue(clause);
            for (const token of mockRefreshTokens) {
              if (token.familyId === target || token.id === target || token.tokenHash === target) {
                Object.assign(token, updateValues);
              }
            }
            return Promise.resolve();
          },
        }),
      }),
    };

    const jwtService = new JwtService({ secret: 'test-secret' });
    const configService = new ConfigService({
      JWT_SECRET: 'test-secret',
      NODE_ENV: 'test',
    });

    authService = new AuthService(mockDb, jwtService, configService);
  });

  it('rotates a valid refresh token and issues a new successor in the same family', async () => {
    const testUser = {
      id: 'user-1',
      email: 'student@sage.local',
      role: 'student',
      locale: 'en',
      createdAt: new Date(),
      emailVerifiedAt: null,
    };
    mockUsers.push(testUser);

    const initialToken = 'token-secret-1';
    const initialHash = authService.hashToken(initialToken);
    const familyId = 'family-alpha';

    mockRefreshTokens.push({
      id: 'rec-1',
      userId: testUser.id,
      familyId,
      tokenHash: initialHash,
      expiresAt: new Date(Date.now() + 1000000),
      revokedAt: null,
      replacedBy: null,
    });

    const result = await authService.rotateRefreshToken(initialToken);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(initialToken);
    expect(result.user.email).toBe('student@sage.local');

    const oldRecord = mockRefreshTokens.find((t) => t.tokenHash === initialHash);
    expect(oldRecord.revokedAt).not.toBeNull();
    expect(oldRecord.replacedBy).toBeDefined();

    const newHash = authService.hashToken(result.refreshToken);
    const newRecord = mockRefreshTokens.find((t) => t.tokenHash === newHash);
    expect(newRecord).toBeDefined();
    expect(newRecord.familyId).toBe(familyId);
    expect(newRecord.revokedAt).toBeNull();
  });

  it('detects refresh token reuse and revokes the entire token family', async () => {
    const testUser = {
      id: 'user-1',
      email: 'student@sage.local',
      role: 'student',
      locale: 'en',
      createdAt: new Date(),
      emailVerifiedAt: null,
    };
    mockUsers.push(testUser);

    const stolenToken = 'token-compromised';
    const stolenHash = authService.hashToken(stolenToken);
    const familyId = 'family-stolen';

    // Already revoked record
    mockRefreshTokens.push({
      id: 'rec-1',
      userId: testUser.id,
      familyId,
      tokenHash: stolenHash,
      expiresAt: new Date(Date.now() + 1000000),
      revokedAt: new Date(Date.now() - 5000),
      replacedBy: 'rec-2',
    });

    // Active sibling in the same family
    mockRefreshTokens.push({
      id: 'rec-2',
      userId: testUser.id,
      familyId,
      tokenHash: authService.hashToken('active-token-legitimate'),
      expiresAt: new Date(Date.now() + 1000000),
      revokedAt: null,
      replacedBy: null,
    });

    let error: any;
    try {
      await authService.rotateRefreshToken(stolenToken);
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(UnauthorizedException);
    const response = error.getResponse();
    expect(response.code).toBe(AppErrorCode.REFRESH_TOKEN_REUSE);

    const familyTokens = mockRefreshTokens.filter((t) => t.familyId === familyId);
    expect(familyTokens.length).toBe(2);
    for (const t of familyTokens) {
      expect(t.revokedAt).not.toBeNull();
    }
  });

  it('rejects expired refresh tokens', async () => {
    const testUser = {
      id: 'user-1',
      email: 'student@sage.local',
      role: 'student',
      locale: 'en',
      createdAt: new Date(),
      emailVerifiedAt: null,
    };
    mockUsers.push(testUser);

    const expiredToken = 'token-expired';
    const expiredHash = authService.hashToken(expiredToken);

    mockRefreshTokens.push({
      id: 'rec-exp',
      userId: testUser.id,
      familyId: 'family-exp',
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 10000), // In the past
      revokedAt: null,
      replacedBy: null,
    });

    let error: any;
    try {
      await authService.rotateRefreshToken(expiredToken);
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(UnauthorizedException);
    const response = error.getResponse();
    expect(response.code).toBe(AppErrorCode.TOKEN_EXPIRED);
  });
});
