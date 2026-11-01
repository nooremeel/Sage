import { Injectable, Inject } from '@nestjs/common';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  courses,
  courseTranslations,
  enrollments,
  certificates,
  users,
} from '../../db/schema/index.js';
import type { InstructorAnalyticsDto, AdminAnalyticsDto } from '@sage/shared';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async getInstructorAnalytics(
    instructorId: string,
  ): Promise<InstructorAnalyticsDto> {
    // 1. Fetch instructor courses
    const instCourses = await this.db
      .select({ id: courses.id, ratingAvg: courses.ratingAvg, ratingCount: courses.ratingCount })
      .from(courses)
      .where(eq(courses.instructorId, instructorId));

    const totalCourses = instCourses.length;
    if (totalCourses === 0) {
      return {
        totalCourses: 0,
        totalStudents: 0,
        totalCompletions: 0,
        averageRating: 5.0,
        recentEnrollments: [],
      };
    }

    const courseIds = instCourses.map((c) => c.id);

    // 2. Total students enrolled
    const [studentsResult] = await this.db
      .select({ count: sql<number>`count(distinct ${enrollments.userId})::int` })
      .from(enrollments)
      .where(inArray(enrollments.courseId, courseIds));

    // 3. Total completions
    const [completionsResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(certificates)
      .where(inArray(certificates.courseId, courseIds));

    // 4. Average rating
    const ratedCourses = instCourses.filter((c) => c.ratingCount > 0);
    const averageRating =
      ratedCourses.length === 0
        ? 5.0
        : Math.round(
            (ratedCourses.reduce((acc, c) => acc + parseFloat(c.ratingAvg), 0) /
              ratedCourses.length) *
              10,
          ) / 10;

    // 5. Recent enrollments
    const recent = await this.db
      .select({
        enrolledAt: enrollments.enrolledAt,
        studentEmail: users.email,
        courseId: enrollments.courseId,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(inArray(enrollments.courseId, courseIds))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(5);

    const recentEnrollments = [];
    for (const r of recent) {
      const [trans] = await this.db
        .select({ title: courseTranslations.title })
        .from(courseTranslations)
        .where(eq(courseTranslations.courseId, r.courseId))
        .limit(1);

      recentEnrollments.push({
        courseTitle: trans?.title || 'Course',
        studentEmail: r.studentEmail,
        enrolledAt: new Date(r.enrolledAt).toISOString(),
      });
    }

    return {
      totalCourses,
      totalStudents: studentsResult?.count ?? 0,
      totalCompletions: completionsResult?.count ?? 0,
      averageRating,
      recentEnrollments,
    };
  }

  async getAdminAnalytics(): Promise<AdminAnalyticsDto> {
    const [usersCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    const [instructorsCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'instructor'));

    const [coursesCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(courses);

    const [enrollmentsCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(enrollments);

    const [completionsCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(certificates);

    return {
      totalUsers: usersCount?.count ?? 0,
      totalInstructors: instructorsCount?.count ?? 0,
      totalCourses: coursesCount?.count ?? 0,
      totalEnrollments: enrollmentsCount?.count ?? 0,
      totalCompletions: completionsCount?.count ?? 0,
    };
  }
}

