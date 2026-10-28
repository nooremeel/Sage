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
import { LESSON_TYPES } from '@sage/shared';
import { courses } from './courses.js';

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: jsonb('title').$type<{ ar?: string; en?: string }>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    courseIdPosIdx: index('sections_course_id_pos_idx').on(table.courseId, table.position),
  }),
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type', { enum: LESSON_TYPES }).default('video').notNull(),
    title: jsonb('title').$type<{ ar?: string; en?: string }>().notNull(),
    isFreePreview: boolean('is_free_preview').default(false).notNull(),
    mediaAssetId: uuid('media_asset_id'),
    body: jsonb('body').$type<Record<string, string>>(), // markdown content
    durationSec: integer('duration_sec').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sectionIdPosIdx: index('lessons_section_id_pos_idx').on(table.sectionId, table.position),
  }),
);

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

