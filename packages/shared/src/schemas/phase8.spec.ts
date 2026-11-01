import { describe, it, expect } from 'vitest';
import {
  claimCertificateSchema,
  publicCertificateVerificationDtoSchema,
} from './certificates.js';
import { createReviewSchema, reviewDtoSchema } from './reviews.js';
import { instructorAnalyticsDtoSchema } from './analytics.js';

describe('Phase 8 Shared Schemas', () => {
  describe('Certificates Schemas', () => {
    it('validates claim certificate input with UUID', () => {
      const valid = claimCertificateSchema.safeParse({
        courseId: '018f2f45-6677-7890-a123-456789abcdef',
      });
      expect(valid.success).toBe(true);

      const invalid = claimCertificateSchema.safeParse({
        courseId: 'not-a-uuid',
      });
      expect(invalid.success).toBe(false);
    });

    it('validates public verification DTO', () => {
      const dto = {
        serial: 'SAGE-2026-X987K2',
        studentName: 'Zaid Al-Harbi',
        courseTitle: { ar: 'مقدمة في الذكاء الاصطناعي', en: 'Intro to AI' },
        instructorName: 'Nour Emil',
        issuedAt: new Date().toISOString(),
        isValid: true,
      };
      const res = publicCertificateVerificationDtoSchema.safeParse(dto);
      expect(res.success).toBe(true);
    });
  });

  describe('Reviews Schemas', () => {
    it('validates review rating bounds (1 to 5)', () => {
      expect(createReviewSchema.safeParse({ rating: 5, comment: 'Excellent course!' }).success).toBe(true);
      expect(createReviewSchema.safeParse({ rating: 1 }).success).toBe(true);
      expect(createReviewSchema.safeParse({ rating: 0 }).success).toBe(false);
      expect(createReviewSchema.safeParse({ rating: 6 }).success).toBe(false);
    });

    it('validates review DTO format', () => {
      const dto = {
        id: '018f2f45-6677-7890-a123-456789abcdef',
        userId: '018f2f45-6677-7890-a123-456789abcde0',
        userName: 'Ahmad',
        courseId: '018f2f45-6677-7890-a123-456789abcde1',
        rating: 5,
        comment: 'Very informative lecture series.',
        createdAt: new Date().toISOString(),
      };
      expect(reviewDtoSchema.safeParse(dto).success).toBe(true);
    });
  });

  describe('Analytics Schemas', () => {
    it('validates instructor analytics structure', () => {
      const dto = {
        totalCourses: 3,
        totalStudents: 150,
        totalCompletions: 45,
        averageRating: 4.8,
        recentEnrollments: [
          {
            courseTitle: 'Next.js & NestJS Architecture',
            studentEmail: 'student@example.com',
            enrolledAt: new Date().toISOString(),
          },
        ],
      };
      expect(instructorAnalyticsDtoSchema.safeParse(dto).success).toBe(true);
    });
  });
});

