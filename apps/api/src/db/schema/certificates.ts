import {
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { courses } from './courses.js';

export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serial: text('serial').notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    pdfKey: text('pdf_key'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCourseUnique: unique('certificates_user_course_unique').on(
      table.userId,
      table.courseId,
    ),
    serialIdx: index('certificates_serial_idx').on(table.serial),
    userIdIdx: index('certificates_user_id_idx').on(table.userId),
  }),
);

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;

