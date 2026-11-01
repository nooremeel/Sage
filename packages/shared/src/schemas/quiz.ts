import { z } from 'zod';
import { QUESTION_TYPES } from '../constants.js';

export const quizOptionSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.number().int().min(0),
  text: z.object({
    ar: z.string().min(1).optional(),
    en: z.string().min(1).optional(),
  }).refine((val) => val.ar || val.en, {
    message: 'Option text must have at least Arabic or English content',
  }),
  isCorrect: z.boolean(),
});

export const quizQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.number().int().min(0),
  prompt: z.object({
    ar: z.string().min(1).optional(),
    en: z.string().min(1).optional(),
  }).refine((val) => val.ar || val.en, {
    message: 'Question prompt must have at least Arabic or English content',
  }),
  type: z.enum(QUESTION_TYPES).default('single_choice'),
  options: z.array(quizOptionSchema).min(2, { message: 'Each question must have at least 2 options' }),
});

export const createQuizSchema = z.object({
  lessonId: z.string().uuid({ message: 'Invalid lesson ID' }),
  title: z.object({
    ar: z.string().min(1).optional(),
    en: z.string().min(1).optional(),
  }).refine((val) => val.ar || val.en, {
    message: 'Title must have at least Arabic or English content',
  }),
  passingScore: z.number().int().min(1).max(100).default(80),
  maxAttempts: z.number().int().min(1).nullable().optional(),
  questions: z.array(quizQuestionSchema).min(1, { message: 'Quiz must contain at least 1 question' }),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;

export const submitQuizAttemptSchema = z.object({
  answers: z.record(z.string().uuid(), z.array(z.string().uuid())),
});

export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;

// Public Student Quiz DTO (Strict Anti-Leakage: NEVER includes isCorrect)
export const publicQuizOptionDtoSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  text: z.record(z.string()),
});

export const publicQuizQuestionDtoSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  prompt: z.record(z.string()),
  type: z.enum(QUESTION_TYPES),
  options: z.array(publicQuizOptionDtoSchema),
});

export const publicQuizDtoSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  title: z.record(z.string()),
  passingScore: z.number().int(),
  maxAttempts: z.number().int().nullable(),
  questions: z.array(publicQuizQuestionDtoSchema),
});

export type PublicQuizDto = z.infer<typeof publicQuizDtoSchema>;

export const quizAttemptResultDtoSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
  attemptNumber: z.number().int(),
  maxAttempts: z.number().int().nullable(),
  completedAt: z.string(),
});

export type QuizAttemptResultDto = z.infer<typeof quizAttemptResultDtoSchema>;

