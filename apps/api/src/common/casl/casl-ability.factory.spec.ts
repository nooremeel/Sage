import { describe, it, expect, beforeEach } from 'vitest';
import {
  CaslAbilityFactory,
  CourseSubject,
  LessonSubject,
  EnrollmentSubject,
  UserSubject,
  type CurrentUser,
} from './casl-ability.factory.js';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;

  beforeEach(() => {
    factory = new CaslAbilityFactory();
  });

  describe('Student permissions', () => {
    const student: CurrentUser = {
      id: 'student-1',
      email: 'student@example.com',
      role: 'student',
      locale: 'en',
    };

    it('can read published courses', () => {
      const ability = factory.createForUser(student);
      const course = new CourseSubject();
      course.status = 'published';

      expect(ability.can('read', course)).toBe(true);
    });

    it('cannot read draft courses', () => {
      const ability = factory.createForUser(student);
      const course = new CourseSubject();
      course.status = 'draft';

      expect(ability.can('read', course)).toBe(false);
    });

    it('can read only their own enrollments', () => {
      const ability = factory.createForUser(student);

      const ownEnrollment = new EnrollmentSubject();
      ownEnrollment.userId = 'student-1';
      ownEnrollment.courseId = 'course-1';

      const otherEnrollment = new EnrollmentSubject();
      otherEnrollment.userId = 'student-2';
      otherEnrollment.courseId = 'course-1';

      expect(ability.can('read', ownEnrollment)).toBe(true);
      expect(ability.can('read', otherEnrollment)).toBe(false);
    });

    it('can read and update their own profile', () => {
      const ability = factory.createForUser(student);

      const ownProfile = new UserSubject();
      ownProfile.id = 'student-1';

      const otherProfile = new UserSubject();
      otherProfile.id = 'student-2';

      expect(ability.can('read', ownProfile)).toBe(true);
      expect(ability.can('update', ownProfile)).toBe(true);
      expect(ability.can('read', otherProfile)).toBe(false);
      expect(ability.can('update', otherProfile)).toBe(false);
    });
  });

  describe('Instructor permissions', () => {
    const instructor: CurrentUser = {
      id: 'inst-1',
      email: 'instructor@example.com',
      role: 'instructor',
      locale: 'ar',
    };

    it('can manage their own courses', () => {
      const ability = factory.createForUser(instructor);

      const ownCourse = new CourseSubject();
      ownCourse.instructorId = 'inst-1';

      const otherCourse = new CourseSubject();
      otherCourse.instructorId = 'inst-2';

      expect(ability.can('manage', ownCourse)).toBe(true);
      expect(ability.can('manage', otherCourse)).toBe(false);
    });

    it('can create courses', () => {
      const ability = factory.createForUser(instructor);
      expect(ability.can('create', CourseSubject)).toBe(true);
    });
  });

  describe('Admin permissions', () => {
    const admin: CurrentUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin',
      locale: 'en',
    };

    it('can manage all entities', () => {
      const ability = factory.createForUser(admin);
      expect(ability.can('manage', 'all')).toBe(true);
    });
  });
});
