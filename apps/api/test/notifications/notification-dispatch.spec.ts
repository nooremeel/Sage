import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.js';
import { notifications } from '../../src/db/schema/index.js';
import { RealtimeService } from '../../src/modules/realtime/realtime.service.js';

function asQueryResult(data: any[]) {
  const obj: any = [...data];
  obj.orderBy = () => asQueryResult(data);
  obj.limit = (lim: number) => asQueryResult(data.slice(0, lim));
  obj.offset = () => asQueryResult(data);
  return obj;
}

describe('Notification Dispatch & Real-Time Alerting Suite', () => {
  let notificationsService: NotificationsService;
  let mockDb: any;
  let mockRealtimeService: any;

  const userId = 'user-notif-1';
  let notificationsList: any[] = [];

  beforeEach(() => {
    notificationsList = [
      {
        id: 'notif-1',
        userId,
        type: 'qa_reply',
        payload: { threadTitle: 'Question on Diwani script', author: 'Ustadh' },
        readAt: null,
        createdAt: new Date('2026-11-05T12:00:00Z'),
      },
      {
        id: 'notif-2',
        userId,
        type: 'quiz_graded',
        payload: { quizTitle: 'Thuluth Anatomy', score: 100 },
        readAt: new Date('2026-11-04T12:00:00Z'),
        createdAt: new Date('2026-11-04T12:00:00Z'),
      },
    ];

    mockRealtimeService = {
      publishToUser: vi.fn(),
    };

    mockDb = {
      insert: (table: any) => ({
        values: (item: any) => ({
          returning: () => {
            if (table === notifications) {
              const newRow = {
                ...item,
                id: 'notif-new-1',
                readAt: null,
                createdAt: new Date(),
              };
              notificationsList.push(newRow);
              return [newRow];
            }
            return [item];
          },
        }),
      }),
      select: (fields?: any) => ({
        from: (table: any) => ({
          where: () => {
            if (fields?.count) {
              const unread = notificationsList.filter((n) => n.userId === userId && !n.readAt);
              return [{ count: unread.length }];
            }
            if (table === notifications) {
              const sorted = [...notificationsList]
                .filter((n) => n.userId === userId)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
              return asQueryResult(sorted);
            }
            return asQueryResult([]);
          },
        }),
      }),
      update: (table: any) => ({
        set: (vals: any) => ({
          where: () => {
            const list: any[] = [];
            if (table === notifications) {
              const target = notificationsList.find((n) => n.userId === userId && !n.readAt);
              if (target) {
                Object.assign(target, vals);
                list.push(target);
              }
            }
            const res: any = [...list];
            res.returning = () => list;
            res.then = (fn: any) => fn(list);
            return res;
          },
        }),
      }),
    };

    notificationsService = new NotificationsService(
      mockDb,
      mockRealtimeService as unknown as RealtimeService,
    );
  });

  it('creates notification in database and broadcasts real-time SSE event to user channel', async () => {
    const created = await notificationsService.createNotification(userId, 'course_published', {
      courseName: 'Kufic Geometric Mastery',
    });

    expect(created.id).toBe('notif-new-1');
    expect(created.type).toBe('course_published');
    expect(mockRealtimeService.publishToUser).toHaveBeenCalledWith(
      userId,
      'new_notification',
      expect.objectContaining({ id: 'notif-new-1', type: 'course_published' }),
    );
  });

  it('retrieves user notifications ordered by timestamp descending', async () => {
    const list = await notificationsService.getUserNotifications(userId, 10);
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe('notif-1');
  });

  it('accurately calculates unread notifications count', async () => {
    const count = await notificationsService.getUnreadCount(userId);
    expect(count).toBe(1);
  });

  it('marks single notification as read', async () => {
    await notificationsService.markAsRead(userId, 'notif-1');
    const target = notificationsList.find((n) => n.id === 'notif-1');
    expect(target?.readAt).toBeInstanceOf(Date);
  });
});
