import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  courses,
  courseTranslations,
  instructorApplications,
  users,
} from '../../db/schema/index.js';
import type { ReviewCourseInput, CourseDto, Locale, CourseLevel, CourseStatus } from '@sage/shared';
import { CacheService } from '../../common/cache/cache.service.js';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    @Optional() private readonly cacheService?: CacheService,
  ) {}

  // Review Queue
  async getReviewQueue(): Promise<CourseDto[]> {
    const list = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.status, 'in_review'), isNull(courses.deletedAt)))
      .orderBy(desc(courses.updatedAt));

    const results: CourseDto[] = [];
    for (const c of list) {
      const transList = await this.db
        .select()
        .from(courseTranslations)
        .where(eq(courseTranslations.courseId, c.id));

      const instructor = await this.db.query.users.findFirst({
        where: eq(users.id, c.instructorId),
      });

      results.push({
        id: c.id,
        instructorId: c.instructorId,
        instructorName: instructor ? instructor.email.split('@')[0] : 'Instructor',
        categoryId: c.categoryId,
        status: c.status as CourseStatus,
        level: c.level as CourseLevel,
        priceCents: c.priceCents,
        currency: c.currency,
        primaryLocale: c.primaryLocale as Locale,
        ratingAvg: Number(c.ratingAvg),
        ratingCount: c.ratingCount,
        publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        translations: transList.map((t) => ({
          locale: t.locale as Locale,
          title: t.title,
          subtitle: t.subtitle,
          description: t.description,
          slug: t.slug,
        })),
      });
    }

    return results;
  }

  async reviewCourse(courseId: string, input: ReviewCourseInput): Promise<{ message: string; status: string }> {
    const course = await this.db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), isNull(courses.deletedAt)),
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (input.action === 'approve') {
      await this.db
        .update(courses)
        .set({
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courses.id, courseId));

      await this.cacheService?.invalidateTag(`course:${courseId}`);
      await this.cacheService?.invalidateTag('catalog');

      return { message: 'Course approved and published', status: 'published' };
    } else {
      await this.db
        .update(courses)
        .set({
          status: 'draft',
          updatedAt: new Date(),
        })
        .where(eq(courses.id, courseId));

      await this.cacheService?.invalidateTag(`course:${courseId}`);
      await this.cacheService?.invalidateTag('catalog');

      return { message: `Course rejected: ${input.reason || 'Needs improvements'}`, status: 'draft' };
    }
  }

  // Instructor Applications
  async applyToBecomeInstructor(userId: string, bio: string): Promise<{ message: string; applicationId: string }> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'instructor' || user.role === 'admin') {
      throw new ConflictException('You are already an instructor or admin');
    }

    const pending = await this.db.query.instructorApplications.findFirst({
      where: and(
        eq(instructorApplications.userId, userId),
        eq(instructorApplications.status, 'pending'),
      ),
    });

    if (pending) {
      throw new ConflictException('You already have a pending instructor application');
    }

    const [app] = await this.db
      .insert(instructorApplications)
      .values({
        userId,
        bio,
        status: 'pending',
      })
      .returning();

    if (!app) {
      throw new BadRequestException('Failed to submit application');
    }

    return { message: 'Application submitted successfully', applicationId: app.id };
  }

  async getInstructorApplications(): Promise<any[]> {
    const apps = await this.db
      .select()
      .from(instructorApplications)
      .where(eq(instructorApplications.status, 'pending'))
      .orderBy(desc(instructorApplications.createdAt));

    const results = [];
    for (const a of apps) {
      const applicant = await this.db.query.users.findFirst({
        where: eq(users.id, a.userId),
      });
      results.push({
        id: a.id,
        userId: a.userId,
        userEmail: applicant?.email,
        bio: a.bio,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      });
    }

    return results;
  }

  async reviewInstructorApplication(
    applicationId: string,
    action: 'approve' | 'reject',
    reason?: string,
  ): Promise<{ message: string }> {
    const app = await this.db.query.instructorApplications.findFirst({
      where: eq(instructorApplications.id, applicationId),
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    if (action === 'approve') {
      // Transactional: mark approved and update user role to instructor
      await this.db.transaction(async (tx) => {
        await tx
          .update(instructorApplications)
          .set({ status: 'approved', updatedAt: new Date() })
          .where(eq(instructorApplications.id, applicationId));

        await tx
          .update(users)
          .set({ role: 'instructor', updatedAt: new Date() })
          .where(eq(users.id, app.userId));
      });

      return { message: 'Instructor application approved; user promoted to instructor' };
    } else {
      await this.db
        .update(instructorApplications)
        .set({ status: 'rejected', rejectionReason: reason, updatedAt: new Date() })
        .where(eq(instructorApplications.id, applicationId));

      return { message: 'Instructor application rejected' };
    }
  }
}

