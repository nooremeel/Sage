import { describe, it, expect } from 'vitest';
import {
  progressHeartbeatSchema,
  lessonProgressDtoSchema,
  courseProgressDtoSchema,
  continueLearningItemDtoSchema,
} from './progress.js';

describe('Progress Schemas', () => {
  describe('progressHeartbeatSchema', () => {
    it('validates a valid heartbeat event with position', () => {
      const payload = {
        lessonId: '12345678-1234-1234-1234-123456789abc',
        positionSec: 145,
        durationSec: 600,
        completed: false,
      };

      const parsed = progressHeartbeatSchema.parse(payload);
      expect(parsed.positionSec).toBe(145);
      expect(parsed.durationSec).toBe(600);
      expect(parsed.completed).toBe(false);
    });

    it('rejects negative positions', () => {
      expect(() =>
        progressHeartbeatSchema.parse({
          lessonId: '12345678-1234-1234-1234-123456789abc',
          positionSec: -5,
        }),
      ).toThrow();
    });

    it('rejects invalid uuid in lessonId', () => {
      expect(() =>
        progressHeartbeatSchema.parse({
          lessonId: 'invalid-id',
          positionSec: 30,
        }),
      ).toThrow();
    });
  });

  describe('lessonProgressDtoSchema', () => {
    it('validates lesson progress DTO', () => {
      const dto = lessonProgressDtoSchema.parse({
        userId: '11111111-1111-1111-1111-111111111111',
        lessonId: '22222222-2222-2222-2222-222222222222',
        positionSec: 300,
        completedAt: '2026-11-06T12:00:00Z',
        updatedAt: '2026-11-06T12:00:00Z',
      });
      expect(dto.positionSec).toBe(300);
      expect(dto.completedAt).toBeDefined();
    });
  });

  describe('courseProgressDtoSchema', () => {
    it('validates course percent calculation within 0-100 bounds', () => {
      const valid = {
        courseId: '12345678-1234-1234-1234-123456789abc',
        totalLessons: 10,
        completedLessons: 7,
        percent: 70,
        completedLessonIds: [
          '11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222222',
        ],
        lastAccessedLessonId: '22222222-2222-2222-2222-222222222222',
      };

      const parsed = courseProgressDtoSchema.parse(valid);
      expect(parsed.percent).toBe(70);
      expect(parsed.completedLessons).toBe(7);
    });

    it('rejects percentage higher than 100', () => {
      expect(() =>
        courseProgressDtoSchema.parse({
          courseId: '12345678-1234-1234-1234-123456789abc',
          totalLessons: 10,
          completedLessons: 11,
          percent: 110,
          completedLessonIds: [],
          lastAccessedLessonId: null,
        }),
      ).toThrow();
    });
  });

  describe('continueLearningItemDtoSchema', () => {
    it('validates bilingual course title and resume targets', () => {
      const item = {
        courseId: '12345678-1234-1234-1234-123456789abc',
        courseSlug: 'thuluth-calligraphy-advanced',
        courseTitle: {
          ar: 'فن خط الثلث المتقدم',
          en: 'Advanced Thuluth Calligraphy',
        },
        percent: 45,
        nextLessonId: '98765432-4321-4321-4321-cba987654321',
        nextLessonTitle: {
          ar: 'حرف الألف واللام المركب',
          en: 'Connected Alef and Lam',
        },
        lastAccessedAt: '2026-11-06T18:00:00Z',
      };

      const parsed = continueLearningItemDtoSchema.parse(item);
      expect(parsed.courseSlug).toBe('thuluth-calligraphy-advanced');
      expect(parsed.percent).toBe(45);
    });
  });
});
