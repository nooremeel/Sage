import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const instructorApplications = pgTable(
  'instructor_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bio: text('bio').notNull(),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .default('pending')
      .notNull(),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('instructor_applications_user_id_idx').on(table.userId),
    statusIdx: index('instructor_applications_status_idx').on(table.status),
  }),
);

export type InstructorApplication = typeof instructorApplications.$inferSelect;
export type NewInstructorApplication = typeof instructorApplications.$inferInsert;

