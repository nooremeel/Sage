import { describe, it, expect } from 'vitest';
import {
  createQAThreadSchema,
  createQAMessageSchema,
  qaThreadDtoSchema,
} from './qa.js';
import { notificationDtoSchema } from './notifications.js';

describe('Phase 7 Shared Schemas', () => {
  describe('Q&A Schemas', () => {
    it('validates thread creation input', () => {
      const valid = createQAThreadSchema.safeParse({
        title: 'How does HLS adaptive bitrate work?',
        content: 'I noticed the player has 360p and 720p options in the dropdown.',
      });
      expect(valid.success).toBe(true);

      const tooShort = createQAThreadSchema.safeParse({
        title: 'Hi',
        content: 'Help',
      });
      expect(tooShort.success).toBe(false);
    });

    it('validates reply message input', () => {
      const valid = createQAMessageSchema.safeParse({
        content: 'HLS uses multiple playlists defined in a master playlist.',
      });
      expect(valid.success).toBe(true);

      const empty = createQAMessageSchema.safeParse({
        content: '',
      });
      expect(empty.success).toBe(false);
    });

    it('validates QA thread DTO shape', () => {
      const dto = {
        id: '018f2f45-6677-7890-a123-456789abcdef',
        lessonId: '018f2f45-6677-7890-a123-456789abcde0',
        authorId: '018f2f45-6677-7890-a123-456789abcde1',
        authorName: 'Ahmad Al-Khatib',
        title: 'Question title',
        content: 'Question details here',
        messagesCount: 2,
        hasInstructorAnswer: true,
        createdAt: new Date().toISOString(),
      };
      const res = qaThreadDtoSchema.safeParse(dto);
      expect(res.success).toBe(true);
    });
  });

  describe('Notification Schemas', () => {
    it('validates notification DTO shape', () => {
      const dto = {
        id: '018f2f45-6677-7890-a123-456789abcdef',
        userId: '018f2f45-6677-7890-a123-456789abcde0',
        type: 'qa_reply',
        payload: {
          threadId: '018f2f45-6677-7890-a123-456789abcde1',
          authorName: 'Instructor Nour',
          textSnippet: 'Great question! Here is how it works...',
        },
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      const res = notificationDtoSchema.safeParse(dto);
      expect(res.success).toBe(true);
    });
  });
});

