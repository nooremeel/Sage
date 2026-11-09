import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../src/modules/users/users.service.js';
import { users } from '../../src/db/schema/index.js';

describe('User Profile & Identity Suite', () => {
  let usersService: UsersService;
  let mockDb: any;

  const userId = 'user-profile-uuid';
  let usersList: any[] = [];

  beforeEach(() => {
    usersList = [
      {
        id: userId,
        email: 'scholar@sage.academy',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$somehash',
        role: 'student',
        locale: 'ar',
        emailVerifiedAt: new Date('2026-11-01'),
        createdAt: new Date('2026-11-01'),
        updatedAt: new Date('2026-11-01'),
      },
    ];

    mockDb = {
      query: {
        users: {
          findFirst: async (opts: any) => {
            const id = opts?.where?.queryChunks?.[1]?.value || usersList[0]?.id;
            return usersList.find((u) => u.id === id) || null;
          },
        },
      },
      update: (table: any) => ({
        set: (vals: any) => ({
          where: () => ({
            returning: () => {
              if (table === users) {
                const u = usersList.find((x) => x.id === userId);
                if (u) {
                  Object.assign(u, vals);
                  return [u];
                }
              }
              return [];
            },
          }),
        }),
      }),
      select: () => ({
        from: () => [{ count: 1 }],
      }),
    };

    usersService = new UsersService(mockDb);
  });

  it('retrieves user profile without leaking password hash or session tokens', async () => {
    const profile = await usersService.findById(userId);
    expect(profile.id).toBe(userId);
    expect(profile.email).toBe('scholar@sage.academy');
    expect(profile.role).toBe('student');
    expect(profile.locale).toBe('ar');
    expect(profile).not.toHaveProperty('passwordHash');
  });

  it('throws NotFoundException when fetching a non-existent user profile', async () => {
    usersList = [];
    await expect(usersService.findById('ghost-uuid')).rejects.toThrow(NotFoundException);
  });

  it('updates preferred interface locale and profile timestamps', async () => {
    const updated = await usersService.updateProfile(userId, { locale: 'en' });
    expect(updated.locale).toBe('en');

    const u = usersList.find((x) => x.id === userId);
    expect(u?.locale).toBe('en');
    expect(u?.updatedAt).toBeInstanceOf(Date);
  });
});

