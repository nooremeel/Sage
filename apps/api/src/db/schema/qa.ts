import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { lessons } from './curriculum.js';

export const qaThreads = pgTable(
  'qa_threads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lessonIdIdx: index('qa_threads_lesson_id_idx').on(table.lessonId),
    authorIdIdx: index('qa_threads_author_id_idx').on(table.authorId),
    createdAtIdx: index('qa_threads_created_at_idx').on(table.createdAt),
  }),
);

export const qaMessages = pgTable(
  'qa_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => qaThreads.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    isInstructorAnswer: boolean('is_instructor_answer').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    threadIdIdx: index('qa_messages_thread_id_idx').on(table.threadId),
    authorIdIdx: index('qa_messages_author_id_idx').on(table.authorId),
    createdAtIdx: index('qa_messages_created_at_idx').on(table.createdAt),
  }),
);

export type QAThread = typeof qaThreads.$inferSelect;
export type NewQAThread = typeof qaThreads.$inferInsert;
export type QAMessage = typeof qaMessages.$inferSelect;
export type NewQAMessage = typeof qaMessages.$inferInsert;
