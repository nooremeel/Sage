import { describe, it, expect } from 'vitest';
import {
  SignupSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  UpdateProfileSchema,
} from './auth.js';

describe('Auth Schemas', () => {
  describe('SignupSchema', () => {
    it('validates valid signup payload', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        locale: 'ar',
      };
      const parsed = SignupSchema.parse(data);
      expect(parsed.email).toBe('test@example.com');
      expect(parsed.role).toBe('student');
      expect(parsed.locale).toBe('ar');
    });

    it('applies defaults for role and locale', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      const parsed = SignupSchema.parse(data);
      expect(parsed.role).toBe('student');
      expect(parsed.locale).toBe('en');
    });

    it('rejects invalid email and short password', () => {
      expect(() =>
        SignupSchema.parse({
          email: 'not-an-email',
          password: 'short',
        }),
      ).toThrow();
    });

    it('disallows admin role on signup', () => {
      expect(() =>
        SignupSchema.parse({
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin',
        }),
      ).toThrow();
    });
  });

  describe('LoginSchema', () => {
    it('validates email and password presence', () => {
      const parsed = LoginSchema.parse({
        email: 'user@example.com',
        password: 'secretpassword',
      });
      expect(parsed.email).toBe('user@example.com');
    });

    it('rejects empty password', () => {
      expect(() =>
        LoginSchema.parse({
          email: 'user@example.com',
          password: '',
        }),
      ).toThrow();
    });
  });

  describe('ForgotPasswordSchema & ResetPasswordSchema', () => {
    it('validates email in ForgotPasswordSchema', () => {
      expect(ForgotPasswordSchema.parse({ email: 'user@test.com' })).toEqual({
        email: 'user@test.com',
      });
    });

    it('validates ResetPasswordSchema', () => {
      expect(
        ResetPasswordSchema.parse({
          token: 'valid-token',
          newPassword: 'new-password-123',
        }),
      ).toEqual({
        token: 'valid-token',
        newPassword: 'new-password-123',
      });
    });
  });

  describe('VerifyEmailSchema & UpdateProfileSchema', () => {
    it('validates VerifyEmailSchema', () => {
      expect(VerifyEmailSchema.parse({ token: 'xyz123' })).toEqual({
        token: 'xyz123',
      });
    });

    it('validates UpdateProfileSchema', () => {
      expect(UpdateProfileSchema.parse({ locale: 'ar' })).toEqual({
        locale: 'ar',
      });
      expect(UpdateProfileSchema.parse({})).toEqual({});
    });
  });
});
