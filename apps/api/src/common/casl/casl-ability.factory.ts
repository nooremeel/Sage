import { AbilityBuilder, createMongoAbility, MongoAbility, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import type { UserRole } from '@sage/shared';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

// Domain Subjects
export class UserSubject {
  id!: string;
  role!: UserRole;
}

export class CourseSubject {
  id!: string;
  instructorId!: string;
  status!: string;
}

export class LessonSubject {
  id!: string;
  courseId!: string;
  isFreePreview!: boolean;
}

export class EnrollmentSubject {
  userId!: string;
  courseId!: string;
}

export type Subjects =
  | InferSubjects<typeof UserSubject | typeof CourseSubject | typeof LessonSubject | typeof EnrollmentSubject>
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  locale: string;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: CurrentUser): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === 'admin') {
      can('manage', 'all');
      // Admin cannot change password hashes directly or impersonate sensitive credentials
      cannot('update', UserSubject, ['passwordHash'] as any);
    } else if (user.role === 'instructor') {
      // Instructors can manage their own courses, sections, and lessons
      can('manage', CourseSubject, { instructorId: user.id } as any);
      can('create', CourseSubject);
      can('read', CourseSubject, { status: 'published' } as any);

      // Instructors can manage lessons for their courses
      can('manage', LessonSubject);

      // Can manage their own profile
      can('read', UserSubject, { id: user.id } as any);
      can('update', UserSubject, { id: user.id } as any);
    } else {
      // Student permissions
      can('read', CourseSubject, { status: 'published' } as any);
      can('read', LessonSubject, { isFreePreview: true } as any);

      // Students can manage only their own enrollments & progress
      can('read', EnrollmentSubject, { userId: user.id } as any);
      can('create', EnrollmentSubject, { userId: user.id } as any);

      // Profile management
      can('read', UserSubject, { id: user.id } as any);
      can('update', UserSubject, { id: user.id } as any);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
