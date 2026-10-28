import { describe, it, expect, beforeEach } from 'vitest';
import { CoursesService } from '../../src/modules/courses/courses.service.js';
import { CurriculumService } from '../../src/modules/curriculum/curriculum.service.js';
import { AdminService } from '../../src/modules/admin/admin.service.js';
import { ForbiddenException } from '@nestjs/common';
import type { CreateCourseInput } from '@sage/shared';

describe('Authorization Matrix v1: Tenant Ownership, IDOR & Publishing Lifecycle', () => {
  let coursesService: CoursesService;
  let curriculumService: CurriculumService;
  let adminService: AdminService;

  let usersList: any[];
  let categoriesList: any[];
  let coursesList: any[];
  let courseTranslationsList: any[];
  let sectionsList: any[];
  let lessonsList: any[];
  let applicationsList: any[];

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

  beforeEach(() => {
    usersList = [
      { id: 'inst-a', email: 'instructor.a@sage.local', role: 'instructor' },
      { id: 'inst-b', email: 'instructor.b@sage.local', role: 'instructor' },
      { id: 'student-1', email: 'student@sage.local', role: 'student' },
      { id: 'admin-1', email: 'admin@sage.local', role: 'admin' },
    ];

    categoriesList = [{ id: 'cat-1', slug: 'software-engineering', icon: 'code' }];
    coursesList = [];
    courseTranslationsList = [];
    sectionsList = [];
    lessonsList = [];
    applicationsList = [];

    const mockDb: any = {
      query: {
        users: {
          findFirst: async (options: any) => {
            const id = extractValue(options?.where);
            return usersList.find((u) => u.id === id) || usersList[0] || null;
          },
        },
        categories: {
          findFirst: async () => categoriesList[0] || null,
        },
        courses: {
          findFirst: async (options: any) => {
            const id = extractValue(options?.where);
            if (id) {
              return coursesList.find((c) => c.id === id && !c.deletedAt) || null;
            }
            return coursesList.find((c) => !c.deletedAt) || null;
          },
        },
        courseTranslations: {
          findFirst: async () => null,
        },
        sections: {
          findFirst: async (options: any) => {
            const id = extractValue(options?.where);
            if (id) return sectionsList.find((s) => s.id === id) || null;
            return sectionsList[0] || null;
          },
        },
        lessons: {
          findFirst: async (options: any) => {
            const id = extractValue(options?.where);
            if (id) return lessonsList.find((l) => l.id === id) || null;
            return lessonsList[0] || null;
          },
        },
        instructorApplications: {
          findFirst: async (options: any) => {
            const id = extractValue(options?.where);
            if (id) return applicationsList.find((a) => a.id === id || a.userId === id) || null;
            return applicationsList[0] || null;
          },
        },
      },
      select: () => ({
        from: () => {
          const makeChain = (arr: any[]) =>
            Object.assign(Promise.resolve(arr), {
              where: () => makeChain(arr),
              orderBy: () => makeChain(arr),
              limit: () => ({
                offset: () => Promise.resolve(arr),
              }),
            });

          return {
            where: () => makeChain(coursesList),
            orderBy: () => makeChain(coursesList),
            limit: () => ({
              offset: () => Promise.resolve(coursesList),
            }),
            then: (resolve: any) => resolve(coursesList),
          };
        },
      }),
      insert: () => ({
        values: (data: any) => {
          const rec = { id: `id-${Math.random()}`, createdAt: new Date(), updatedAt: new Date(), ...data };
          if (data.instructorId) coursesList.push(rec);
          else if (data.courseId && data.slug) courseTranslationsList.push(rec);
          else if (data.courseId && data.title) sectionsList.push(rec);
          else if (data.sectionId) lessonsList.push(rec);
          else if (data.bio) applicationsList.push(rec);
          return {
            returning: async () => [rec],
          };
        },
      }),
      update: () => ({
        set: (updateValues: any) => ({
          where: (clause: any) => {
            const targetId = extractValue(clause);
            for (const c of coursesList) {
              if (c.id === targetId || !targetId) Object.assign(c, updateValues);
            }
            for (const a of applicationsList) {
              if (a.id === targetId || !targetId) Object.assign(a, updateValues);
            }
            for (const u of usersList) {
              if (u.id === targetId) Object.assign(u, updateValues);
            }
            return Promise.resolve();
          },
        }),
      }),
      delete: () => ({
        where: () => Promise.resolve(),
      }),
      transaction: async (cb: any) => cb(mockDb),
    };

    coursesService = new CoursesService(mockDb);
    curriculumService = new CurriculumService(mockDb);
    adminService = new AdminService(mockDb);
  });

  it('Scenario 1: Instructor A builds a bilingual course draft with sections and lessons', async () => {
    const draftInput: CreateCourseInput = {
      categoryId: 'cat-1',
      level: 'beginner',
      priceCents: 2900,
      currency: 'USD',
      primaryLocale: 'ar',
      translations: [
        {
          locale: 'ar',
          title: 'أساسيات بايثون',
          subtitle: 'مدخل عملي للمبتدئين',
          description: 'دورة شاملة لتعلم مبادئ البرمجة ببايثون من الصفر.',
          slug: 'python-basics-ar',
        },
        {
          locale: 'en',
          title: 'Python Fundamentals',
          subtitle: 'A practical gentle introduction',
          description: 'Comprehensive course covering core programming concepts in Python.',
          slug: 'python-basics',
        },
      ],
    };

    const created = await coursesService.createCourse('inst-a', draftInput);
    expect(created.status).toBe('draft');
    expect(created.instructorId).toBe('inst-a');
    expect(coursesList).toHaveLength(1);

    const section = await curriculumService.addSection(created.id, 'inst-a', {
      title: { ar: 'الوحدة الأولى: البداية', en: 'Module 1: Getting Started' },
    });
    expect(section.position).toBe(0);
    expect(sectionsList).toHaveLength(1);

    const lesson = await curriculumService.addLesson(section.id, 'inst-a', {
      title: { ar: 'تثبيت بايثون', en: 'Installing Python' },
      type: 'video',
      isFreePreview: true,
      durationSec: 360,
    });
    expect(lesson.isFreePreview).toBe(true);
    expect(lessonsList).toHaveLength(1);
  });

  it('Scenario 2: IDOR Prevention — Instructor B cannot view, edit, or modify Instructor A course', async () => {
    const courseA = {
      id: 'course-a',
      instructorId: 'inst-a',
      categoryId: 'cat-1',
      status: 'draft',
      level: 'beginner',
      priceCents: 0,
      currency: 'USD',
      primaryLocale: 'en',
      ratingAvg: '0.00',
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    coursesList.push(courseA);

    await expect(
      coursesService.getStudioCourse('course-a', 'inst-b'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      coursesService.updateCourse('course-a', 'inst-b', { level: 'advanced' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      curriculumService.addSection('course-a', 'inst-b', {
        title: { en: 'Malicious Section' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Scenario 3: Status Lifecycle — Instructor submits for review, Admin approves and publishes', async () => {
    const courseA = {
      id: 'course-lifecycle',
      instructorId: 'inst-a',
      categoryId: 'cat-1',
      status: 'draft',
      level: 'beginner',
      priceCents: 0,
      currency: 'USD',
      primaryLocale: 'en',
      ratingAvg: '0.00',
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    coursesList.push(courseA);
    sectionsList.push({ id: 'sec-1', courseId: 'course-lifecycle', position: 0 });

    const submitted = await coursesService.submitForReview('course-lifecycle', 'inst-a');
    expect(submitted.status).toBe('in_review');

    const queue = await adminService.getReviewQueue();
    expect(queue.length).toBeGreaterThan(0);

    const decision = await adminService.reviewCourse('course-lifecycle', { action: 'approve' });
    expect(decision.status).toBe('published');
    expect(courseA.status).toBe('published');
  });

  it('Scenario 4: Instructor Application Lifecycle — Student applies and Admin approves promotion', async () => {
    const application = await adminService.applyToBecomeInstructor(
      'student-1',
      'I have 10 years of experience teaching computer science and mathematics.',
    );
    expect(application.applicationId).toBeDefined();

    await adminService.reviewInstructorApplication(application.applicationId, 'approve');

    const studentUser = usersList.find((u) => u.id === 'student-1');
    expect(studentUser.role).toBe('instructor');
  });
});
