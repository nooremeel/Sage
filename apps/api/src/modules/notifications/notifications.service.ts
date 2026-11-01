import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import { notifications } from '../../db/schema/index.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import type { NotificationDto } from '@sage/shared';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createNotification(
    userId: string,
    type: string,
    payload: Record<string, any>,
  ): Promise<NotificationDto> {
    const [row] = await this.db
      .insert(notifications)
      .values({
        userId,
        type,
        payload,
      })
      .returning();

    const dto = this.mapToDto(row!);

    // Real-time broadcast to user's SSE channel
    this.realtimeService.publishToUser(userId, 'new_notification', dto);

    return dto;
  }

  async getUserNotifications(userId: string, limit = 20): Promise<NotificationDto[]> {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return rows.map((r) => this.mapToDto(r));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return result?.count ?? 0;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const [updated] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException('Notification not found');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      );
  }

  private mapToDto(row: typeof notifications.$inferSelect): NotificationDto {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      payload: row.payload,
      readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
      createdAt: row.createdAt
        ? new Date(row.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }
}

