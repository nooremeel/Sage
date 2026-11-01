import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  lessonProgress,
  lessons,
  sections,
  courses,
  courseTranslations,
  enrollments,
} from '../../db/schema/index.js';
import {
  type ProgressHeartbeatInput,
  type LessonProgressDto,
  type CourseProgressDto,
  type ContinueLearningItemDto,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class ProgressService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async recordHeartbeat(
    userId: string,
    input: ProgressHeartbeatInput,
  ): Promise<{ progress: LessonProgressDto; courseProgress: CourseProgressDto }> {
    // 1. Fetch lesson and its course via section
    const [lessonWithCourse] = await this.db
      .select({
        lesson: lessons,
        section: sections,
        course: courses,
      })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .innerJoin(courses, eq(sections.courseId, courses.id))
      .where(eq(lessons.id, input.lessonId));

    if (!lessonWithCourse) {
      throw new NotFoundException('Lesson not found');
    }

    const { lesson, course } = lessonWithCourse;

    // 2. Check enrollment entitlement (enrolled, instructor, or admin)
    const [enrollment] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id)));

    const isOwner = course.instructorId === userId;

    if (!enrollment && !isOwner) {
      const err = new ForbiddenException('User is not enrolled in this course');
      (err as any).code = AppErrorCode.NOT_ENROLLED;
      throw err;
    }

    // 3. Determine completion
    // Completion rule: marked explicitly OR video watched to >= 90%
    const duration = input.durationSec ?? lesson.durationSec;
    let isCompleted = Boolean(input.completed);

    if (!isCompleted && duration > 0 && input.positionSec >= Math.floor(duration * 0.9)) {
      isCompleted = true;
    }

    // 4. Upsert lesson progress
    const [existing] = await this.db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, input.lessonId),
        ),
      );

    let savedProgress: typeof lessonProgress.$inferSelect;

    if (existing) {
      const completedAt =
        existing.completedAt ?? (isCompleted ? new Date() : null);

      const [updated] = await this.db
        .update(lessonProgress)
        .set({
          positionSec: input.positionSec,
          completedAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, input.lessonId),
          ),
        )
        .returning();

      savedProgress = updated!;
    } else {
      const [inserted] = await this.db
        .insert(lessonProgress)
        .values({
          userId,
          lessonId: input.lessonId,
          positionSec: input.positionSec,
          completedAt: isCompleted ? new Date() : null,
        })
        .returning();

      savedProgress = inserted!;
    }

    // 5. Compute overall course progress
    const courseProg = await this.getCourseProgress(userId, course.id);

    return {
      progress: this.mapToLessonProgressDto(savedProgress),
      courseProgress: courseProg,
    };
  }

  async getCourseProgress(userId: string, courseId: string): Promise<CourseProgressDto> {
    // Fetch all lessons for course
    const courseLessons = await this.db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(eq(sections.courseId, courseId));

    const totalLessons = courseLessons.length;
    if (totalLessons === 0) {
      return {
        courseId,
        totalLessons: 0,
        completedLessons: 0,
        percent: 0,
        completedLessonIds: [],
        lastAccessedLessonId: null,
      };
    }

    const lessonIds = courseLessons.map((l) => l.id);

    const progressRows = await this.db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          inArray(lessonProgress.lessonId, lessonIds),
        ),
      );

    const completed = progressRows.filter((p) => p.completedAt !== null);
    const completedLessonIds = completed.map((p) => p.lessonId);
    const percent = Math.round((completed.length / totalLessons) * 100);

    // Find latest accessed
    let lastAccessedLessonId: string | null = null;
    if (progressRows.length > 0) {
      const sorted = [...progressRows].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      lastAccessedLessonId = sorted[0]!.lessonId;
    }

    return {
      courseId,
      totalLessons,
      completedLessons: completed.length,
      percent,
      completedLessonIds,
      lastAccessedLessonId,
    };
  }

  async getContinueLearning(userId: string): Promise<ContinueLearningItemDto[]> {
    // Get all user enrollments
    const userEnrollments = await this.db
      .select({
        course: courses,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId));

    const results: ContinueLearningItemDto[] = [];

    for (const { course } of userEnrollments) {
      // Get course translations
      const translations = await this.db
        .select()
        .from(courseTranslations)
        .where(eq(courseTranslations.courseId, course.id));

      const titleRecord: Record<string, string> = {};
      let slug = '';
      for (const t of translations) {
        titleRecord[t.locale] = t.title;
        if (!slug || t.locale === 'en') {
          slug = t.slug;
        }
      }

      // Get progress
      const courseProg = await this.getCourseProgress(userId, course.id);

      // Fetch ordered lessons
      const orderedLessons = await this.db
        .select({
          lessonId: lessons.id,
          lessonTitle: lessons.title,
          sectionPos: sections.position,
          lessonPos: lessons.position,
        })
        .from(lessons)
        .innerJoin(sections, eq(lessons.sectionId, sections.id))
        .where(eq(sections.courseId, course.id))
        .orderBy(asc(sections.position), asc(lessons.position));

      // Find first unfinished lesson
      let nextLessonId: string | null = null;
      let nextLessonTitle: Record<string, string> | null = null;

      for (const l of orderedLessons) {
        if (!courseProg.completedLessonIds.includes(l.lessonId)) {
          nextLessonId = l.lessonId;
          nextLessonTitle = (l.lessonTitle as Record<string, string>) ?? null;
          break;
        }
      }

      // If all completed, nextLesson can be the first lesson or null
      results.push({
        courseId: course.id,
        courseSlug: slug,
        courseTitle: titleRecord,
        percent: courseProg.percent,
        nextLessonId,
        nextLessonTitle,
        lastAccessedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  private mapToLessonProgressDto(row: typeof lessonProgress.$inferSelect): LessonProgressDto {
    return {
      userId: row.userId,
      lessonId: row.lessonId,
      positionSec: row.positionSec,
      completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
