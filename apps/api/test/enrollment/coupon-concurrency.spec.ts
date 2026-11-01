import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { EnrollmentsService } from '../../src/modules/enrollments/enrollments.service.js';
import { AppErrorCode } from '@sage/shared';

describe('Enrollment & Coupon Concurrency Suite', () => {
  let enrollmentsService: EnrollmentsService;
  let mockDb: any;

  let couponsList: any[] = [];
  let redemptionsList: any[] = [];
  let enrollmentsList: any[] = [];
  let coursesList: any[] = [];

  // Mutex queue simulating PostgreSQL FOR UPDATE row locking across concurrent transactions
  let lockPromise = Promise.resolve();

  beforeEach(() => {
    couponsList = [
      {
        id: 'coupon-uuid-1',
        code: 'SAGEFIVE',
        discountType: 'percentage',
        discountValue: 100,
        courseId: 'course-uuid-1',
        maxRedemptions: 5,
        timesRedeemed: 0,
        expiresAt: null,
      },
    ];
    redemptionsList = [];
    enrollmentsList = [];
    coursesList = [
      {
        id: 'course-uuid-1',
        priceCents: 5000,
      },
    ];

    mockDb = {
      select: () => ({
        from: (table: any) => ({
          where: (cond: any) => {
            // Check if selecting course
            return {
              for: (mode: string) => couponsList,
              then: (fn: any) => fn(coursesList),
              [Symbol.iterator]: function* () {
                yield* coursesList;
              },
            };
          },
        }),
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => {
        // Emulate PostgreSQL SELECT ... FOR UPDATE serialized transaction queuing
        const executeWithLock = async () => {
          const tx = {
            select: () => ({
              from: () => ({
                where: () => ({
                  for: () => [couponsList[0]],
                  then: (fn: any) => fn([]),
                  [Symbol.iterator]: function* () {
                    // Check if checking existing redemption
                    yield* [];
                  },
                }),
              }),
            }),
            update: () => ({
              set: (vals: any) => ({
                where: () => {
                  couponsList[0].timesRedeemed += 1;
                },
              }),
            }),
            insert: (table: any) => ({
              values: (vals: any) => {
                if (vals.couponId) {
                  redemptionsList.push(vals);
                  return Promise.resolve();
                }
                const record = { id: `enrollment-${enrollmentsList.length + 1}`, ...vals };
                enrollmentsList.push(record);
                return {
                  returning: () => [record],
                };
              },
            }),
          };
          return cb(tx);
        };

        const currentLock = lockPromise.then(executeWithLock, executeWithLock);
        lockPromise = currentLock;
        return currentLock;
      },
    };

    enrollmentsService = new EnrollmentsService(mockDb);
  });

  it('guarantees that 20 parallel redemptions against max_redemptions = 5 results in exactly 5 successes and 15 COUPON_EXHAUSTED errors', async () => {
    const concurrentUsers = Array.from({ length: 20 }, (_, i) => `user-uuid-${i + 1}`);

    const results = await Promise.allSettled(
      concurrentUsers.map((userId) =>
        enrollmentsService.enrollWithCoupon(userId, 'course-uuid-1', 'SAGEFIVE'),
      ),
    );

    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(successful).toHaveLength(5);
    expect(failed).toHaveLength(15);

    // Verify all 15 failures received ConflictException with COUPON_EXHAUSTED
    for (const failure of failed) {
      if (failure.status === 'rejected') {
        const error = failure.reason;
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.code).toBe(AppErrorCode.COUPON_EXHAUSTED);
      }
    }

    // Verify coupon ended with exactly 5 timesRedeemed
    expect(couponsList[0].timesRedeemed).toBe(5);

    // Verify DB records
    expect(redemptionsList).toHaveLength(5);
    expect(enrollmentsList).toHaveLength(5);
  });
});
