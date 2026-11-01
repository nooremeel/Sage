import { z } from 'zod';

export const progressHeartbeatSchema = z.object({
  lessonId: z.string().uuid({ message: 'Invalid lesson ID' }),
  positionSec: z.number().int().min(0, { message: 'Position must be >= 0' }),
  durationSec: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

export type ProgressHeartbeatInput = z.infer<typeof progressHeartbeatSchema>;

export const lessonProgressDtoSchema = z.object({
  userId: z.string().uuid(),
  lessonId: z.string().uuid(),
  positionSec: z.number().int(),
  completedAt: z.string().nullable(),
  updatedAt: z.string(),
});

export type LessonProgressDto = z.infer<typeof lessonProgressDtoSchema>;

export const courseProgressDtoSchema = z.object({
  courseId: z.string().uuid(),
  totalLessons: z.number().int(),
  completedLessons: z.number().int(),
  percent: z.number().int().min(0).max(100),
  completedLessonIds: z.array(z.string().uuid()),
  lastAccessedLessonId: z.string().uuid().nullable(),
});

export type CourseProgressDto = z.infer<typeof courseProgressDtoSchema>;

export const continueLearningItemDtoSchema = z.object({
  courseId: z.string().uuid(),
  courseSlug: z.string(),
  courseTitle: z.record(z.string()),
  percent: z.number().int().min(0).max(100),
  nextLessonId: z.string().uuid().nullable(),
  nextLessonTitle: z.record(z.string()).nullable(),
  lastAccessedAt: z.string(),
});

export type ContinueLearningItemDto = z.infer<typeof continueLearningItemDtoSchema>;
