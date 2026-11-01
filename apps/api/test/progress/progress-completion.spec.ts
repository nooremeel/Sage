import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProgressService } from '../../src/modules/progress/progress.service.js';
import { enrollments, lessonProgress } from '../../src/db/schema/index.js';
import { AppErrorCode } from '@sage/shared';

describe('Progress Tracking & Completion Rules Suite', () => {
  let progressService: ProgressService;
  let mockDb: any;

  let enrollmentsList: any[] = [];
  let progressList: any[] = [];
  const courseId = 'course-uuid-1';
  const sectionId = 'section-uuid-1';
  const lesson1Id = 'lesson-uuid-1';
  const lesson2Id = 'lesson-uuid-2';
  const studentId = 'student-uuid-1';

  beforeEach(() => {
    enrollmentsList = [
      {
        id: 'enrollment-1',
        userId: studentId,
        courseId,
      },
    ];

    progressList = [];

    mockDb = {
      select: () => ({
        from: (table1: any) => ({
          innerJoin: () => ({
            innerJoin: () => ({
              where: () => [
                {
                  lesson: {
                    id: lesson1Id,
                    sectionId,
                    type: 'video',
                    durationSec: 100, // 100 seconds
                  },
                  section: { id: sectionId, courseId, position: 0 },
                  course: { id: courseId, instructorId: 'inst-1' },
                },
              ],
            }),
          }),
          where: (cond: any) => {
            const isEnrollment = table1 === enrollments;
            const res = isEnrollment ? enrollmentsList : progressList;
            return {
              where: () => [],
              then: (fn: any) => fn(res),
              [Symbol.iterator]: function* () {
                yield* res;
              },
            };
          },
        }),
      }),
      insert: (table: any) => ({
        values: (vals: any) => {
          const record = { ...vals, updatedAt: new Date(), createdAt: new Date() };
          progressList.push(record);
          return {
            returning: () => [record],
          };
        },
      }),
      update: (table: any) => ({
        set: (vals: any) => ({
          where: () => {
            const found = progressList.find((p) => p.lessonId === lesson1Id);
            if (found) {
              Object.assign(found, vals);
            }
            return {
              returning: () => [found],
            };
          },
        }),
      }),
    };

    progressService = new ProgressService(mockDb);
  });

  it('rejects progress heartbeat if student is not enrolled', async () => {
    enrollmentsList = []; // Student not enrolled

    await expect(
      progressService.recordHeartbeat('unenrolled-student', {
        lessonId: lesson1Id,
        positionSec: 15,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('auto-completes lesson when watch position reaches 90% of duration', async () => {
    // Duration is 100s, position 90s is 90%
    // Mock getCourseProgress to return summary
    progressService.getCourseProgress = async () => ({
      courseId,
      totalLessons: 2,
      completedLessons: 1,
      percent: 50,
      completedLessonIds: [lesson1Id],
      lastAccessedLessonId: lesson1Id,
    });

    const res = await progressService.recordHeartbeat(studentId, {
      lessonId: lesson1Id,
      positionSec: 90,
      durationSec: 100,
    });

    expect(res.progress.completedAt).not.toBeNull();
    expect(res.courseProgress.percent).toBe(50);
  });

  it('does not complete lesson if watch position is under 90%', async () => {
    progressService.getCourseProgress = async () => ({
      courseId,
      totalLessons: 2,
      completedLessons: 0,
      percent: 0,
      completedLessonIds: [],
      lastAccessedLessonId: lesson1Id,
    });

    const res = await progressService.recordHeartbeat(studentId, {
      lessonId: lesson1Id,
      positionSec: 50, // 50%
      durationSec: 100,
    });

    expect(res.progress.completedAt).toBeNull();
    expect(res.courseProgress.percent).toBe(0);
  });
});
