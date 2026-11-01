import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { QUESTION_TYPES } from '@sage/shared';
import { users } from './users.js';
import { lessons } from './curriculum.js';

export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' })
      .unique(),
    title: jsonb('title').$type<{ ar?: string; en?: string }>().notNull(),
    passingScore: integer('passing_score').default(80).notNull(),
    maxAttempts: integer('max_attempts'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lessonIdIdx: index('quizzes_lesson_id_idx').on(table.lessonId),
  }),
);

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    prompt: jsonb('prompt').$type<{ ar?: string; en?: string }>().notNull(),
    type: text('type', { enum: QUESTION_TYPES }).default('single_choice').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    quizIdPosIdx: index('questions_quiz_id_pos_idx').on(table.quizId, table.position),
  }),
);

export const options = pgTable(
  'options',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    text: jsonb('text').$type<{ ar?: string; en?: string }>().notNull(),
    isCorrect: boolean('is_correct').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    questionIdPosIdx: index('options_question_id_pos_idx').on(
      table.questionId,
      table.position,
    ),
  }),
);

export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    answers: jsonb('answers').$type<Record<string, string[]>>().notNull(),
    score: integer('score').notNull(),
    passed: boolean('passed').notNull(),
    attemptNumber: integer('attempt_number').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userQuizIdx: index('quiz_attempts_user_quiz_idx').on(table.userId, table.quizId),
  }),
);

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Option = typeof options.$inferSelect;
export type NewOption = typeof options.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;
