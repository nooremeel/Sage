import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import { sections, lessons, courses } from '../../db/schema/index.js';
import type {
  CreateSectionInput,
  UpdateSectionInput,
  CreateLessonInput,
  UpdateLessonInput,
  SectionDto,
  LessonDto,
} from '@sage/shared';

@Injectable()
export class CurriculumService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  private async assertCourseOwnership(
    courseId: string,
    instructorId: string,
    isAdmin = false,
  ) {
    const course = await this.db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== instructorId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to manage this course');
    }

    return course;
  }

  // --- Sections ---

  async addSection(
    courseId: string,
    instructorId: string,
    input: CreateSectionInput,
    isAdmin = false,
  ): Promise<SectionDto> {
    await this.assertCourseOwnership(courseId, instructorId, isAdmin);

    // Compute next position
    const lastSection = await this.db.query.sections.findFirst({
      where: eq(sections.courseId, courseId),
      orderBy: desc(sections.position),
    });

    const nextPosition = lastSection ? lastSection.position + 1 : 0;

    const [newSection] = await this.db
      .insert(sections)
      .values({
        courseId,
        position: nextPosition,
        title: input.title,
      })
      .returning();

    if (!newSection) {
      throw new BadRequestException('Failed to create section');
    }

    return {
      id: newSection.id,
      courseId: newSection.courseId,
      position: newSection.position,
      title: newSection.title,
      lessons: [],
      createdAt: newSection.createdAt.toISOString(),
    };
  }

  async updateSection(
    sectionId: string,
    instructorId: string,
    input: UpdateSectionInput,
    isAdmin = false,
  ): Promise<SectionDto> {
    const section = await this.db.query.sections.findFirst({
      where: eq(sections.id, sectionId),
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.assertCourseOwnership(section.courseId, instructorId, isAdmin);

    const updateData: Partial<typeof sections.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.title) updateData.title = input.title;

    const [updated] = await this.db
      .update(sections)
      .set(updateData)
      .where(eq(sections.id, sectionId))
      .returning();

    return {
      id: updated!.id,
      courseId: updated!.courseId,
      position: updated!.position,
      title: updated!.title,
      createdAt: updated!.createdAt.toISOString(),
    };
  }

  async deleteSection(sectionId: string, instructorId: string, isAdmin = false): Promise<void> {
    const section = await this.db.query.sections.findFirst({
      where: eq(sections.id, sectionId),
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.assertCourseOwnership(section.courseId, instructorId, isAdmin);

    await this.db.delete(sections).where(eq(sections.id, sectionId));
  }

  async reorderSections(
    courseId: string,
    instructorId: string,
    sectionIds: string[],
    isAdmin = false,
  ): Promise<void> {
    await this.assertCourseOwnership(courseId, instructorId, isAdmin);

    // Transactional reordering
    await this.db.transaction(async (tx) => {
      for (let i = 0; i < sectionIds.length; i++) {
        const id = sectionIds[i];
        if (id) {
          await tx
            .update(sections)
            .set({ position: i, updatedAt: new Date() })
            .where(and(eq(sections.id, id), eq(sections.courseId, courseId)));
        }
      }
    });
  }

  // --- Lessons ---

  async addLesson(
    sectionId: string,
    instructorId: string,
    input: CreateLessonInput,
    isAdmin = false,
  ): Promise<LessonDto> {
    const section = await this.db.query.sections.findFirst({
      where: eq(sections.id, sectionId),
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.assertCourseOwnership(section.courseId, instructorId, isAdmin);

    const lastLesson = await this.db.query.lessons.findFirst({
      where: eq(lessons.sectionId, sectionId),
      orderBy: desc(lessons.position),
    });

    const nextPosition = lastLesson ? lastLesson.position + 1 : 0;

    const [newLesson] = await this.db
      .insert(lessons)
      .values({
        sectionId,
        position: nextPosition,
        type: input.type,
        title: input.title,
        isFreePreview: input.isFreePreview || false,
        durationSec: input.durationSec || 0,
        body: input.body,
      })
      .returning();

    if (!newLesson) {
      throw new BadRequestException('Failed to create lesson');
    }

    return {
      id: newLesson.id,
      sectionId: newLesson.sectionId,
      position: newLesson.position,
      type: newLesson.type,
      title: newLesson.title,
      isFreePreview: newLesson.isFreePreview,
      durationSec: newLesson.durationSec,
      body: newLesson.body,
      createdAt: newLesson.createdAt.toISOString(),
    };
  }

  async updateLesson(
    lessonId: string,
    instructorId: string,
    input: UpdateLessonInput,
    isAdmin = false,
  ): Promise<LessonDto> {
    const lesson = await this.db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const section = await this.db.query.sections.findFirst({
      where: eq(sections.id, lesson.sectionId),
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.assertCourseOwnership(section.courseId, instructorId, isAdmin);

    const updateData: Partial<typeof lessons.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.title) updateData.title = input.title;
    if (input.type) updateData.type = input.type;
    if (input.isFreePreview !== undefined) updateData.isFreePreview = input.isFreePreview;
    if (input.durationSec !== undefined) updateData.durationSec = input.durationSec;
    if (input.body !== undefined) updateData.body = input.body;

    const [updated] = await this.db
      .update(lessons)
      .set(updateData)
      .where(eq(lessons.id, lessonId))
      .returning();

    return {
      id: updated!.id,
      sectionId: updated!.sectionId,
      position: updated!.position,
      type: updated!.type,
      title: updated!.title,
      isFreePreview: updated!.isFreePreview,
      durationSec: updated!.durationSec,
      body: updated!.body,
      createdAt: updated!.createdAt.toISOString(),
    };
  }

  async deleteLesson(lessonId: string, instructorId: string, isAdmin = false): Promise<void> {
    const lesson = await this.db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const section = await this.db.query.sections.findFirst({
      where: eq(sections.id, lesson.sectionId),
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.assertCourseOwnership(section.courseId, instructorId, isAdmin);

    await this.db.delete(lessons).where(eq(lessons.id, lessonId));
  }

  async reorderLessons(
    sectionId: string,
    instructorId: string,
    lessonIds: string[],
    isAdmin = false,
  ): Promise<void> {
    const section = await this.db.query.sections.findFirst({
      where: eq(sections.id, sectionId),
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.assertCourseOwnership(section.courseId, instructorId, isAdmin);

    // Transactional reordering
    await this.db.transaction(async (tx) => {
      for (let i = 0; i < lessonIds.length; i++) {
        const id = lessonIds[i];
        if (id) {
          await tx
            .update(lessons)
            .set({ position: i, updatedAt: new Date() })
            .where(and(eq(lessons.id, id), eq(lessons.sectionId, sectionId)));
        }
      }
    });
  }
}

