import {
  pgTable,
  timestamp,
  uuid,
  integer,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { courses } from './courses.js';
import { coupons } from './enrollments.js';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    couponId: uuid('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('orders_user_id_idx').on(table.userId),
    courseIdIdx: index('orders_course_id_idx').on(table.courseId),
    statusIdx: index('orders_status_idx').on(table.status),
  }),
);
