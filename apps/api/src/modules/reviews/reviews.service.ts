import {
  Injectable,
  Inject,
  Optional,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import { reviews, enrollments, courses, users } from '../../db/schema/index.js';
import { CacheService } from '../../common/cache/cache.service.js';
import {
  type CreateReviewInput,
  type ReviewDto,
  type CourseReviewsResponseDto,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    @Optional() private readonly cacheService?: CacheService,
  ) {}

  async createOrUpdateReview(
    userId: string,
    courseId: string,
    input: CreateReviewInput,
  ): Promise<ReviewDto> {
    // 1. Verify enrollment
    const [enrollment] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

    if (!enrollment) {
      const err = new ForbiddenException('Only enrolled students can review this course');
      (err as any).code = AppErrorCode.NOT_ENROLLED;
      throw err;
    }

    // 2. Transaction for upsert + course rating aggregation
    const savedReview = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(reviews)
        .where(and(eq(reviews.userId, userId), eq(reviews.courseId, courseId)));

      let rev: typeof reviews.$inferSelect;

      if (existing) {
        const [updated] = await tx
          .update(reviews)
          .set({
            rating: input.rating,
            comment: input.comment ?? null,
            updatedAt: new Date(),
          })
          .where(eq(reviews.id, existing.id))
          .returning();
        rev = updated!;
      } else {
        const [inserted] = await tx
          .insert(reviews)
          .values({
            userId,
            courseId,
            rating: input.rating,
            comment: input.comment ?? null,
          })
          .returning();
        rev = inserted!;
      }

      // Aggregate course rating
      const [stats] = await tx
        .select({
          count: sql<number>`count(*)::int`,
          avg: sql<string>`coalesce(round(avg(${reviews.rating})::numeric, 2), 5.0)::text`,
        })
        .from(reviews)
        .where(eq(reviews.courseId, courseId));

      const ratingCount = stats?.count ?? 1;
      const ratingAvg = stats?.avg ?? '5.0';

      // Update course rating fields
      await tx
        .update(courses)
        .set({
          ratingCount,
          ratingAvg,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, courseId));

      return rev;
    });

    // 3. Invalidate cache tags
    try {
      await this.cacheService?.invalidateTag(`course:${courseId}`);
      await this.cacheService?.invalidateTag('catalog');
    } catch {
      // ignore
    }

    // 4. Return ReviewDto
    const [author] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    return {
      id: savedReview.id,
      userId: savedReview.userId,
      userName: author?.email?.split('@')[0] ?? 'Sage Scholar',
      courseId: savedReview.courseId,
      rating: savedReview.rating,
      comment: savedReview.comment,
      createdAt: savedReview.createdAt ? new Date(savedReview.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  async getCourseReviews(courseId: string): Promise<CourseReviewsResponseDto> {
    const rows = await this.db
      .select({
        review: reviews,
        author: users,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.courseId, courseId))
      .orderBy(desc(reviews.createdAt));

    const reviewDtos: ReviewDto[] = rows.map(({ review, author }) => ({
      id: review.id,
      userId: review.userId,
      userName: author?.email?.split('@')[0] ?? 'Sage Scholar',
      courseId: review.courseId,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date(review.createdAt).toISOString(),
    }));

    const totalCount = reviewDtos.length;
    const averageRating =
      totalCount === 0
        ? 5.0
        : Math.round(
            (reviewDtos.reduce((acc, r) => acc + r.rating, 0) / totalCount) * 10,
          ) / 10;

    return {
      reviews: reviewDtos,
      totalCount,
      averageRating,
    };
  }
}
