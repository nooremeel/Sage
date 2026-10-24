export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const USER_ROLES = ['student', 'instructor', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const COURSE_STATUS = ['draft', 'in_review', 'published', 'archived'] as const;
export type CourseStatus = (typeof COURSE_STATUS)[number];

export const LESSON_TYPES = ['video', 'article', 'quiz', 'attachment'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const MEDIA_STATUS = [
  'pending_upload',
  'uploaded',
  'processing',
  'ready',
  'failed',
] as const;
export type MediaStatus = (typeof MEDIA_STATUS)[number];
