import { z } from 'zod';
import { COUPON_TYPES, ENROLLMENT_SOURCES } from '../constants.js';

export const freeEnrollmentSchema = z.object({
  courseId: z.string().uuid({ message: 'Invalid course ID format' }),
});

export type FreeEnrollmentInput = z.infer<typeof freeEnrollmentSchema>;

export const couponEnrollmentSchema = z.object({
  courseId: z.string().uuid({ message: 'Invalid course ID format' }),
  code: z
    .string()
    .min(1, { message: 'Coupon code is required' })
    .max(50)
    .transform((val) => val.trim().toUpperCase()),
});

export type CouponEnrollmentInput = z.infer<typeof couponEnrollmentSchema>;

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(2, { message: 'Code must be at least 2 characters' })
    .max(50)
    .transform((val) => val.trim().toUpperCase()),
  discountType: z.enum(COUPON_TYPES).default('percentage'),
  discountValue: z.number().int().min(1, { message: 'Discount value must be at least 1' }),
  courseId: z.string().uuid({ message: 'Invalid course ID' }).optional().nullable(),
  maxRedemptions: z.number().int().min(1, { message: 'Max redemptions must be at least 1' }),
  expiresAt: z.string().datetime({ message: 'Invalid expiration date' }).optional().nullable(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

export const enrollmentDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  source: z.enum(ENROLLMENT_SOURCES),
  enrolledAt: z.string(),
});

export type EnrollmentDto = z.infer<typeof enrollmentDtoSchema>;

export const couponDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  discountType: z.enum(COUPON_TYPES),
  discountValue: z.number(),
  courseId: z.string().uuid().nullable(),
  maxRedemptions: z.number(),
  timesRedeemed: z.number(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

export type CouponDto = z.infer<typeof couponDtoSchema>;

