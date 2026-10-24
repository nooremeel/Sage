import { describe, it, expect } from 'vitest';
import { validateEnv } from './env.js';

describe('validateEnv', () => {
  it('validates a valid environment with defaults', () => {
    const raw = {
      DATABASE_URL: 'postgresql://sage_user:sage_password@localhost:5432/sage_db',
    };
    const env = validateEnv(raw);
    expect(env.DATABASE_URL).toBe(raw.DATABASE_URL);
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.REDIS_PROVIDER).toBe('local');
  });

  it('throws an error if required DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL is required/);
  });
});
