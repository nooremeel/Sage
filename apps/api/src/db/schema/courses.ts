import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { COURSE_STATUS, LOCALES } from '@sage/shared';
import { users } from './users.js';
import { categories } from './categories.js';

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instructorId: uuid('instructor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    status: text('status', { enum: COURSE_STATUS })
      .default('draft')
      .notNull(),
    level: text('level', { enum: ['beginner', 'intermediate', 'advanced'] })
      .default('beginner')
      .notNull(),
    priceCents: integer('price_cents').default(0).notNull(),
    currency: text('currency').default('USD').notNull(),
    primaryLocale: text('primary_locale', { enum: LOCALES as unknown as [string, ...string[]] })
      .default('en')
      .notNull(),
    ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }).default('0.00').notNull(),
    ratingCount: integer('rating_count').default(0).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    instructorIdIdx: index('courses_instructor_id_idx').on(table.instructorId),
    categoryIdIdx: index('courses_category_id_idx').on(table.categoryId),
    statusIdx: index('courses_status_idx').on(table.status),
  }),
);

export const courseTranslations = pgTable(
  'course_translations',
  {
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    locale: text('locale', { enum: LOCALES as unknown as [string, ...string[]] }).notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    description: text('description').notNull(),
    slug: text('slug').notNull(),
    searchText: text('search_text'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.courseId, table.locale] }),
    localeSlugIdx: uniqueIndex('course_translations_locale_slug_idx').on(table.locale, table.slug),
  }),
);

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseTranslation = typeof courseTranslations.$inferSelect;
export type NewCourseTranslation = typeof courseTranslations.$inferInsert;

