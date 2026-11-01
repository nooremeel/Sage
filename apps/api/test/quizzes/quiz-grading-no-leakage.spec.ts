import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { QuizzesService } from '../../src/modules/quizzes/quizzes.service.js';
import { quizzes, lessons, questions, options } from '../../src/db/schema/index.js';

describe('Quiz Builder, Anti-Leakage & Grading Suite', () => {
  let quizzesService: QuizzesService;
  let mockDb: any;

  const quizId = 'quiz-uuid-1';
  const lessonId = 'lesson-uuid-1';
  const question1Id = 'q-uuid-1';
  const opt1Id = 'opt-uuid-1';
  const opt2Id = 'opt-uuid-2';
  const userId = 'student-uuid-1';

  let attemptsList: any[] = [];
  let lessonProgressList: any[] = [];

  beforeEach(() => {
    attemptsList = [];
    lessonProgressList = [];

    mockDb = {
      select: (fields?: any) => ({
        from: (table: any) => ({
          where: (cond: any) => ({
            orderBy: () => [
              {
                id: question1Id,
                position: 0,
                prompt: { en: 'What is 2 + 2?' },
                type: 'single_choice',
              },
            ],
            then: (fn: any) =>
              fn([
                {
                  id: quizId,
                  lessonId,
                  title: { en: 'Math Quiz' },
                  passingScore: 80,
                  maxAttempts: 2,
                },
              ]),
            [Symbol.iterator]: function* () {
              // Check if selecting quiz
              yield {
                id: quizId,
                lessonId,
                title: { en: 'Math Quiz' },
                passingScore: 80,
                maxAttempts: 2,
              };
            },
          }),
          innerJoin: () => ({
            innerJoin: () => ({
              where: () => [
                {
                  lesson: { id: lessonId, isFreePreview: true },
                  course: { id: 'course-1', instructorId: 'inst-1' },
                },
              ],
            }),
          }),
        }),
      }),
      insert: (table: any) => ({
        values: (vals: any) => {
          if (vals.answers) {
            const attempt = {
              id: 'attempt-1',
              createdAt: new Date(),
              ...vals,
            };
            attemptsList.push(attempt);
            return {
              returning: () => [attempt],
            };
          }
          if (vals.lessonId) {
            lessonProgressList.push(vals);
            return {
              returning: () => [vals],
            };
          }
          return {
            returning: () => [{ id: 'new-id' }],
          };
        },
      }),
      update: (table: any) => ({
        set: (vals: any) => ({
          where: () => ({
            returning: () => [vals],
          }),
        }),
      }),
    };

    quizzesService = new QuizzesService(mockDb);
  });

  it('anti-leakage: public student quiz payload never contains isCorrect in options', async () => {
    mockDb.select = () => ({
      from: (table: any) => {
        if (table === lessons) {
          return {
            innerJoin: () => ({
              innerJoin: () => ({
                where: () => [
                  {
                    lesson: { id: lessonId, isFreePreview: true },
                    course: { id: 'course-1', instructorId: 'inst-1' },
                  },
                ],
              }),
            }),
          };
        }

        return {
          where: () => {
            let resultData: any[];
            if (table === quizzes) {
              resultData = [
                {
                  id: quizId,
                  lessonId,
                  title: { en: 'Math Quiz' },
                  passingScore: 80,
                  maxAttempts: 2,
                },
              ];
            } else if (table === questions) {
              resultData = [
                {
                  id: question1Id,
                  quizId,
                  position: 0,
                  prompt: { en: 'What is 2 + 2?' },
                  type: 'single_choice',
                },
              ];
            } else if (table === options) {
              resultData = [
                { id: opt1Id, position: 0, text: { en: '4' } },
                { id: opt2Id, position: 1, text: { en: '5' } },
              ];
            } else {
              resultData = [];
            }

            return {
              orderBy: () => resultData,
              then: (fn: any) => fn(resultData),
              [Symbol.iterator]: function* () {
                yield* resultData;
              },
            };
          },
        };
      },
    });

    const publicQuiz = await quizzesService.getQuizForStudent(userId, quizId);

    expect(publicQuiz).toBeDefined();
    expect(publicQuiz.questions).toHaveLength(1);
    for (const q of publicQuiz.questions) {
      for (const opt of q.options) {
        expect(opt).not.toHaveProperty('isCorrect');
      }
    }
  });

  it('grading: evaluates correct answer and marks attempt as passed with 100% score', async () => {
    // Mock questions and correct options for grading
    let selectCount = 0;
    mockDb.select = () => ({
      from: () => ({
        where: () => {
          selectCount++;
          if (selectCount === 1) {
            // Quiz
            return [
              {
                id: quizId,
                lessonId,
                passingScore: 80,
                maxAttempts: 2,
              },
            ];
          }
          if (selectCount === 2) {
            // Previous attempts
            return [];
          }
          if (selectCount === 3) {
            // Questions
            return [
              {
                id: question1Id,
                quizId,
              },
            ];
          }
          if (selectCount === 4) {
            // Options with isCorrect
            return [
              { id: opt1Id, questionId: question1Id, isCorrect: true },
              { id: opt2Id, questionId: question1Id, isCorrect: false },
            ];
          }
          // Progress check
          return [];
        },
      }),
    });

    const res = await quizzesService.submitQuizAttempt(userId, quizId, {
      answers: {
        [question1Id]: [opt1Id], // Correct option selected
      },
    });

    expect(res.score).toBe(100);
    expect(res.passed).toBe(true);
    expect(res.attemptNumber).toBe(1);
    expect(lessonProgressList).toHaveLength(1);
    expect(lessonProgressList[0].completedAt).toBeDefined();
  });

  it('grading: rejects attempt if max attempts limit is exceeded', async () => {
    let selectCount = 0;
    mockDb.select = () => ({
      from: () => ({
        where: () => {
          selectCount++;
          if (selectCount === 1) {
            // Quiz with maxAttempts: 1
            return [
              {
                id: quizId,
                lessonId,
                passingScore: 80,
                maxAttempts: 1,
              },
            ];
          }
          // Already has 1 attempt
          return [{ id: 'prev-attempt-1' }];
        },
      }),
    });

    await expect(
      quizzesService.submitQuizAttempt(userId, quizId, {
        answers: {},
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
