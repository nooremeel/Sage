import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { COUPON_TYPES, ENROLLMENT_SOURCES } from '@sage/shared';
import { users } from './users.js';
import { courses } from './courses.js';

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    discountType: text('discount_type', { enum: COUPON_TYPES })
      .default('percentage')
      .notNull(),
    discountValue: integer('discount_value').notNull(),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
    maxRedemptions: integer('max_redemptions').notNull(),
    timesRedeemed: integer('times_redeemed').default(0).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index('coupons_code_idx').on(table.code),
  }),
);

export const couponRedemptions = pgTable(
  'coupon_redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    couponUserIdx: index('coupon_redemptions_coupon_user_idx').on(
      table.couponId,
      table.userId,
    ),
  }),
);

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    source: text('source', { enum: ENROLLMENT_SOURCES }).default('free').notNull(),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCourseUnique: unique('enrollments_user_id_course_id_unique').on(
      table.userId,
      table.courseId,
    ),
    userIdIdx: index('enrollments_user_id_idx').on(table.userId),
    courseIdIdx: index('enrollments_course_id_idx').on(table.courseId),
  }),
);

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type NewCouponRedemption = typeof couponRedemptions.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

