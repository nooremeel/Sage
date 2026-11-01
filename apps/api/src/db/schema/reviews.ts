import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  unique,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { courses } from './courses.js';

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCourseUnique: unique('reviews_user_course_unique').on(
      table.userId,
      table.courseId,
    ),
    ratingCheck: check('reviews_rating_range', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
    courseIdIdx: index('reviews_course_id_idx').on(table.courseId),
  }),
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

