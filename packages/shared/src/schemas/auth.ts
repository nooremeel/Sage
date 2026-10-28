import { z } from 'zod';
import { LOCALES, USER_ROLES } from '../constants.js';

export const SignupSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['student', 'instructor']).default('student'),
  locale: z.enum(LOCALES).default('en'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type SignupRawInput = z.input<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const UpdateProfileSchema = z.object({
  locale: z.enum(LOCALES).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export interface AuthUserDto {
  id: string;
  email: string;
  role: (typeof USER_ROLES)[number];
  locale: (typeof LOCALES)[number];
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface AuthResponseDto {
  user: AuthUserDto;
}
