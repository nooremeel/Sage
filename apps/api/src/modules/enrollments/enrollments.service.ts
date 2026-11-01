import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  enrollments,
  coupons,
  couponRedemptions,
  courses,
  courseTranslations,
} from '../../db/schema/index.js';
import {
  type EnrollmentDto,
  type CouponDto,
  type CreateCouponInput,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class EnrollmentsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async enrollFree(userId: string, courseId: string): Promise<EnrollmentDto> {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.priceCents > 0) {
      throw new BadRequestException('Course is not free, payment or coupon required');
    }

    // Check if user is already enrolled (Idempotent)
    const [existing] = await this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

    if (existing) {
      return this.mapToEnrollmentDto(existing);
    }

    const [newEnrollment] = await this.db
      .insert(enrollments)
      .values({
        userId,
        courseId,
        source: 'free',
      })
      .returning();

    return this.mapToEnrollmentDto(newEnrollment!);
  }

  async enrollWithCoupon(
    userId: string,
    courseId: string,
    rawCode: string,
  ): Promise<EnrollmentDto> {
    const code = rawCode.trim().toUpperCase();

    // Verify course exists
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Run transaction with FOR UPDATE row-level lock on the coupon row
    const result = await this.db.transaction(async (tx) => {
      const [coupon] = await tx
        .select()
        .from(coupons)
        .where(eq(coupons.code, code))
        .for('update');

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        const err = new BadRequestException('Coupon has expired');
        (err as any).code = AppErrorCode.COUPON_EXPIRED;
        throw err;
      }

      if (coupon.timesRedeemed >= coupon.maxRedemptions) {
        const err = new ConflictException('Coupon usage limit reached');
        (err as any).code = AppErrorCode.COUPON_EXHAUSTED;
        throw err;
      }

      if (coupon.courseId && coupon.courseId !== courseId) {
        throw new BadRequestException('Coupon is not applicable to this course');
      }

      // Check if user already redeemed this coupon
      const [existingRedemption] = await tx
        .select()
        .from(couponRedemptions)
        .where(
          and(
            eq(couponRedemptions.couponId, coupon.id),
            eq(couponRedemptions.userId, userId),
          ),
        );

      if (existingRedemption) {
        throw new ConflictException('Coupon has already been used by this user');
      }

      // Check if user is already enrolled
      const [existingEnrollment] = await tx
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

      if (existingEnrollment) {
        return existingEnrollment;
      }

      // Increment redemption count atomically
      await tx
        .update(coupons)
        .set({
          timesRedeemed: sql`${coupons.timesRedeemed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, coupon.id));

      // Record redemption audit
      await tx.insert(couponRedemptions).values({
        couponId: coupon.id,
        userId,
        courseId,
      });

      // Insert enrollment
      const [newEnrollment] = await tx
        .insert(enrollments)
        .values({
          userId,
          courseId,
          source: 'coupon',
        })
        .returning();

      return newEnrollment!;
    });

    return this.mapToEnrollmentDto(result);
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const [enrollment] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return !!enrollment;
  }

  async getUserEnrollments(userId: string) {
    const userEnrollments = await this.db
      .select({
        enrollment: enrollments,
        course: courses,
        translation: courseTranslations,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(courseTranslations, eq(courses.id, courseTranslations.courseId))
      .where(eq(enrollments.userId, userId));

    return userEnrollments.map((row) => ({
      ...this.mapToEnrollmentDto(row.enrollment),
      course: {
        id: row.course.id,
        priceCents: row.course.priceCents,
        primaryLocale: row.course.primaryLocale,
        slug: row.translation?.slug ?? '',
        title: row.translation?.title ?? '',
      },
    }));
  }

  async createCoupon(input: CreateCouponInput): Promise<CouponDto> {
    const [coupon] = await this.db
      .insert(coupons)
      .values({
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        courseId: input.courseId ?? null,
        maxRedemptions: input.maxRedemptions,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      })
      .returning();

    return this.mapToCouponDto(coupon!);
  }

  private mapToEnrollmentDto(row: typeof enrollments.$inferSelect): EnrollmentDto {
    return {
      id: row.id,
      userId: row.userId,
      courseId: row.courseId,
      source: row.source as any,
      enrolledAt: row.enrolledAt ? new Date(row.enrolledAt).toISOString() : new Date().toISOString(),
    };
  }

  private mapToCouponDto(row: typeof coupons.$inferSelect): CouponDto {
    return {
      id: row.id,
      code: row.code,
      discountType: row.discountType as any,
      discountValue: row.discountValue,
      courseId: row.courseId,
      maxRedemptions: row.maxRedemptions,
      timesRedeemed: row.timesRedeemed,
      expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    };
  }
}
