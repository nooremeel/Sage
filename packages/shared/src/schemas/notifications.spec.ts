import { describe, it, expect } from 'vitest';
import {
  notificationDtoSchema,
  NOTIFICATION_TYPES,
} from './notifications.js';

describe('Notifications Schemas', () => {
  it('exposes defined canonical notification types', () => {
    expect(NOTIFICATION_TYPES).toContain('qa_reply');
    expect(NOTIFICATION_TYPES).toContain('course_published');
    expect(NOTIFICATION_TYPES).toContain('quiz_graded');
    expect(NOTIFICATION_TYPES).toContain('announcement');
  });

  it('validates a well-formed notification dto', () => {
    const valid = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      type: 'qa_reply',
      payload: {
        threadId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        authorName: 'Master Calligrapher',
        snippet: 'Remember to keep 70-degree pen angle',
      },
      readAt: null,
      createdAt: '2026-11-05T14:30:00Z',
    };

    const parsed = notificationDtoSchema.parse(valid);
    expect(parsed.id).toBe(valid.id);
    expect(parsed.readAt).toBeNull();
    expect(parsed.payload['authorName']).toBe('Master Calligrapher');
  });

  it('rejects notifications with invalid uuid identifiers', () => {
    const invalid = {
      id: 'not-a-valid-uuid',
      userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      type: 'announcement',
      payload: {},
      readAt: null,
      createdAt: '2026-11-05T14:30:00Z',
    };

    expect(() => notificationDtoSchema.parse(invalid)).toThrow();
  });
});

