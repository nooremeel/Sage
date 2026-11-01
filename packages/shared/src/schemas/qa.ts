import { z } from 'zod';

export const createQAThreadSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters' })
    .max(200, { message: 'Title must not exceed 200 characters' }),
  content: z
    .string()
    .min(5, { message: 'Content must be at least 5 characters' })
    .max(5000, { message: 'Content must not exceed 5000 characters' }),
});

export type CreateQAThreadInput = z.infer<typeof createQAThreadSchema>;

export const createQAMessageSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Message content cannot be empty' })
    .max(5000, { message: 'Message must not exceed 5000 characters' }),
});

export type CreateQAMessageInput = z.infer<typeof createQAMessageSchema>;

export const qaMessageDtoSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string(),
  authorRole: z.string(),
  content: z.string(),
  isInstructorAnswer: z.boolean(),
  createdAt: z.string(),
});

export type QAMessageDto = z.infer<typeof qaMessageDtoSchema>;

export const qaThreadDtoSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string(),
  title: z.string(),
  content: z.string(),
  messagesCount: z.number().int().min(0),
  hasInstructorAnswer: z.boolean(),
  createdAt: z.string(),
  messages: z.array(qaMessageDtoSchema).optional(),
});

export type QAThreadDto = z.infer<typeof qaThreadDtoSchema>;
