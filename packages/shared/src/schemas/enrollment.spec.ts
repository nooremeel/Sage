import { describe, it, expect } from 'vitest';
import {
  freeEnrollmentSchema,
  couponEnrollmentSchema,
  createCouponSchema,
  enrollmentDtoSchema,
  couponDtoSchema,
} from './enrollment.js';

describe('Enrollment Schemas', () => {
  describe('freeEnrollmentSchema', () => {
    it('accepts valid course uuid', () => {
      const parsed = freeEnrollmentSchema.parse({
        courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      });
      expect(parsed.courseId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    });

    it('rejects malformed course uuid', () => {
      expect(() => freeEnrollmentSchema.parse({ courseId: '12345' })).toThrow(
        /Invalid course ID format/,
      );
    });
  });

  describe('couponEnrollmentSchema', () => {
    it('normalizes coupon code to uppercase and trimmed', () => {
      const parsed = couponEnrollmentSchema.parse({
        courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        code: '  sage100  ',
      });
      expect(parsed.code).toBe('SAGE100');
    });

    it('rejects empty coupon code', () => {
      expect(() =>
        couponEnrollmentSchema.parse({
          courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          code: '',
        }),
      ).toThrow();
    });
  });

  describe('createCouponSchema', () => {
    it('validates and applies defaults for percentage coupon', () => {
      const parsed = createCouponSchema.parse({
        code: 'autumn50',
        discountValue: 50,
        maxRedemptions: 100,
      });

      expect(parsed.code).toBe('AUTUMN50');
      expect(parsed.discountType).toBe('percentage');
      expect(parsed.discountValue).toBe(50);
      expect(parsed.maxRedemptions).toBe(100);
    });

    it('rejects non-positive discount values or non-positive redemptions', () => {
      expect(() =>
        createCouponSchema.parse({
          code: 'ZERO',
          discountValue: 0,
          maxRedemptions: 10,
        }),
      ).toThrow();

      expect(() =>
        createCouponSchema.parse({
          code: 'INVALID',
          discountValue: 20,
          maxRedemptions: 0,
        }),
      ).toThrow();
    });
  });

  describe('DTO schemas', () => {
    it('validates canonical enrollment and coupon DTOs', () => {
      const enrollment = enrollmentDtoSchema.parse({
        id: '11111111-1111-1111-1111-111111111111',
        userId: '22222222-2222-2222-2222-222222222222',
        courseId: '33333333-3333-3333-3333-333333333333',
        source: 'free',
        enrolledAt: '2026-11-01T00:00:00Z',
      });
      expect(enrollment.source).toBe('free');

      const coupon = couponDtoSchema.parse({
        id: '44444444-4444-4444-4444-444444444444',
        code: 'SAGE50',
        discountType: 'percentage',
        discountValue: 50,
        courseId: null,
        maxRedemptions: 500,
        timesRedeemed: 42,
        expiresAt: null,
        createdAt: '2026-11-01T00:00:00Z',
      });
      expect(coupon.timesRedeemed).toBe(42);
    });
  });
});

