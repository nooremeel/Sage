import { describe, it, expect } from 'vitest';
import {
  instructorAnalyticsDtoSchema,
  adminAnalyticsDtoSchema,
} from './analytics.js';

describe('Analytics Schemas', () => {
  describe('instructorAnalyticsDtoSchema', () => {
    it('validates a valid instructor analytics payload', () => {
      const payload = {
        totalCourses: 5,
        totalStudents: 120,
        totalCompletions: 45,
        averageRating: 4.85,
        recentEnrollments: [
          {
            courseTitle: 'Diwani Script Mastery',
            studentEmail: 'student@example.com',
            enrolledAt: '2026-11-01T10:00:00Z',
          },
        ],
      };

      const parsed = instructorAnalyticsDtoSchema.parse(payload);
      expect(parsed.totalCourses).toBe(5);
      expect(parsed.averageRating).toBe(4.85);
      expect(parsed.recentEnrollments).toHaveLength(1);
    });

    it('rejects negative metric numbers', () => {
      const payload = {
        totalCourses: -1,
        totalStudents: 10,
        totalCompletions: 2,
        averageRating: 4.5,
        recentEnrollments: [],
      };

      expect(() => instructorAnalyticsDtoSchema.parse(payload)).toThrow();
    });

    it('rejects average rating outside 0 to 5 bounds', () => {
      expect(() =>
        instructorAnalyticsDtoSchema.parse({
          totalCourses: 1,
          totalStudents: 1,
          totalCompletions: 1,
          averageRating: 5.5,
          recentEnrollments: [],
        }),
      ).toThrow();
    });
  });

  describe('adminAnalyticsDtoSchema', () => {
    it('validates a valid platform admin analytics summary', () => {
      const payload = {
        totalUsers: 1500,
        totalInstructors: 40,
        totalCourses: 85,
        totalEnrollments: 3200,
        totalCompletions: 1100,
      };

      const parsed = adminAnalyticsDtoSchema.parse(payload);
      expect(parsed.totalUsers).toBe(1500);
      expect(parsed.totalInstructors).toBe(40);
    });

    it('rejects missing required metrics or non-integers', () => {
      expect(() =>
        adminAnalyticsDtoSchema.parse({
          totalUsers: 100.5,
          totalInstructors: 10,
          totalCourses: 5,
          totalEnrollments: 20,
          totalCompletions: 5,
        }),
      ).toThrow();
    });
  });
});

