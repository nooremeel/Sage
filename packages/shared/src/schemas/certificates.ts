import { z } from 'zod';

export const claimCertificateSchema = z.object({
  courseId: z.string().uuid({ message: 'Invalid course ID' }),
});

export type ClaimCertificateInput = z.infer<typeof claimCertificateSchema>;

export const certificateDtoSchema = z.object({
  id: z.string().uuid(),
  serial: z.string(),
  userId: z.string().uuid(),
  studentName: z.string(),
  courseId: z.string().uuid(),
  courseTitle: z.record(z.string()),
  instructorName: z.string(),
  issuedAt: z.string(),
});

export type CertificateDto = z.infer<typeof certificateDtoSchema>;

export const publicCertificateVerificationDtoSchema = z.object({
  serial: z.string(),
  studentName: z.string(),
  courseTitle: z.record(z.string()),
  instructorName: z.string(),
  issuedAt: z.string(),
  isValid: z.boolean(),
});

export type PublicCertificateVerificationDto = z.infer<
  typeof publicCertificateVerificationDtoSchema
>;
