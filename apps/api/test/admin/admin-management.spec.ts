import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from '../../src/modules/admin/admin.service.js';
import { courses, courseTranslations, users } from '../../src/db/schema/index.js';

function asQueryResult(data: any[]) {
  const obj: any = [...data];
  obj.orderBy = () => asQueryResult(data);
  obj.limit = () => asQueryResult(data);
  obj.offset = () => asQueryResult(data);
  return obj;
}

describe('Platform Admin Management & Review Queue Suite', () => {
  let adminService: AdminService;
  let mockDb: any;
  let mockCacheService: any;

  let coursesList: any[] = [];
  let translationsList: any[] = [];
  let usersList: any[] = [];

  const courseId = 'course-rev-1';
  const instructorId = 'inst-uuid-1';

  beforeEach(() => {
    coursesList = [
      {
        id: courseId,
        instructorId,
        categoryId: 'cat-1',
        status: 'in_review',
        level: 'intermediate',
        priceCents: 4900,
        currency: 'USD',
        primaryLocale: 'ar',
        ratingAvg: '4.8',
        ratingCount: 12,
        publishedAt: null,
        createdAt: new Date('2026-11-01'),
        updatedAt: new Date('2026-11-02'),
        deletedAt: null,
      },
    ];

    translationsList = [
      {
        id: 'trans-1',
        courseId,
        locale: 'ar',
        title: 'أسرار خط النسخ',
        subtitle: 'الدورة الشاملة للمبتدئين',
        description: 'شرح مفصل لكتابة الحروف وتراكيبها',
        slug: 'naskh-script-secrets',
      },
      {
        id: 'trans-2',
        courseId,
        locale: 'en',
        title: 'Naskh Script Secrets',
        subtitle: 'Comprehensive beginner masterclass',
        description: 'Detailed anatomy of letterforms and connections',
        slug: 'naskh-script-secrets-en',
      },
    ];

    usersList = [
      {
        id: instructorId,
        email: 'ustadh.ahmad@example.com',
        role: 'instructor',
        status: 'active',
        createdAt: new Date('2026-10-01'),
      },
      {
        id: 'student-uuid-2',
        email: 'tariq@example.com',
        role: 'student',
        status: 'active',
        createdAt: new Date('2026-10-15'),
      },
    ];

    mockCacheService = {
      invalidateTag: vi.fn().mockResolvedValue(undefined),
      getOrSet: vi.fn(),
    };

    mockDb = {
      select: () => ({
        from: (table: any) => ({
          where: () => {
            if (table === courses) {
              return asQueryResult(coursesList.filter((c) => c.status === 'in_review' && !c.deletedAt));
            }
            if (table === courseTranslations) {
              return asQueryResult(translationsList.filter((t) => t.courseId === courseId));
            }
            if (table === users) {
              return asQueryResult(usersList);
            }
            return asQueryResult([]);
          },
          orderBy: () => asQueryResult(coursesList.filter((c) => c.status === 'in_review' && !c.deletedAt)),
        }),
      }),
      query: {
        courses: {
          findFirst: async (opts: any) => {
            const id = opts?.where?.queryChunks?.[1]?.value || coursesList[0]?.id;
            return coursesList.find((c) => c.id === id && !c.deletedAt) || null;
          },
        },
        users: {
          findFirst: async (opts: any) => {
            const id = opts?.where?.queryChunks?.[1]?.value || usersList[0]?.id;
            return usersList.find((u) => u.id === id) || null;
          },
        },
      },
      update: (table: any) => ({
        set: (vals: any) => ({
          where: () => {
            if (table === courses) {
              const c = coursesList.find((x) => x.id === courseId);
              if (c) Object.assign(c, vals);
            }
            return Promise.resolve();
          },
        }),
      }),
    };

    adminService = new AdminService(mockDb, mockCacheService);
  });

  it('retrieves courses in the review queue with instructor information and translations', async () => {
    const queue = await adminService.getReviewQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe(courseId);
    expect(queue[0]?.status).toBe('in_review');
    expect(queue[0]?.instructorName).toBe('ustadh.ahmad');
    expect(queue[0]?.translations).toHaveLength(2);
  });

  it('approves a course: sets status to published, updates publishedAt, and invalidates cache tags', async () => {
    const res = await adminService.reviewCourse(courseId, { action: 'approve' });
    expect(res.status).toBe('published');
    expect(res.message).toContain('approved and published');

    const course = coursesList.find((c) => c.id === courseId);
    expect(course?.status).toBe('published');
    expect(course?.publishedAt).toBeInstanceOf(Date);
    expect(mockCacheService.invalidateTag).toHaveBeenCalledWith(`course:${courseId}`);
    expect(mockCacheService.invalidateTag).toHaveBeenCalledWith('catalog');
  });

  it('rejects a course: returns status to draft and records rejection reason', async () => {
    const res = await adminService.reviewCourse(courseId, {
      action: 'reject',
      reason: 'Audio quality in lesson 3 needs noise reduction',
    });

    expect(res.status).toBe('draft');
    expect(res.message).toContain('Audio quality in lesson 3 needs noise reduction');

    const course = coursesList.find((c) => c.id === courseId);
    expect(course?.status).toBe('draft');
    expect(mockCacheService.invalidateTag).toHaveBeenCalledWith(`course:${courseId}`);
  });

  it('throws NotFoundException when attempting to review a non-existent course', async () => {
    coursesList = [];
    await expect(
      adminService.reviewCourse('non-existent-id', { action: 'approve' }),
    ).rejects.toThrow(NotFoundException);
  });
});
