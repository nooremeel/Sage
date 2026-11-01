import { z } from 'zod';

export const instructorAnalyticsDtoSchema = z.object({
  totalCourses: z.number().int().min(0),
  totalStudents: z.number().int().min(0),
  totalCompletions: z.number().int().min(0),
  averageRating: z.number().min(0).max(5),
  recentEnrollments: z.array(
    z.object({
      courseTitle: z.string(),
      studentEmail: z.string(),
      enrolledAt: z.string(),
    }),
  ),
});

export type InstructorAnalyticsDto = z.infer<
  typeof instructorAnalyticsDtoSchema
>;

export const adminAnalyticsDtoSchema = z.object({
  totalUsers: z.number().int().min(0),
  totalInstructors: z.number().int().min(0),
  totalCourses: z.number().int().min(0),
  totalEnrollments: z.number().int().min(0),
  totalCompletions: z.number().int().min(0),
});

export type AdminAnalyticsDto = z.infer<typeof adminAnalyticsDtoSchema>;

