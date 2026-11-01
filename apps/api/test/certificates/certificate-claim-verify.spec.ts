import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CertificatesService } from '../../src/modules/certificates/certificates.service.js';
import { certificates, enrollments, courses, courseTranslations, users } from '../../src/db/schema/index.js';
import { AppErrorCode } from '@sage/shared';

describe('Certificate Issuance & Public Verification Suite', () => {
  let certificatesService: CertificatesService;
  let mockDb: any;
  let mockProgressService: any;

  const studentId = 'student-uuid-1';
  const courseId = 'course-uuid-1';
  const instructorId = 'inst-uuid-1';

  let enrollmentsList: any[] = [];
  let certificatesList: any[] = [];

  beforeEach(() => {
    enrollmentsList = [{ id: 'enr-1', userId: studentId, courseId }];
    certificatesList = [];

    mockProgressService = {
      getCourseProgress: vi.fn().mockResolvedValue({
        courseId,
        totalLessons: 5,
        completedLessons: 5,
        percent: 100,
        completedLessonIds: ['l1', 'l2', 'l3', 'l4', 'l5'],
      }),
    };

    mockDb = {
      select: () => ({
        from: (table: any) => ({
          where: () => {
            if (table === enrollments) {
              return enrollmentsList;
            }
            if (table === certificates) {
              return certificatesList;
            }
            if (table === courses) {
              return [{ id: courseId, instructorId }];
            }
            if (table === users) {
              return [{ id: studentId, email: 'zaid@example.com', role: 'student' }];
            }
            if (table === courseTranslations) {
              return [
                { locale: 'ar', title: 'دورة هندسة النظم' },
                { locale: 'en', title: 'Systems Engineering' },
              ];
            }
            return [];
          },
        }),
      }),
      insert: (table: any) => ({
        values: (vals: any) => {
          const rec = {
            id: 'cert-1',
            issuedAt: new Date(),
            ...vals,
          };
          certificatesList.push(rec);
          return {
            returning: () => [rec],
          };
        },
      }),
    };

    certificatesService = new CertificatesService(mockDb, mockProgressService);
  });

  it('rejects certificate claim if student is not enrolled', async () => {
    enrollmentsList = [];

    await expect(
      certificatesService.claimCertificate(studentId, courseId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects certificate claim if course progress is below 100%', async () => {
    mockProgressService.getCourseProgress.mockResolvedValueOnce({
      courseId,
      totalLessons: 5,
      completedLessons: 4,
      percent: 80,
    });

    await expect(
      certificatesService.claimCertificate(studentId, courseId),
    ).rejects.toThrow(BadRequestException);
  });

  it('successfully claims certificate and generates human-readable serial', async () => {
    const cert = await certificatesService.claimCertificate(studentId, courseId);

    expect(cert).toBeDefined();
    expect(cert.serial).toMatch(/^SAGE-\d{4}-[A-Z0-9]{6}$/);
    expect(cert.studentName).toBe('zaid');
    expect(cert.courseTitle.en).toBe('Systems Engineering');
  });

  it('is idempotent: subsequent claims return the existing certificate', async () => {
    const first = await certificatesService.claimCertificate(studentId, courseId);
    const second = await certificatesService.claimCertificate(studentId, courseId);

    expect(first.serial).toBe(second.serial);
  });

  it('publicly verifies valid certificate by serial', async () => {
    const cert = await certificatesService.claimCertificate(studentId, courseId);

    const verified = await certificatesService.verifyCertificate(cert.serial);

    expect(verified.isValid).toBe(true);
    expect(verified.serial).toBe(cert.serial);
    expect(verified.studentName).toBe('zaid');
  });

  it('throws NotFoundException for non-existent certificate serial', async () => {
    await expect(
      certificatesService.verifyCertificate('SAGE-2026-INVALID'),
    ).rejects.toThrow(NotFoundException);
  });
});

