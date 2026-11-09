import { describe, it, expect } from 'vitest';
import { AppErrorCode, ApiErrorResponse } from './errors.js';

describe('AppErrorCode & ApiErrorResponse', () => {
  it('contains expected authentication and authorization error codes', () => {
    expect(AppErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(AppErrorCode.FORBIDDEN).toBe('FORBIDDEN');
    expect(AppErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
    expect(AppErrorCode.REFRESH_TOKEN_REUSE).toBe('REFRESH_TOKEN_REUSE');
    expect(AppErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
  });

  it('contains expected domain specific error codes', () => {
    expect(AppErrorCode.COURSE_NOT_FOUND).toBe('COURSE_NOT_FOUND');
    expect(AppErrorCode.LESSON_NOT_FOUND).toBe('LESSON_NOT_FOUND');
    expect(AppErrorCode.NOT_ENROLLED).toBe('NOT_ENROLLED');
    expect(AppErrorCode.MEDIA_NOT_READY).toBe('MEDIA_NOT_READY');
    expect(AppErrorCode.COUPON_EXPIRED).toBe('COUPON_EXPIRED');
  });

  it('allows structured ApiErrorResponse formatting', () => {
    const error: ApiErrorResponse = {
      message: 'Resource not found',
      code: AppErrorCode.NOT_FOUND,
      statusCode: 404,
      timestamp: '2026-11-06T12:00:00Z',
      path: '/api/courses/not-found',
    };

    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });
});

