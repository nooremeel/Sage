import { z } from 'zod';
import { LESSON_TYPES, LOCALES, type CourseStatus, type LessonType, type Locale } from '../constants.js';

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

// Multi-language title schema for sections & lessons (JSONB: { ar?: string, en?: string })
export const LocalizedTitleSchema = z
  .object({
    ar: z.string().trim().min(1).optional(),
    en: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.ar || data.en), {
    message: 'At least one title in Arabic or English is required',
  });

export type LocalizedTitle = z.infer<typeof LocalizedTitleSchema>;

// Course Translations
export const CourseTranslationInputSchema = z.object({
  locale: z.enum(LOCALES),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  subtitle: z.string().trim().max(300).optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export type CourseTranslationInput = z.infer<typeof CourseTranslationInputSchema>;

// Course Creation & Update
export const CreateCourseSchema = z.object({
  categoryId: z.string().uuid(),
  level: z.enum(COURSE_LEVELS).default('beginner'),
  priceCents: z.number().int().min(0).default(0),
  currency: z.string().default('USD'),
  primaryLocale: z.enum(LOCALES).default('en'),
  translations: z.array(CourseTranslationInputSchema).min(1, 'At least one translation is required'),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export const UpdateCourseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  level: z.enum(COURSE_LEVELS).optional(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().optional(),
  primaryLocale: z.enum(LOCALES).optional(),
  translations: z.array(CourseTranslationInputSchema).optional(),
});

export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

// Course Review & Publish
export const ReviewCourseSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().trim().optional(),
});

export type ReviewCourseInput = z.infer<typeof ReviewCourseSchema>;

// Sections
export const CreateSectionSchema = z.object({
  title: LocalizedTitleSchema,
});

export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.object({
  title: LocalizedTitleSchema.optional(),
});

export type UpdateSectionInput = z.infer<typeof UpdateSectionSchema>;

export const ReorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1),
});

export type ReorderSectionsInput = z.infer<typeof ReorderSectionsSchema>;

// Lessons
export const CreateLessonSchema = z.object({
  title: LocalizedTitleSchema,
  type: z.enum(LESSON_TYPES).default('video'),
  isFreePreview: z.boolean().default(false),
  body: z.record(z.string()).optional(), // markdown per locale { ar?: string, en?: string }
  durationSec: z.number().int().min(0).default(0),
});

export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;

export const UpdateLessonSchema = z.object({
  title: LocalizedTitleSchema.optional(),
  type: z.enum(LESSON_TYPES).optional(),
  isFreePreview: z.boolean().optional(),
  body: z.record(z.string()).optional(),
  durationSec: z.number().int().min(0).optional(),
});

export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;

export const ReorderLessonsSchema = z.object({
  lessonIds: z.array(z.string().uuid()).min(1),
});

export type ReorderLessonsInput = z.infer<typeof ReorderLessonsSchema>;

// Instructor Application
export const ApplyInstructorSchema = z.object({
  bio: z.string().trim().min(20, 'Bio must be at least 20 characters').max(2000),
});

export type ApplyInstructorInput = z.infer<typeof ApplyInstructorSchema>;

// DTO Interfaces
export interface LessonDto {
  id: string;
  sectionId: string;
  position: number;
  type: LessonType;
  title: LocalizedTitle;
  isFreePreview: boolean;
  durationSec: number;
  body?: Record<string, string> | null;
  createdAt: string;
}

export interface SectionDto {
  id: string;
  courseId: string;
  position: number;
  title: LocalizedTitle;
  lessons?: LessonDto[];
  createdAt: string;
}

export interface CourseTranslationDto {
  locale: Locale;
  title: string;
  subtitle?: string | null;
  description: string;
  slug: string;
}

export interface CourseDto {
  id: string;
  instructorId: string;
  instructorName?: string;
  categoryId: string;
  categoryName?: string;
  status: CourseStatus;
  level: CourseLevel;
  priceCents: number;
  currency: string;
  primaryLocale: Locale;
  ratingAvg: number;
  ratingCount: number;
  publishedAt?: string | null;
  createdAt: string;
  translations: CourseTranslationDto[];
  sections?: SectionDto[];
}

export const searchCoursesSchema = z.object({
  q: z.string().trim().max(100).optional(),
  categorySlug: z.string().trim().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  price: z.enum(['free', 'paid']).optional(),
  locale: z.enum(LOCALES as unknown as [string, ...string[]]).optional().default('en'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type SearchCoursesInput = z.infer<typeof searchCoursesSchema>;

export interface KeysetPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

