import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  quizzes,
  questions,
  options,
  quizAttempts,
  lessons,
  sections,
  courses,
  enrollments,
  lessonProgress,
} from '../../db/schema/index.js';
import {
  type CreateQuizInput,
  type SubmitQuizAttemptInput,
  type PublicQuizDto,
  type QuizAttemptResultDto,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class QuizzesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async createQuiz(userId: string, input: CreateQuizInput, isAdmin: boolean) {
    // 1. Verify lesson and course
    const [lessonWithCourse] = await this.db
      .select({
        lesson: lessons,
        course: courses,
      })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .innerJoin(courses, eq(sections.courseId, courses.id))
      .where(eq(lessons.id, input.lessonId));

    if (!lessonWithCourse) {
      throw new NotFoundException('Lesson not found');
    }

    if (!isAdmin && lessonWithCourse.course.instructorId !== userId) {
      throw new ForbiddenException('You do not own this course');
    }

    // 2. Transaction to insert quiz, questions, options
    const createdQuiz = await this.db.transaction(async (tx) => {
      // Check if quiz already exists for this lesson
      const [existingQuiz] = await tx
        .select()
        .from(quizzes)
        .where(eq(quizzes.lessonId, input.lessonId));

      let quizId: string;

      if (existingQuiz) {
        // Update quiz
        const [updated] = await tx
          .update(quizzes)
          .set({
            title: input.title,
            passingScore: input.passingScore,
            maxAttempts: input.maxAttempts ?? null,
            updatedAt: new Date(),
          })
          .where(eq(quizzes.id, existingQuiz.id))
          .returning();
        quizId = updated!.id;

        // Delete old questions/options (cascades)
        await tx.delete(questions).where(eq(questions.quizId, quizId));
      } else {
        const [newQuiz] = await tx
          .insert(quizzes)
          .values({
            lessonId: input.lessonId,
            title: input.title,
            passingScore: input.passingScore,
            maxAttempts: input.maxAttempts ?? null,
          })
          .returning();
        quizId = newQuiz!.id;
      }

      // Insert questions and options
      for (const q of input.questions) {
        const [insertedQ] = await tx
          .insert(questions)
          .values({
            quizId,
            position: q.position,
            prompt: q.prompt,
            type: q.type,
          })
          .returning();

        for (const opt of q.options) {
          await tx.insert(options).values({
            questionId: insertedQ!.id,
            position: opt.position,
            text: opt.text,
            isCorrect: opt.isCorrect,
          });
        }
      }

      return quizId;
    });

    return { quizId: createdQuiz };
  }

  async getQuizForStudent(userId: string, quizId: string): Promise<PublicQuizDto> {
    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId));

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check entitlement via lesson
    const [lessonWithCourse] = await this.db
      .select({
        lesson: lessons,
        course: courses,
      })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .innerJoin(courses, eq(sections.courseId, courses.id))
      .where(eq(lessons.id, quiz.lessonId));

    if (!lessonWithCourse) {
      throw new NotFoundException('Lesson not found');
    }

    const { lesson, course } = lessonWithCourse;

    if (!lesson.isFreePreview && course.instructorId !== userId) {
      const [enrollment] = await this.db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, userId),
            eq(enrollments.courseId, course.id),
          ),
        );

      if (!enrollment) {
        const err = new ForbiddenException('User is not enrolled in this course');
        (err as any).code = AppErrorCode.NOT_ENROLLED;
        throw err;
      }
    }

    // Fetch questions
    const qList = await this.db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quiz.id))
      .orderBy(asc(questions.position));

    const publicQuestions = [];

    for (const q of qList) {
      // Fetch options WITHOUT isCorrect
      const optList = await this.db
        .select({
          id: options.id,
          position: options.position,
          text: options.text,
        })
        .from(options)
        .where(eq(options.questionId, q.id))
        .orderBy(asc(options.position));

      publicQuestions.push({
        id: q.id,
        position: q.position,
        prompt: q.prompt as Record<string, string>,
        type: q.type as any,
        options: optList.map((opt) => ({
          id: opt.id,
          position: opt.position,
          text: opt.text as Record<string, string>,
        })),
      });
    }

    return {
      id: quiz.id,
      lessonId: quiz.lessonId,
      title: quiz.title as Record<string, string>,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      questions: publicQuestions,
    };
  }

  async getQuizByLessonId(userId: string, lessonId: string): Promise<PublicQuizDto> {
    const [quiz] = await this.db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId));

    if (!quiz) {
      throw new NotFoundException('No quiz found for this lesson');
    }

    return this.getQuizForStudent(userId, quiz.id);
  }

  async submitQuizAttempt(
    userId: string,
    quizId: string,
    input: SubmitQuizAttemptInput,
  ): Promise<QuizAttemptResultDto> {
    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId));

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check attempts limit
    const previousAttempts = await this.db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)));

    if (quiz.maxAttempts !== null && previousAttempts.length >= quiz.maxAttempts) {
      throw new BadRequestException('Maximum quiz attempts reached');
    }

    // Load full quiz with correct answers from DB
    const qList = await this.db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quiz.id));

    let passedQuestions = 0;
    const totalQuestions = qList.length;

    for (const q of qList) {
      const qOptions = await this.db
        .select()
        .from(options)
        .where(eq(options.questionId, q.id));

      const correctIds = qOptions.filter((o) => o.isCorrect).map((o) => o.id);
      const userSelectedIds = input.answers[q.id] ?? [];

      const isCorrect =
        correctIds.length === userSelectedIds.length &&
        correctIds.every((id) => userSelectedIds.includes(id));

      if (isCorrect) {
        passedQuestions++;
      }
    }

    const score = totalQuestions === 0 ? 0 : Math.round((passedQuestions / totalQuestions) * 100);
    const passed = score >= quiz.passingScore;
    const attemptNumber = previousAttempts.length + 1;

    // Record attempt
    const [attempt] = await this.db
      .insert(quizAttempts)
      .values({
        userId,
        quizId,
        answers: input.answers,
        score,
        passed,
        attemptNumber,
      })
      .returning();

    // If passed, mark the lesson as completed!
    if (passed) {
      const [existingProgress] = await this.db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, quiz.lessonId),
          ),
        );

      if (existingProgress) {
        if (!existingProgress.completedAt) {
          await this.db
            .update(lessonProgress)
            .set({ completedAt: new Date(), updatedAt: new Date() })
            .where(
              and(
                eq(lessonProgress.userId, userId),
                eq(lessonProgress.lessonId, quiz.lessonId),
              ),
            );
        }
      } else {
        await this.db.insert(lessonProgress).values({
          userId,
          lessonId: quiz.lessonId,
          positionSec: 0,
          completedAt: new Date(),
        });
      }
    }

    return {
      id: attempt!.id,
      quizId: attempt!.quizId,
      score: attempt!.score,
      passed: attempt!.passed,
      attemptNumber: attempt!.attemptNumber,
      maxAttempts: quiz.maxAttempts,
      completedAt: new Date(attempt!.createdAt).toISOString(),
    };
  }

  async getAttempts(userId: string, quizId: string): Promise<QuizAttemptResultDto[]> {
    const attempts = await this.db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(asc(quizAttempts.attemptNumber));

    const [quiz] = await this.db
      .select({ maxAttempts: quizzes.maxAttempts })
      .from(quizzes)
      .where(eq(quizzes.id, quizId));

    return attempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      score: a.score,
      passed: a.passed,
      attemptNumber: a.attemptNumber,
      maxAttempts: quiz?.maxAttempts ?? null,
      completedAt: new Date(a.createdAt).toISOString(),
    }));
  }
}
