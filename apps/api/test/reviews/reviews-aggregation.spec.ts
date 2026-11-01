import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { ReviewsService } from '../../src/modules/reviews/reviews.service.js';
import { reviews, enrollments, courses, users } from '../../src/db/schema/index.js';

describe('Course Reviews & Rating Aggregation Suite', () => {
  let reviewsService: ReviewsService;
  let mockDb: any;
  let mockCacheService: any;

  const studentId = 'student-uuid-1';
  const courseId = 'course-uuid-1';

  let enrollmentsList: any[] = [];
  let reviewsList: any[] = [];
  let courseRecord: any;

  beforeEach(() => {
    enrollmentsList = [{ id: 'enr-1', userId: studentId, courseId }];
    reviewsList = [];
    courseRecord = {
      id: courseId,
      ratingAvg: '5.0',
      ratingCount: 0,
    };

    mockCacheService = {
      invalidateTag: vi.fn(),
    };

    mockDb = {
      select: () => ({
        from: (table: any) => ({
          where: () => {
            if (table === enrollments) {
              return enrollmentsList;
            }
            if (table === reviews) {
              return reviewsList;
            }
            if (table === users) {
              return [{ id: studentId, email: 'reviewer@example.com' }];
            }
            return [];
          },
          innerJoin: () => ({
            where: () => ({
              orderBy: () => reviewsList.map((r) => ({ review: r, author: { email: 'reviewer@example.com' } })),
            }),
          }),
        }),
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          select: () => ({
            from: () => ({
              where: () => {
                // Return stats
                const count = reviewsList.length + 1;
                const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0) + 5;
                const avg = (sum / count).toFixed(2);
                return [{ count, avg }];
              },
            }),
          }),
          update: (table: any) => ({
            set: (vals: any) => ({
              where: () => {
                if (table === courses) {
                  Object.assign(courseRecord, vals);
                }
                return {
                  returning: () => [{ id: 'updated', ...vals }],
                };
              },
            }),
          }),
          insert: (table: any) => ({
            values: (vals: any) => {
              const rec = {
                id: `rev-${reviewsList.length + 1}`,
                createdAt: new Date(),
                ...vals,
              };
              reviewsList.push(rec);
              return {
                returning: () => [rec],
              };
            },
          }),
        };
        return cb(tx);
      },
    };

    reviewsService = new ReviewsService(mockDb, mockCacheService);
  });

  it('rejects review if student is not enrolled in the course', async () => {
    enrollmentsList = [];

    await expect(
      reviewsService.createOrUpdateReview('unenrolled-user', courseId, {
        rating: 5,
        comment: 'Great course',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('saves review, aggregates course rating, and invalidates cache tags', async () => {
    const rev = await reviewsService.createOrUpdateReview(studentId, courseId, {
      rating: 5,
      comment: 'Superb pedagogical depth',
    });

    expect(rev).toBeDefined();
    expect(rev.rating).toBe(5);
    expect(rev.userName).toBe('reviewer');

    // Verify course record aggregation updated
    expect(courseRecord.ratingCount).toBe(1);
    expect(courseRecord.ratingAvg).toBe('5.00');

    // Verify cache invalidation
    expect(mockCacheService.invalidateTag).toHaveBeenCalledWith(`course:${courseId}`);
    expect(mockCacheService.invalidateTag).toHaveBeenCalledWith('catalog');
  });
});
