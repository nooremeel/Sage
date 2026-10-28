import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, isNull, count, desc, asc } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  courses,
  courseTranslations,
  sections,
  lessons,
  categories,
  users,
} from '../../db/schema/index.js';
import {
  type CreateCourseInput,
  type UpdateCourseInput,
  type CourseDto,
  type SectionDto,
  type Locale,
  type CourseLevel,
  type CourseStatus,
  AppErrorCode,
} from '@sage/shared';
import { normalizeArabic } from '../../common/utils/arabic-normalizer.js';

@Injectable()
export class CoursesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async getCatalog(filters: {
    categorySlug?: string;
    level?: CourseLevel;
    locale?: Locale;
    limit?: number;
    offset?: number;
  }): Promise<{ courses: CourseDto[]; total: number }> {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    // Base query for published, non-deleted courses
    let categoryId: string | undefined;
    if (filters.categorySlug) {
      const cat = await this.db.query.categories.findFirst({
        where: eq(categories.slug, filters.categorySlug),
      });
      if (cat) {
        categoryId = cat.id;
      }
    }

    const whereConditions = [
      eq(courses.status, 'published'),
      isNull(courses.deletedAt),
    ];

    if (categoryId) {
      whereConditions.push(eq(courses.categoryId, categoryId));
    }
    if (filters.level) {
      whereConditions.push(eq(courses.level, filters.level));
    }

    const [totalRecord] = await this.db
      .select({ count: count() })
      .from(courses)
      .where(and(...whereConditions));

    const courseList = await this.db
      .select()
      .from(courses)
      .where(and(...whereConditions))
      .orderBy(desc(courses.publishedAt), desc(courses.createdAt))
      .limit(limit)
      .offset(offset);

    const results: CourseDto[] = [];
    for (const c of courseList) {
      const transList = await this.db
        .select()
        .from(courseTranslations)
        .where(eq(courseTranslations.courseId, c.id));

      const instructor = await this.db.query.users.findFirst({
        where: eq(users.id, c.instructorId),
      });

      const category = await this.db.query.categories.findFirst({
        where: eq(categories.id, c.categoryId),
      });

      results.push({
        id: c.id,
        instructorId: c.instructorId,
        instructorName: instructor ? instructor.email.split('@')[0] : 'Instructor',
        categoryId: c.categoryId,
        categoryName: category?.slug,
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

    return {
      courses: results,
      total: totalRecord?.count ? Number(totalRecord.count) : 0,
    };
  }

  async getCourseBySlug(slug: string, locale: Locale = 'en'): Promise<CourseDto> {
    const trans = await this.db.query.courseTranslations.findFirst({
      where: and(
        eq(courseTranslations.slug, slug),
        eq(courseTranslations.locale, locale),
      ),
    });

    const fallbackTrans =
      trans ||
      (await this.db.query.courseTranslations.findFirst({
        where: eq(courseTranslations.slug, slug),
      }));

    if (!fallbackTrans) {
      throw new NotFoundException({
        message: 'Course not found',
        code: AppErrorCode.COURSE_NOT_FOUND,
      });
    }

    const course = await this.db.query.courses.findFirst({
      where: and(
        eq(courses.id, fallbackTrans.courseId),
        eq(courses.status, 'published'),
        isNull(courses.deletedAt),
      ),
    });

    if (!course) {
      throw new NotFoundException({
        message: 'Course not found or not published',
        code: AppErrorCode.COURSE_NOT_FOUND,
      });
    }

    return this.buildCourseDetails(course);
  }

  async buildCourseDetails(course: typeof courses.$inferSelect): Promise<CourseDto> {
    const transList = await this.db
      .select()
      .from(courseTranslations)
      .where(eq(courseTranslations.courseId, course.id));

    const courseSections = await this.db
      .select()
      .from(sections)
      .where(eq(sections.courseId, course.id))
      .orderBy(asc(sections.position));

    const sectionsWithLessons: SectionDto[] = [];
    for (const sec of courseSections) {
      const secLessons = await this.db
        .select()
        .from(lessons)
        .where(eq(lessons.sectionId, sec.id))
        .orderBy(asc(lessons.position));

      sectionsWithLessons.push({
        id: sec.id,
        courseId: sec.courseId,
        position: sec.position,
        title: sec.title,
        createdAt: sec.createdAt.toISOString(),
        lessons: secLessons.map((l) => ({
          id: l.id,
          sectionId: l.sectionId,
          position: l.position,
          type: l.type,
          title: l.title,
          isFreePreview: l.isFreePreview,
          durationSec: l.durationSec,
          createdAt: l.createdAt.toISOString(),
        })),
      });
    }

    const instructor = await this.db.query.users.findFirst({
      where: eq(users.id, course.instructorId),
    });

    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, course.categoryId),
    });

    return {
      id: course.id,
      instructorId: course.instructorId,
      instructorName: instructor ? instructor.email.split('@')[0] : 'Instructor',
      categoryId: course.categoryId,
      categoryName: category?.slug,
      status: course.status as CourseStatus,
      level: course.level as CourseLevel,
      priceCents: course.priceCents,
      currency: course.currency,
      primaryLocale: course.primaryLocale as Locale,
      ratingAvg: Number(course.ratingAvg),
      ratingCount: course.ratingCount,
      publishedAt: course.publishedAt ? course.publishedAt.toISOString() : null,
      createdAt: course.createdAt.toISOString(),
      translations: transList.map((t) => ({
        locale: t.locale as Locale,
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        slug: t.slug,
      })),
      sections: sectionsWithLessons,
    };
  }

  // --- Instructor Studio Methods ---

  async createCourse(instructorId: string, input: CreateCourseInput): Promise<CourseDto> {
    // Check slug uniqueness
    for (const t of input.translations) {
      const existing = await this.db.query.courseTranslations.findFirst({
        where: and(
          eq(courseTranslations.locale, t.locale),
          eq(courseTranslations.slug, t.slug),
        ),
      });
      if (existing) {
        throw new ConflictException(`Course slug '${t.slug}' already exists in ${t.locale}`);
      }
    }

    const [newCourse] = await this.db
      .insert(courses)
      .values({
        instructorId,
        categoryId: input.categoryId,
        level: input.level || 'beginner',
        priceCents: input.priceCents || 0,
        currency: input.currency || 'USD',
        primaryLocale: input.primaryLocale || 'en',
        status: 'draft',
      })
      .returning();

    if (!newCourse) {
      throw new BadRequestException('Failed to create course draft');
    }

    for (const t of input.translations) {
      const searchText =
        t.locale === 'ar'
          ? normalizeArabic(`${t.title} ${t.subtitle || ''} ${t.description}`)
          : `${t.title} ${t.subtitle || ''} ${t.description}`.toLowerCase();

      await this.db.insert(courseTranslations).values({
        courseId: newCourse.id,
        locale: t.locale,
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        slug: t.slug,
        searchText,
      });
    }

    return this.buildCourseDetails(newCourse);
  }

  async getInstructorCourses(instructorId: string): Promise<CourseDto[]> {
    const list = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.instructorId, instructorId), isNull(courses.deletedAt)))
      .orderBy(desc(courses.createdAt));

    const results: CourseDto[] = [];
    for (const c of list) {
      const details = await this.buildCourseDetails(c);
      results.push(details);
    }
    return results;
  }

  async getStudioCourse(courseId: string, instructorId: string, isAdmin = false): Promise<CourseDto> {
    const course = await this.db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), isNull(courses.deletedAt)),
    });

    if (!course) {
      throw new NotFoundException({
        message: 'Course not found',
        code: AppErrorCode.COURSE_NOT_FOUND,
      });
    }

    // IDOR Check
    if (course.instructorId !== instructorId && !isAdmin) {
      throw new ForbiddenException({
        message: 'You do not have permission to view or edit this course',
        code: AppErrorCode.FORBIDDEN,
      });
    }

    return this.buildCourseDetails(course);
  }

  async updateCourse(
    courseId: string,
    instructorId: string,
    input: UpdateCourseInput,
    isAdmin = false,
  ): Promise<CourseDto> {
    const course = await this.db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), isNull(courses.deletedAt)),
    });

    if (!course) {
      throw new NotFoundException({
        message: 'Course not found',
        code: AppErrorCode.COURSE_NOT_FOUND,
      });
    }

    if (course.instructorId !== instructorId && !isAdmin) {
      throw new ForbiddenException({
        message: 'You do not have permission to edit this course',
        code: AppErrorCode.FORBIDDEN,
      });
    }

    const updateValues: Partial<typeof courses.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.categoryId) updateValues.categoryId = input.categoryId;
    if (input.level) updateValues.level = input.level;
    if (input.priceCents !== undefined) updateValues.priceCents = input.priceCents;
    if (input.currency) updateValues.currency = input.currency;
    if (input.primaryLocale) updateValues.primaryLocale = input.primaryLocale;

    await this.db.update(courses).set(updateValues).where(eq(courses.id, courseId));

    if (input.translations && input.translations.length > 0) {
      for (const t of input.translations) {
        const searchText =
          t.locale === 'ar'
            ? normalizeArabic(`${t.title} ${t.subtitle || ''} ${t.description}`)
            : `${t.title} ${t.subtitle || ''} ${t.description}`.toLowerCase();

        const existing = await this.db.query.courseTranslations.findFirst({
          where: and(
            eq(courseTranslations.courseId, courseId),
            eq(courseTranslations.locale, t.locale),
          ),
        });

        if (existing) {
          await this.db
            .update(courseTranslations)
            .set({
              title: t.title,
              subtitle: t.subtitle,
              description: t.description,
              slug: t.slug,
              searchText,
            })
            .where(
              and(
                eq(courseTranslations.courseId, courseId),
                eq(courseTranslations.locale, t.locale),
              ),
            );
        } else {
          await this.db.insert(courseTranslations).values({
            courseId,
            locale: t.locale,
            title: t.title,
            subtitle: t.subtitle,
            description: t.description,
            slug: t.slug,
            searchText,
          });
        }
      }
    }

    const updated = await this.db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });
    return this.buildCourseDetails(updated!);
  }

  async submitForReview(courseId: string, instructorId: string, isAdmin = false): Promise<CourseDto> {
    const course = await this.db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), isNull(courses.deletedAt)),
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== instructorId && !isAdmin) {
      throw new ForbiddenException('You do not own this course');
    }

    // Require at least one section and one lesson to submit
    const courseSections = await this.db
      .select()
      .from(sections)
      .where(eq(sections.courseId, courseId));

    if (courseSections.length === 0) {
      throw new BadRequestException('A course must have at least one section before submission');
    }

    await this.db
      .update(courses)
      .set({ status: 'in_review', updatedAt: new Date() })
      .where(eq(courses.id, courseId));

    const updated = await this.db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });
    return this.buildCourseDetails(updated!);
  }

  async deleteCourse(courseId: string, instructorId: string, isAdmin = false): Promise<void> {
    const course = await this.db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), isNull(courses.deletedAt)),
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== instructorId && !isAdmin) {
      throw new ForbiddenException('You do not own this course');
    }

    // Soft delete
    await this.db
      .update(courses)
      .set({ deletedAt: new Date() })
      .where(eq(courses.id, courseId));
  }
}
