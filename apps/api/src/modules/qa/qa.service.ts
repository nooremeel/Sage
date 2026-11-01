import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc, asc } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  qaThreads,
  qaMessages,
  lessons,
  sections,
  courses,
  users,
  enrollments,
} from '../../db/schema/index.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  type CreateQAThreadInput,
  type CreateQAMessageInput,
  type QAThreadDto,
  type QAMessageDto,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class QAService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    private readonly realtimeService: RealtimeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getLessonThreads(userId: string, lessonId: string): Promise<QAThreadDto[]> {
    // 1. Verify access
    await this.verifyLessonAccess(userId, lessonId);

    // 2. Fetch threads
    const threadRows = await this.db
      .select({
        thread: qaThreads,
        author: users,
      })
      .from(qaThreads)
      .innerJoin(users, eq(qaThreads.authorId, users.id))
      .where(eq(qaThreads.lessonId, lessonId))
      .orderBy(desc(qaThreads.createdAt));

    const results: QAThreadDto[] = [];

    for (const { thread, author } of threadRows) {
      // Message count and instructor answer flag
      const msgs = await this.db
        .select({
          id: qaMessages.id,
          isInstructorAnswer: qaMessages.isInstructorAnswer,
        })
        .from(qaMessages)
        .where(eq(qaMessages.threadId, thread.id));

      results.push({
        id: thread.id,
        lessonId: thread.lessonId,
        authorId: thread.authorId,
        authorName: author.email?.split('@')[0] ?? 'Anonymous',
        title: thread.title,
        content: thread.content,
        messagesCount: msgs.length,
        hasInstructorAnswer: msgs.some((m) => m.isInstructorAnswer),
        createdAt: new Date(thread.createdAt).toISOString(),
      });
    }

    return results;
  }

  async createThread(
    userId: string,
    lessonId: string,
    input: CreateQAThreadInput,
  ): Promise<QAThreadDto> {
    const { course, currentUser } = await this.verifyLessonAccess(userId, lessonId);

    const [newThread] = await this.db
      .insert(qaThreads)
      .values({
        lessonId,
        authorId: userId,
        title: input.title,
        content: input.content,
      })
      .returning();

    const threadDto: QAThreadDto = {
      id: newThread!.id,
      lessonId: newThread!.lessonId,
      authorId: newThread!.authorId,
      authorName: currentUser.email?.split('@')[0] ?? 'Anonymous',
      title: newThread!.title,
      content: newThread!.content,
      messagesCount: 0,
      hasInstructorAnswer: false,
      createdAt: new Date(newThread!.createdAt).toISOString(),
    };

    // Broadcast new thread via SSE
    this.realtimeService.publishToLesson(lessonId, 'new_qa_thread', threadDto);

    // If student posted, notify the course instructor
    if (course.instructorId !== userId) {
      await this.notificationsService.createNotification(
        course.instructorId,
        'qa_reply',
        {
          threadId: threadDto.id,
          lessonId,
          authorName: threadDto.authorName,
          title: threadDto.title,
        },
      );
    }

    return threadDto;
  }

  async getThreadWithMessages(userId: string, threadId: string) {
    const [threadWithAuthor] = await this.db
      .select({
        thread: qaThreads,
        author: users,
      })
      .from(qaThreads)
      .innerJoin(users, eq(qaThreads.authorId, users.id))
      .where(eq(qaThreads.id, threadId));

    if (!threadWithAuthor) {
      throw new NotFoundException('Thread not found');
    }

    const { thread, author } = threadWithAuthor;

    // Verify access
    await this.verifyLessonAccess(userId, thread.lessonId);

    // Fetch messages
    const messageRows = await this.db
      .select({
        msg: qaMessages,
        author: users,
      })
      .from(qaMessages)
      .innerJoin(users, eq(qaMessages.authorId, users.id))
      .where(eq(qaMessages.threadId, thread.id))
      .orderBy(asc(qaMessages.createdAt));

    const messages: QAMessageDto[] = messageRows.map(({ msg, author: msgAuthor }) => ({
      id: msg.id,
      threadId: msg.threadId,
      authorId: msg.authorId,
      authorName: msgAuthor.email?.split('@')[0] ?? 'Anonymous',
      authorRole: msgAuthor.role,
      content: msg.content,
      isInstructorAnswer: msg.isInstructorAnswer,
      createdAt: new Date(msg.createdAt).toISOString(),
    }));

    return {
      thread: {
        id: thread.id,
        lessonId: thread.lessonId,
        authorId: thread.authorId,
        authorName: author.email?.split('@')[0] ?? 'Anonymous',
        title: thread.title,
        content: thread.content,
        messagesCount: messages.length,
        hasInstructorAnswer: messages.some((m) => m.isInstructorAnswer),
        createdAt: new Date(thread.createdAt).toISOString(),
      },
      messages,
    };
  }

  async postReply(
    userId: string,
    threadId: string,
    input: CreateQAMessageInput,
  ): Promise<QAMessageDto> {
    const [thread] = await this.db
      .select()
      .from(qaThreads)
      .where(eq(qaThreads.id, threadId));

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const { course, currentUser } = await this.verifyLessonAccess(userId, thread.lessonId);

    const isInstructor = course.instructorId === userId;

    const [newMsg] = await this.db
      .insert(qaMessages)
      .values({
        threadId,
        authorId: userId,
        content: input.content,
        isInstructorAnswer: isInstructor,
      })
      .returning();

    const msgDto: QAMessageDto = {
      id: newMsg!.id,
      threadId: newMsg!.threadId,
      authorId: newMsg!.authorId,
      authorName: currentUser.email?.split('@')[0] ?? 'Anonymous',
      authorRole: currentUser.role,
      content: newMsg!.content,
      isInstructorAnswer: newMsg!.isInstructorAnswer,
      createdAt: new Date(newMsg!.createdAt).toISOString(),
    };

    // Broadcast reply event via SSE to all viewers of the lesson
    this.realtimeService.publishToLesson(thread.lessonId, 'new_qa_message', msgDto);

    // Notify thread author if someone else replied
    if (thread.authorId !== userId) {
      await this.notificationsService.createNotification(thread.authorId, 'qa_reply', {
        threadId,
        lessonId: thread.lessonId,
        authorName: msgDto.authorName,
        textSnippet: input.content.slice(0, 100),
      });
    }

    return msgDto;
  }

  private async verifyLessonAccess(userId: string, lessonId: string) {
    const [lessonWithCourse] = await this.db
      .select({
        lesson: lessons,
        course: courses,
      })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .innerJoin(courses, eq(sections.courseId, courses.id))
      .where(eq(lessons.id, lessonId));

    if (!lessonWithCourse) {
      throw new NotFoundException('Lesson not found');
    }

    const [currentUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const { lesson, course } = lessonWithCourse;

    const isOwner = course.instructorId === userId;
    const isAdmin = currentUser.role === 'admin';

    if (!lesson.isFreePreview && !isOwner && !isAdmin) {
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

    return { lesson, course, currentUser };
  }
}
