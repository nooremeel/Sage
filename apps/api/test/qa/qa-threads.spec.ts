import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { QAService } from '../../src/modules/qa/qa.service.js';
import { qaThreads, qaMessages, lessons, users, enrollments } from '../../src/db/schema/index.js';
import { AppErrorCode } from '@sage/shared';

describe('Lesson Q&A Discussion & Instructor Badges Suite', () => {
  let qaService: QAService;
  let mockDb: any;
  let mockRealtime: any;
  let mockNotifications: any;

  const lessonId = 'lesson-uuid-1';
  const courseId = 'course-uuid-1';
  const instructorId = 'inst-uuid-1';
  const studentId = 'student-uuid-1';
  const otherStudentId = 'student-uuid-2';

  let enrollmentsList: any[] = [];
  let threadsList: any[] = [];
  let messagesList: any[] = [];

  beforeEach(() => {
    enrollmentsList = [
      {
        id: 'enrollment-1',
        userId: studentId,
        courseId,
      },
    ];

    threadsList = [];
    messagesList = [];

    mockRealtime = {
      publishToLesson: vi.fn(),
      publishToUser: vi.fn(),
    };

    mockNotifications = {
      createNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    mockDb = {
      select: (fields?: any) => ({
        from: (table: any) => {
          if (table === lessons) {
            return {
              innerJoin: () => ({
                innerJoin: () => ({
                  where: () => [
                    {
                      lesson: { id: lessonId, isFreePreview: false },
                      course: { id: courseId, instructorId },
                    },
                  ],
                }),
              }),
            };
          }

          if (table === users) {
            return {
              where: () => [
                {
                  id: studentId,
                  email: 'ahmad@example.com',
                  name: 'Student Ahmad',
                  role: 'student',
                },
              ],
            };
          }

          return {
            where: () => {
              const res = table === enrollments ? enrollmentsList : [];
              return {
                orderBy: () => [],
                then: (fn: any) => fn(res),
                [Symbol.iterator]: function* () {
                  yield* res;
                },
              };
            },
            innerJoin: () => ({
              where: () => ({
                orderBy: () => [],
              }),
            }),
          };
        },
      }),
      insert: (table: any) => ({
        values: (vals: any) => {
          const record = {
            id: `record-${Date.now()}`,
            createdAt: new Date(),
            ...vals,
          };
          if (table === qaThreads) {
            threadsList.push(record);
          } else if (table === qaMessages) {
            messagesList.push(record);
          }
          return {
            returning: () => [record],
          };
        },
      }),
    };

    qaService = new QAService(mockDb, mockRealtime, mockNotifications);
  });

  it('rejects access if student is not enrolled', async () => {
    enrollmentsList = [];

    await expect(
      qaService.createThread('unenrolled-student', lessonId, {
        title: 'Question title',
        content: 'Question content details',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates thread, broadcasts SSE event, and notifies instructor', async () => {
    const thread = await qaService.createThread(studentId, lessonId, {
      title: 'How does buffering work?',
      content: 'Can someone explain the HLS segment size?',
    });

    expect(thread).toBeDefined();
    expect(thread.title).toBe('How does buffering work?');

    // Realtime broadcast to lesson SSE room
    expect(mockRealtime.publishToLesson).toHaveBeenCalledWith(
      lessonId,
      'new_qa_thread',
      expect.objectContaining({ title: 'How does buffering work?' }),
    );

    // Notification dispatched to course instructor
    expect(mockNotifications.createNotification).toHaveBeenCalledWith(
      instructorId,
      'qa_reply',
      expect.objectContaining({ threadId: thread.id }),
    );
  });

  it('flags instructor reply with isInstructorAnswer: true and notifies thread author', async () => {
    // 1. Thread created by student
    const [mockThread] = [
      {
        id: 'thread-1',
        lessonId,
        authorId: studentId,
        title: 'Buffer question',
        content: 'Buffer explanation please',
      },
    ];

    // Mock select to return thread and user
    mockDb.select = () => ({
      from: (table: any) => {
        if (table === qaThreads) {
          return {
            where: () => [mockThread],
          };
        }
        if (table === lessons) {
          return {
            innerJoin: () => ({
              innerJoin: () => ({
                where: () => [
                  {
                    lesson: { id: lessonId, isFreePreview: false },
                    course: { id: courseId, instructorId },
                  },
                ],
              }),
            }),
          };
        }
        if (table === users) {
          return {
            where: () => [
              {
                id: instructorId,
                email: 'nour@example.com',
                name: 'Instructor Nour',
                role: 'instructor',
              },
            ],
          };
        }
        return {
          where: () => [],
        };
      },
    });

    const reply = await qaService.postReply(instructorId, 'thread-1', {
      content: 'Segments are typically 6 seconds in length for optimal VOD delivery.',
    });

    expect(reply.isInstructorAnswer).toBe(true);

    // Realtime broadcast to lesson SSE room
    expect(mockRealtime.publishToLesson).toHaveBeenCalledWith(
      lessonId,
      'new_qa_message',
      expect.objectContaining({ isInstructorAnswer: true }),
    );

    // Thread author notified of answer
    expect(mockNotifications.createNotification).toHaveBeenCalledWith(
      studentId,
      'qa_reply',
      expect.objectContaining({ threadId: 'thread-1' }),
    );
  });
});
