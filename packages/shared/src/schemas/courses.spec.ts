import { describe, it, expect } from 'vitest';
import {
  LocalizedTitleSchema,
  CreateCourseSchema,
  CreateSectionSchema,
  CreateLessonSchema,
  ReorderSectionsSchema,
  ReviewCourseSchema,
  searchCoursesSchema,
} from './courses.js';

describe('Course Schemas', () => {
  describe('LocalizedTitleSchema', () => {
    it('accepts title with Arabic only', () => {
      expect(LocalizedTitleSchema.parse({ ar: 'مقدمة في البرمجة' })).toEqual({
        ar: 'مقدمة في البرمجة',
      });
    });

    it('accepts title with English only', () => {
      expect(LocalizedTitleSchema.parse({ en: 'Intro to Programming' })).toEqual({
        en: 'Intro to Programming',
      });
    });

    it('accepts title with both languages', () => {
      expect(
        LocalizedTitleSchema.parse({
          ar: 'مقدمة',
          en: 'Introduction',
        }),
      ).toEqual({
        ar: 'مقدمة',
        en: 'Introduction',
      });
    });

    it('rejects title if both ar and en are empty or missing', () => {
      expect(() => LocalizedTitleSchema.parse({})).toThrow();
    });
  });

  describe('CreateCourseSchema', () => {
    it('validates a complete bilingual course creation payload', () => {
      const valid = {
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        level: 'intermediate',
        priceCents: 4900,
        currency: 'USD',
        primaryLocale: 'ar',
        translations: [
          {
            locale: 'ar',
            title: 'دورة قواعد البيانات المتقدمة',
            subtitle: 'تصميم وبناء نظم تخزين قابلة للتوسع',
            description: 'دورة تطبيقية شاملة تتناول هندسة واستعلامات قواعد البيانات.',
            slug: 'advanced-databases-ar',
          },
          {
            locale: 'en',
            title: 'Advanced Database Systems',
            subtitle: 'Designing scalable storage architectures',
            description: 'Comprehensive practical course covering relational and serverless data storage.',
            slug: 'advanced-databases',
          },
        ],
      };

      const parsed = CreateCourseSchema.parse(valid);
      expect(parsed.level).toBe('intermediate');
      expect(parsed.translations).toHaveLength(2);
    });

    it('rejects invalid slug format', () => {
      expect(() =>
        CreateCourseSchema.parse({
          categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          translations: [
            {
              locale: 'en',
              title: 'Test Course',
              description: 'Valid description text here...',
              slug: 'Invalid Slug with Spaces',
            },
          ],
        }),
      ).toThrow();
    });
  });

  describe('Section & Lesson Schemas', () => {
    it('validates section creation', () => {
      const section = CreateSectionSchema.parse({
        title: { en: 'Module 1: Foundations' },
      });
      expect(section.title.en).toBe('Module 1: Foundations');
    });

    it('validates lesson creation with defaults', () => {
      const lesson = CreateLessonSchema.parse({
        title: { en: 'Lesson 1: Overview', ar: 'الدرس الأول: نظرة عامة' },
        type: 'video',
        isFreePreview: true,
      });
      expect(lesson.durationSec).toBe(0);
      expect(lesson.isFreePreview).toBe(true);
    });

    it('validates section reordering', () => {
      const reorder = ReorderSectionsSchema.parse({
        sectionIds: [
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        ],
      });
      expect(reorder.sectionIds).toHaveLength(2);
    });

    it('validates admin review decision', () => {
      const review = ReviewCourseSchema.parse({
        action: 'approve',
      });
      expect(review.action).toBe('approve');
    });
  });

  describe('Search & Keyset Pagination Schemas', () => {
    it('parses valid search query with default pagination', () => {
      const result = searchCoursesSchema.parse({
        q: 'nest js',
        level: 'intermediate',
        price: 'free',
      });
      expect(result.q).toBe('nest js');
      expect(result.level).toBe('intermediate');
      expect(result.price).toBe('free');
      expect(result.limit).toBe(20);
      expect(result.locale).toBe('en');
    });

    it('accepts cursor and trims query string', () => {
      const result = searchCoursesSchema.parse({
        q: '   برمجة متقدمة   ',
        cursor: '2026-10-28T18:00:00.000Z_uuid123',
        limit: '15',
        locale: 'ar',
      });
      expect(result.q).toBe('برمجة متقدمة');
      expect(result.cursor).toBe('2026-10-28T18:00:00.000Z_uuid123');
      expect(result.limit).toBe(15);
      expect(result.locale).toBe('ar');
    });

    it('clamps limit to maximum 50', () => {
      expect(() =>
        searchCoursesSchema.parse({
          limit: 100,
        }),
      ).toThrow();
    });
  });
});


