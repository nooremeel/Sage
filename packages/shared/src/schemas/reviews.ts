import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .min(3, 'Comment must be at least 3 characters')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  courseId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

export type ReviewDto = z.infer<typeof reviewDtoSchema>;

export const courseReviewsResponseDtoSchema = z.object({
  reviews: z.array(reviewDtoSchema),
  totalCount: z.number().int().min(0),
  averageRating: z.number().min(0).max(5),
});

export type CourseReviewsResponseDto = z.infer<
  typeof courseReviewsResponseDtoSchema
>;

