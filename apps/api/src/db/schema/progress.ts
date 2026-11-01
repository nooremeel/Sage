import {
  pgTable,
  timestamp,
  uuid,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { lessons } from './curriculum.js';

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    positionSec: integer('position_sec').default(0).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.lessonId] }),
    userIdIdx: index('lesson_progress_user_id_idx').on(table.userId),
    lessonIdIdx: index('lesson_progress_lesson_id_idx').on(table.lessonId),
  }),
);

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
