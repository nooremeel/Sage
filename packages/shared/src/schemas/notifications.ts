import { z } from 'zod';

export const NOTIFICATION_TYPES = [
  'qa_reply',
  'course_published',
  'quiz_graded',
  'announcement',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  payload: z.record(z.any()),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export type NotificationDto = z.infer<typeof notificationDtoSchema>;

