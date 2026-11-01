import { describe, it, expect } from 'vitest';
import {
  freeEnrollmentSchema,
  couponEnrollmentSchema,
  createCouponSchema,
} from './enrollment.js';
import { progressHeartbeatSchema } from './progress.js';
import {
  createQuizSchema,
  submitQuizAttemptSchema,
  publicQuizDtoSchema,
} from './quiz.js';

describe('Phase 6 Shared Schemas', () => {
  describe('Enrollment Schemas', () => {
    it('validates free enrollment input', () => {
      const valid = freeEnrollmentSchema.safeParse({
        courseId: '018f2f45-6677-7890-a123-456789abcdef',
      });
      expect(valid.success).toBe(true);

      const invalid = freeEnrollmentSchema.safeParse({
        courseId: 'not-a-uuid',
      });
      expect(invalid.success).toBe(false);
    });

    it('transforms coupon code to uppercase trimmed', () => {
      const res = couponEnrollmentSchema.parse({
        courseId: '018f2f45-6677-7890-a123-456789abcdef',
        code: '  save100  ',
      });
      expect(res.code).toBe('SAVE100');
    });

    it('validates create coupon schema', () => {
      const res = createCouponSchema.parse({
        code: 'sage-launch',
        discountType: 'percentage',
        discountValue: 100,
        maxRedemptions: 10,
      });
      expect(res.code).toBe('SAGE-LAUNCH');
      expect(res.discountValue).toBe(100);
    });
  });

  describe('Progress Schemas', () => {
    it('validates progress heartbeat input', () => {
      const res = progressHeartbeatSchema.safeParse({
        lessonId: '018f2f45-6677-7890-a123-456789abcdef',
        positionSec: 15,
        durationSec: 60,
      });
      expect(res.success).toBe(true);
    });

    it('rejects negative position in heartbeat', () => {
      const res = progressHeartbeatSchema.safeParse({
        lessonId: '018f2f45-6677-7890-a123-456789abcdef',
        positionSec: -5,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('Quiz Schemas', () => {
    it('validates quiz creation with questions and options', () => {
      const input = {
        lessonId: '018f2f45-6677-7890-a123-456789abcdef',
        title: { ar: 'اختبار الفصل الأول', en: 'Chapter 1 Quiz' },
        passingScore: 80,
        maxAttempts: 3,
        questions: [
          {
            position: 0,
            prompt: { ar: 'ما هو PostgreSQL؟', en: 'What is PostgreSQL?' },
            type: 'single_choice' as const,
            options: [
              { position: 0, text: { en: 'Relational Database' }, isCorrect: true },
              { position: 1, text: { en: 'Document Store' }, isCorrect: false },
            ],
          },
        ],
      };
      const res = createQuizSchema.safeParse(input);
      expect(res.success).toBe(true);
    });

    it('validates quiz submission answers', () => {
      const input = {
        answers: {
          '018f2f45-6677-7890-a123-456789abcdef': [
            '018f2f45-6677-7890-a123-456789abcde0',
          ],
        },
      };
      const res = submitQuizAttemptSchema.safeParse(input);
      expect(res.success).toBe(true);
    });

    it('ensures publicQuizDtoSchema excludes isCorrect', () => {
      const publicDto = {
        id: '018f2f45-6677-7890-a123-456789abcdef',
        lessonId: '018f2f45-6677-7890-a123-456789abcde1',
        title: { en: 'Intro Quiz' },
        passingScore: 80,
        maxAttempts: 3,
        questions: [
          {
            id: '018f2f45-6677-7890-a123-456789abcde2',
            position: 0,
            prompt: { en: 'Question 1' },
            type: 'single_choice' as const,
            options: [
              {
                id: '018f2f45-6677-7890-a123-456789abcde3',
                position: 0,
                text: { en: 'Option 1' },
              },
            ],
          },
        ],
      };
      const parsed = publicQuizDtoSchema.parse(publicDto);
      expect(parsed.questions[0]!.options[0]).not.toHaveProperty('isCorrect');
    });
  });
});
