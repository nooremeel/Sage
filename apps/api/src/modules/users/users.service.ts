import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, count } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import { users } from '../../db/schema/index.js';
import {
  type AuthUserDto,
  type UpdateProfileInput,
  type UserRole,
  type Locale,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  mapUserToDto(user: typeof users.$inferSelect): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      locale: user.locale as Locale,
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async findById(id: string): Promise<AuthUserDto> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        code: AppErrorCode.NOT_FOUND,
      });
    }

    return this.mapUserToDto(user);
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<AuthUserDto> {
    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.locale) {
      updateData.locale = input.locale;
    }

    const [updated] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException({
        message: 'User not found',
        code: AppErrorCode.NOT_FOUND,
      });
    }

    return this.mapUserToDto(updated);
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<{ items: AuthUserDto[]; total: number }> {
    const [totalRecord] = await this.db.select({ count: count() }).from(users);
    const records = await this.db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset);

    return {
      items: records.map((u) => this.mapUserToDto(u)),
      total: totalRecord?.count ? Number(totalRecord.count) : 0,
    };
  }

  async updateRole(id: string, role: UserRole): Promise<AuthUserDto> {
    const [updated] = await this.db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException({
        message: 'User not found',
        code: AppErrorCode.NOT_FOUND,
      });
    }

    return this.mapUserToDto(updated);
  }
}
