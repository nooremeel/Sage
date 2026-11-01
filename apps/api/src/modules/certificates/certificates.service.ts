import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  certificates,
  enrollments,
  courses,
  courseTranslations,
  users,
} from '../../db/schema/index.js';
import { ProgressService } from '../progress/progress.service.js';
import {
  type CertificateDto,
  type PublicCertificateVerificationDto,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class CertificatesService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    private readonly progressService: ProgressService,
  ) {}

  async claimCertificate(userId: string, courseId: string): Promise<CertificateDto> {
    // 1. Verify enrollment
    const [enrollment] = await this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

    if (!enrollment) {
      const err = new ForbiddenException('User is not enrolled in this course');
      (err as any).code = AppErrorCode.NOT_ENROLLED;
      throw err;
    }

    // 2. Verify 100% course completion
    const courseProgress = await this.progressService.getCourseProgress(userId, courseId);
    if (courseProgress.percent < 100) {
      throw new BadRequestException('Course is not 100% completed');
    }

    // 3. Idempotent return if already claimed
    const [existing] = await this.db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)));

    if (existing) {
      return this.enrichCertificateDto(existing);
    }

    // 4. Generate unique serial: SAGE-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const serial = `SAGE-${year}-${randomPart}`;

    // 5. Insert certificate
    const [inserted] = await this.db
      .insert(certificates)
      .values({
        serial,
        userId,
        courseId,
      })
      .returning();

    return this.enrichCertificateDto(inserted!);
  }

  async verifyCertificate(
    rawSerial: string,
  ): Promise<PublicCertificateVerificationDto> {
    const serial = rawSerial.trim().toUpperCase();

    const [cert] = await this.db
      .select()
      .from(certificates)
      .where(eq(certificates.serial, serial));

    if (!cert) {
      throw new NotFoundException('Certificate not found or invalid serial');
    }

    // Fetch student
    const [student] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, cert.userId));

    // Fetch course & instructor
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, cert.courseId));

    const [instructor] = course
      ? await this.db
          .select()
          .from(users)
          .where(eq(users.id, course.instructorId))
      : [null];

    const translations = await this.db
      .select()
      .from(courseTranslations)
      .where(eq(courseTranslations.courseId, cert.courseId));

    const titleRecord: Record<string, string> = {};
    for (const t of translations) {
      titleRecord[t.locale] = t.title;
    }

    return {
      serial: cert.serial,
      studentName: student?.email?.split('@')[0] ?? 'Sage Scholar',
      courseTitle: titleRecord,
      instructorName: instructor?.email?.split('@')[0] ?? 'Sage Instructor',
      issuedAt: new Date(cert.issuedAt).toISOString(),
      isValid: true,
    };
  }

  async getUserCertificates(userId: string): Promise<CertificateDto[]> {
    const certs = await this.db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userId));

    const results: CertificateDto[] = [];
    for (const cert of certs) {
      results.push(await this.enrichCertificateDto(cert));
    }
    return results;
  }

  private async enrichCertificateDto(
    cert: typeof certificates.$inferSelect,
  ): Promise<CertificateDto> {
    const [student] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, cert.userId));

    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, cert.courseId));

    const [instructor] = course
      ? await this.db
          .select()
          .from(users)
          .where(eq(users.id, course.instructorId))
      : [null];

    const translations = await this.db
      .select()
      .from(courseTranslations)
      .where(eq(courseTranslations.courseId, cert.courseId));

    const titleRecord: Record<string, string> = {};
    for (const t of translations) {
      titleRecord[t.locale] = t.title;
    }

    return {
      id: cert.id,
      serial: cert.serial,
      userId: cert.userId,
      studentName: student?.email?.split('@')[0] ?? 'Sage Scholar',
      courseId: cert.courseId,
      courseTitle: titleRecord,
      instructorName: instructor?.email?.split('@')[0] ?? 'Sage Instructor',
      issuedAt: new Date(cert.issuedAt).toISOString(),
    };
  }
}

