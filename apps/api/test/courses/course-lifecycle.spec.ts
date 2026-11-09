import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CoursesService } from '../../src/modules/courses/courses.service.js';
import { courses, courseTranslations, categories, sections, lessons } from '../../src/db/schema/index.js';

function asQueryResult(data: any[]) {
  const obj: any = [...data];
  obj.orderBy = () => asQueryResult(data);
  obj.limit = () => asQueryResult(data);
  obj.offset = () => asQueryResult(data);
  return obj;
}

function extractValue(clause: any): any {
  if (!clause) return undefined;
  if (clause.queryChunks) {
    for (const chunk of clause.queryChunks) {
      if (chunk && typeof chunk === 'object' && 'value' in chunk && !Array.isArray(chunk.value)) {
        return chunk.value;
      }
    }
  }
  if (clause.value !== undefined && !Array.isArray(clause.value)) {
    return clause.value;
  }
  return undefined;
}

describe('Course Lifecycle & IDOR Protection Suite', () => {
  let coursesService: CoursesService;
  let mockDb: any;
  let mockCacheService: any;

  const ownerInstructorId = 'inst-owner-uuid';
  const attackerInstructorId = 'inst-attacker-uuid';
  const courseId = 'course-lifecycle-1';
  const categoryId = 'cat-arabic-script';

  let coursesList: any[] = [];
  let translationsList: any[] = [];
  let categoriesList: any[] = [];
  let sectionsList: any[] = [];

  beforeEach(() => {
    coursesList = [
      {
        id: courseId,
        instructorId: ownerInstructorId,
        categoryId,
        status: 'draft',
        level: 'beginner',
        priceCents: 2900,
        currency: 'USD',
        primaryLocale: 'ar',
        ratingAvg: '0',
        ratingCount: 0,
        publishedAt: null,
        createdAt: new Date('2026-11-01'),
        updatedAt: new Date('2026-11-01'),
        deletedAt: null,
      },
    ];

    translationsList = [
      {
        id: 'trans-ar-1',
        courseId,
        locale: 'ar',
        title: 'مدخل إلى الخط العربي',
        subtitle: 'أساسيات القصب والمحبرة',
        description: 'دورة تمهيدية في أدوات الخط العربي التقليدي',
        slug: 'intro-arabic-calligraphy',
      },
      {
        id: 'trans-en-1',
        courseId,
        locale: 'en',
        title: 'Introduction to Arabic Calligraphy',
        subtitle: 'Fundamentals of Reed and Ink',
        description: 'Introductory course in traditional Islamic calligraphy tools',
        slug: 'intro-arabic-calligraphy-en',
      },
    ];

    sectionsList = [
      {
        id: 'sec-1',
        courseId,
        position: 0,
        title: { ar: 'الفصل الأول: الأدوات', en: 'Chapter 1: Tools' },
        createdAt: new Date('2026-11-01'),
        updatedAt: new Date('2026-11-01'),
      },
    ];

    categoriesList = [
      {
        id: categoryId,
        slug: 'arabic-calligraphy',
        icon: 'feather',
      },
    ];

    mockCacheService = {
      invalidateTag: vi.fn().mockResolvedValue(undefined),
      getOrSet: vi.fn((_key, _ttl, fetcher) => fetcher()),
    };

    mockDb = {
      select: () => ({
        from: (table: any) => ({
          where: () => {
            if (table === courses) {
              return asQueryResult(coursesList.filter((c) => !c.deletedAt));
            }
            if (table === courseTranslations) {
              return asQueryResult(translationsList.filter((t) => t.courseId === courseId));
            }
            if (table === sections) {
              return asQueryResult(sectionsList.filter((s) => s.courseId === courseId));
            }
            if (table === lessons) {
              return asQueryResult([]);
            }
            return asQueryResult([]);
          },
          orderBy: () => asQueryResult(coursesList),
          limit: () => ({
            offset: () => asQueryResult(coursesList),
          }),
        }),
      }),
      query: {
        courses: {
          findFirst: async (opts: any) => {
            const id = extractValue(opts?.where);
            if (!id) return coursesList[0] || null;
            return coursesList.find((c) => c.id === id && !c.deletedAt) || null;
          },
        },
        users: {
          findFirst: async () => ({
            id: ownerInstructorId,
            email: 'owner@example.com',
          }),
        },
        categories: {
          findFirst: async (opts: any) => {
            const slug = extractValue(opts?.where);
            return categoriesList.find((cat) => cat.slug === slug) || categoriesList[0] || null;
          },
        },
        courseTranslations: {
          findFirst: async (opts: any) => {
            const slug = extractValue(opts?.where);
            if (!slug) return null;
            return translationsList.find((t) => t.slug === slug) || null;
          },
        },
      },
      insert: (table: any) => ({
        values: (item: any) => {
          let rec = item;
          if (table === courses) {
            rec = {
              ...item,
              id: 'course-new-1',
              ratingAvg: '0',
              ratingCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            coursesList.push(rec);
          } else if (table === courseTranslations) {
            const items = Array.isArray(item) ? item : [item];
            translationsList.push(...items);
            rec = items;
          }
          const list = Array.isArray(rec) ? rec : [rec];
          return {
            returning: () => Promise.resolve(list),
            then: (fn: any) => Promise.resolve(list).then(fn),
          };
        },
      }),
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

    coursesService = new CoursesService(mockDb, mockCacheService);
  });

  it('creates a new course in draft status with multilingual translations and generated slug', async () => {
    const input = {
      categoryId,
      level: 'beginner' as const,
      priceCents: 3500,
      currency: 'USD',
      primaryLocale: 'ar' as const,
      translations: [
        {
          locale: 'ar' as const,
          title: 'أساسيات خط الرقعة',
          subtitle: 'الدورة العملية',
          description: 'تعلم خط الرقعة اليومي خطوة بخطوة',
          slug: 'ruqah-script-basics',
        },
      ],
    };

    const created = await coursesService.createCourse(ownerInstructorId, input);
    expect(created.id).toBe('course-new-1');
    expect(created.status).toBe('draft');
    expect(created.instructorId).toBe(ownerInstructorId);
  });

  it('updates course details when requested by the authentic instructor owner', async () => {
    const updateInput = {
      priceCents: 4500,
      level: 'intermediate' as const,
      translations: [
        {
          locale: 'ar' as const,
          title: 'مدخل متقدم إلى الخط العربي',
          subtitle: 'المستوى الثاني',
          description: 'تطوير المهارات',
        },
      ],
    };

    const updated = await coursesService.updateCourse(courseId, ownerInstructorId, updateInput);
    expect(updated.priceCents).toBe(4500);
    expect(updated.level).toBe('intermediate');
    expect(mockCacheService.invalidateTag).toHaveBeenCalledWith(`course:${courseId}`);
  });

  it('IDOR defense: blocks non-owner instructor from updating another instructor course', async () => {
    await expect(
      coursesService.updateCourse(courseId, attackerInstructorId, { priceCents: 9999 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('submits course for review: transitions status from draft to in_review', async () => {
    const res = await coursesService.submitForReview(courseId, ownerInstructorId);
    expect(res.status).toBe('in_review');
    expect(res.id).toBe(courseId);

    const course = coursesList.find((c) => c.id === courseId);
    expect(course?.status).toBe('in_review');
  });

  it('IDOR defense: blocks non-owner from submitting course for review', async () => {
    await expect(
      coursesService.submitForReview(courseId, attackerInstructorId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when attempting to submit non-existent course', async () => {
    coursesList = [];
    await expect(
      coursesService.submitForReview('non-existent-course-id', ownerInstructorId),
    ).rejects.toThrow(NotFoundException);
  });
});
