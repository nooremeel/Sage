import { describe, it, expect } from 'vitest';
import {
  quizOptionSchema,
  quizQuestionSchema,
  createQuizSchema,
  submitQuizAttemptSchema,
  publicQuizDtoSchema,
  quizAttemptResultDtoSchema,
} from './quiz.js';

describe('Quiz Schemas', () => {
  describe('quizOptionSchema & quizQuestionSchema', () => {
    it('validates a bilingual option with correct flag', () => {
      const option = {
        position: 0,
        text: {
          ar: 'زاوية 70 درجة',
          en: '70-degree angle',
        },
        isCorrect: true,
      };

      const parsed = quizOptionSchema.parse(option);
      expect(parsed.isCorrect).toBe(true);
      expect(parsed.position).toBe(0);
    });

    it('rejects an option missing both Arabic and English text', () => {
      expect(() =>
        quizOptionSchema.parse({
          position: 0,
          text: {},
          isCorrect: false,
        }),
      ).toThrow(/Option text must have at least Arabic or English content/);
    });

    it('rejects a question with fewer than 2 options', () => {
      expect(() =>
        quizQuestionSchema.parse({
          position: 0,
          prompt: { en: 'What is the standard ink recipe?' },
          type: 'single_choice',
          options: [
            {
              position: 0,
              text: { en: 'Soot and gum arabic' },
              isCorrect: true,
            },
          ],
        }),
      ).toThrow(/Each question must have at least 2 options/);
    });
  });

  describe('createQuizSchema', () => {
    it('applies default passing score of 80 when omitted', () => {
      const quiz = createQuizSchema.parse({
        lessonId: '12345678-1234-1234-1234-123456789abc',
        title: { en: 'Mastery Assessment' },
        questions: [
          {
            position: 0,
            prompt: { en: 'Is Thuluth the mother of scripts?' },
            type: 'single_choice',
            options: [
              { position: 0, text: { en: 'Yes' }, isCorrect: true },
              { position: 1, text: { en: 'No' }, isCorrect: false },
            ],
          },
        ],
      });

      expect(quiz.passingScore).toBe(80);
      expect(quiz.questions).toHaveLength(1);
    });

    it('rejects passing scores outside 1-100 range', () => {
      expect(() =>
        createQuizSchema.parse({
          lessonId: '12345678-1234-1234-1234-123456789abc',
          title: { en: 'Invalid Quiz' },
          passingScore: 105,
          questions: [
            {
              position: 0,
              prompt: { en: 'Q1' },
              options: [
                { position: 0, text: { en: 'A' }, isCorrect: true },
                { position: 1, text: { en: 'B' }, isCorrect: false },
              ],
            },
          ],
        }),
      ).toThrow();
    });
  });

  describe('submitQuizAttemptSchema', () => {
    it('validates selected answers map with question and option uuids', () => {
      const qId = '11111111-1111-1111-1111-111111111111';
      const optId = '22222222-2222-2222-2222-222222222222';
      const submission = submitQuizAttemptSchema.parse({
        answers: {
          [qId]: [optId],
        },
      });

      expect(submission.answers[qId]).toContain(optId);
    });
  });

  describe('Anti-Leakage DTOs', () => {
    it('validates public quiz DTO without isCorrect exposure', () => {
      const publicQuiz = publicQuizDtoSchema.parse({
        id: '12345678-1234-1234-1234-123456789abc',
        lessonId: '87654321-4321-4321-4321-cba987654321',
        title: { en: 'Public Exam' },
        passingScore: 80,
        maxAttempts: 3,
        questions: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            position: 0,
            prompt: { en: 'Question 1' },
            type: 'single_choice',
            options: [
              {
                id: '22222222-2222-2222-2222-222222222222',
                position: 0,
                text: { en: 'Choice A' },
              },
              {
                id: '33333333-3333-3333-3333-333333333333',
                position: 1,
                text: { en: 'Choice B' },
              },
            ],
          },
        ],
      });

      expect(publicQuiz.passingScore).toBe(80);
      expect(publicQuiz.questions[0]?.options[0]).not.toHaveProperty('isCorrect');
    });

    it('validates quiz attempt result dto', () => {
      const result = quizAttemptResultDtoSchema.parse({
        id: '12345678-1234-1234-1234-123456789abc',
        quizId: '87654321-4321-4321-4321-cba987654321',
        score: 95,
        passed: true,
        attemptNumber: 1,
        maxAttempts: 3,
        completedAt: '2026-11-06T12:00:00Z',
      });

      expect(result.passed).toBe(true);
      expect(result.score).toBe(95);
    });
  });
});

