'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { Link, useRouter } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StudentProgressCard } from '@/components/domain/student-progress-card';
import { EarnedCertificateCard } from '@/components/certificates/earned-certificate-card';
import { ProfileForm } from '@/components/auth/profile-form';
import { DEMO_COURSES } from '@/lib/demo-courses';
import {
  BookOpen,
  Award,
  Clock,
  GraduationCap,
  Sparkles,
  User,
  Compass,
} from 'lucide-react';
import { ArrowEnd } from '@/components/ui/directional-icon';
import type { CourseDto, CourseProgressDto, CertificateDto } from '@sage/shared';

// Helper to construct demo enrolled courses
function getDemoEnrolledCourses(isThuluthPassed = false): Array<{
  course: CourseDto;
  progress: CourseProgressDto;
}> {
  const thuluthCourse = DEMO_COURSES.find((c) => c.id === 'course-thuluth-002');
  const archCourse = DEMO_COURSES.find((c) => c.id === 'course-arch-001');

  const result: Array<{ course: CourseDto; progress: CourseProgressDto }> = [];

  if (thuluthCourse) {
    result.push({
      course: thuluthCourse,
      progress: {
        courseId: 'course-thuluth-002',
        totalLessons: 4,
        completedLessons: isThuluthPassed ? 4 : 3,
        percent: isThuluthPassed ? 100 : 75,
        completedLessonIds: isThuluthPassed
          ? ['les-thuluth-01', 'les-thuluth-02', 'les-thuluth-03', 'les-thuluth-04-quiz']
          : ['les-thuluth-01', 'les-thuluth-02', 'les-thuluth-03'],
        lastAccessedLessonId: isThuluthPassed ? null : 'les-thuluth-04-quiz',
      },
    });
  }

  if (archCourse) {
    result.push({
      course: archCourse,
      progress: {
        courseId: 'course-arch-001',
        totalLessons: 4,
        completedLessons: 1,
        percent: 25,
        completedLessonIds: ['les-arch-01-vid'],
        lastAccessedLessonId: 'les-arch-02-art',
      },
    });
  }

  return result;
}

// Helper to construct demo certificates
function getDemoCertificates(
  locale: 'ar' | 'en',
  userId?: string,
  userEmail?: string,
  claimedStoredCert?: CertificateDto | null
): CertificateDto[] {
  const certs: CertificateDto[] = [];

  if (claimedStoredCert) {
    certs.push(claimedStoredCert);
  }

  const hasAlphaCert = certs.some((c) => c.serial === 'SAGE-2026-ALPHA1');
  if (!hasAlphaCert) {
    certs.push({
      id: 'cert-thuluth-demo',
      serial: 'SAGE-2026-ALPHA1',
      userId: userId || 'usr-student-001',
      studentName: userEmail ? userEmail.split('@')[0] : (locale === 'ar' ? 'نور إميل' : 'Nour Emil'),
      courseId: 'course-thuluth-002',
      courseTitle: {
        ar: 'أسرار الخط العربي: هندسة خط الثلث الكلاسيكي',
        en: 'The Art of Thuluth Calligraphy: Classical Islamic Geometry',
      },
      instructorName: locale === 'ar' ? 'أحمد الخالدي' : 'Ustadh Ahmad Al-Khalidi',
      issuedAt: '2026-10-25T14:30:00Z',
    });
  }

  return certs;
}

export default function StudentDashboardPage() {
  const tProfile = useTranslations('profile');
  const tNav = useTranslations('nav');
  const locale = useLocale() as 'ar' | 'en';
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated visitors to login
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Initialize synchronously with demo data to guarantee zero flash of empty state
  const [enrolledCourses, setEnrolledCourses] = React.useState<
    Array<{ course: CourseDto; progress: CourseProgressDto }>
  >(() => getDemoEnrolledCourses(false));

  const [certificates, setCertificates] = React.useState<CertificateDto[]>(() =>
    getDemoCertificates(locale, user?.id, user?.email)
  );

  const [loadingData, setLoadingData] = React.useState(false);

  // Sync client-side localStorage milestones & background revalidate if user is logged in
  React.useEffect(() => {
    let isMounted = true;

    // 1. Read local storage on client mount
    try {
      const isPassed = localStorage.getItem('sage_quiz_passed_course-thuluth-002') === 'true';
      if (isPassed) {
        setEnrolledCourses(getDemoEnrolledCourses(true));
      }

      const storedCertJson = localStorage.getItem('sage_claimed_cert_course-thuluth-002');
      if (storedCertJson) {
        const parsed = JSON.parse(storedCertJson);
        setCertificates(getDemoCertificates(locale, user?.id, user?.email, parsed));
      }
    } catch {
      // ignore
    }

    // 2. Only attempt remote API if user is authenticated
    if (!user) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    async function revalidate() {
      try {
        const [enrolledRes, certsRes] = await Promise.allSettled([
          apiClient<{ items: Array<{ course: CourseDto; progress: CourseProgressDto }> }>(
            '/enrollments/mine',
            { signal: controller.signal }
          ),
          apiClient<{ items: CertificateDto[] }>(
            '/certificates/mine',
            { signal: controller.signal }
          ),
        ]);

        if (!isMounted) return;

        if (enrolledRes.status === 'fulfilled' && enrolledRes.value.items?.length > 0) {
          setEnrolledCourses(enrolledRes.value.items);
        }

        if (certsRes.status === 'fulfilled' && certsRes.value.items?.length > 0) {
          setCertificates(certsRes.value.items);
        }
      } catch {
        // Silently preserve initial demo data
      } finally {
        clearTimeout(timeoutId);
      }
    }

    revalidate();

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [user, locale]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-md py-20 px-4 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-200 text-primary border border-border shadow-xs">
          <User className="h-8 w-8" />
        </div>
        <h2 className="font-headline text-2xl font-bold text-text">
          {locale === 'ar' ? 'تسجيل الدخول مطلوب' : 'Authentication Required'}
        </h2>
        <p className="text-sm text-text-muted">
          {locale === 'ar'
            ? 'يجب تسجيل الدخول للوصول إلى لوحة التعلّم الأكاديمي والشهادات.'
            : 'You must sign in to view your learning dashboard and earned credentials.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/login">
            <Button variant="primary">{tNav('login')}</Button>
          </Link>
          <Link href="/signup">
            <Button variant="secondary">{tNav('signup')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const studentDisplayName =
    user?.email ? user.email.split('@')[0] : (locale === 'ar' ? 'طالب العلم' : 'Student Scholar');

  const activeCoursesCount = enrolledCourses.length;
  const earnedCertsCount = certificates.length;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 sm:px-6 space-y-8">
      {/* Scholar Header */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-e1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper-200 text-primary border border-border shadow-xs">
              <GraduationCap className="h-8 w-8" />
            </div>

            <div className="space-y-1 text-start">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-text">
                  {studentDisplayName}
                </h1>
                <Badge variant="secondary" className="text-xs bg-sage-100 text-sage-900 border-sage-300 dark:bg-sage-950 dark:text-sage-300 dark:border-sage-800">
                  <Sparkles className="h-3 w-3 me-1 shrink-0" />
                  {tProfile('academicScholar')}
                </Badge>
              </div>
              <p className="text-sm text-text-muted">
                {tProfile('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/courses">
              <Button variant="secondary" size="sm" className="gap-2">
                <Compass className="h-4 w-4" />
                <span>{tProfile('exploreCatalog')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={tProfile('activeCourses')}
          value={activeCoursesCount}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          label={tProfile('completedCertificates')}
          value={earnedCertsCount}
          icon={<Award className="h-5 w-5 text-accent" />}
        />
        <StatCard
          label={tProfile('hoursLogged')}
          value="14.5h"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label={tProfile('averageScore')}
          value="94%"
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start border border-border p-1">
          <TabsTrigger value="courses" className="gap-2 px-4 py-2">
            <BookOpen className="h-4 w-4" />
            <span>{tProfile('myLearning')}</span>
            <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-xs">
              {enrolledCourses.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="certificates" className="gap-2 px-4 py-2">
            <Award className="h-4 w-4" />
            <span>{tProfile('certificatesGallery')}</span>
            <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-xs">
              {certificates.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="account" className="gap-2 px-4 py-2">
            <User className="h-4 w-4" />
            <span>{tProfile('accountSettings')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Enrolled Courses */}
        <TabsContent value="courses" className="space-y-6">
          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 rounded-lg border border-border bg-card/60 animate-pulse" />
              <div className="h-48 rounded-lg border border-border bg-card/60 animate-pulse" />
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((item) => (
                <StudentProgressCard
                  key={item.course.id}
                  course={item.course}
                  progress={item.progress}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-4 border-dashed border-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-200 text-text-muted">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-headline text-lg font-bold text-text">
                  {tProfile('noCoursesEnrolled')}
                </h3>
                <p className="text-sm text-text-muted max-w-md mx-auto">
                  {tProfile('noCoursesEnrolledDesc')}
                </p>
              </div>
              <Link href="/courses" className="inline-block pt-2">
                <Button variant="primary">
                  <span>{tProfile('exploreCatalog')}</span>
                  <ArrowEnd className="h-4 w-4 ms-2" />
                </Button>
              </Link>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Certificates & Honors Gallery */}
        <TabsContent value="certificates" className="space-y-6">
          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 rounded-lg border border-border bg-card/60 animate-pulse" />
              <div className="h-48 rounded-lg border border-border bg-card/60 animate-pulse" />
            </div>
          ) : certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <EarnedCertificateCard
                  key={cert.id || cert.serial}
                  certificate={cert}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-4 border-dashed border-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paper-200 text-text-muted">
                <Award className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-headline text-lg font-bold text-text">
                  {tProfile('noCertificatesYet')}
                </h3>
                <p className="text-sm text-text-muted max-w-md mx-auto">
                  {tProfile('completeCourseToEarn')}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Account Settings */}
        <TabsContent value="account" className="space-y-6">
          {user ? (
            <ProfileForm />
          ) : (
            <Card className="p-8 text-center space-y-4 max-w-xl mx-auto border border-border">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-200 text-primary">
                <User className="h-6 w-6" />
              </div>
              <h3 className="font-headline text-lg font-semibold text-text">
                {tProfile('accountDetails')}
              </h3>
              <p className="text-sm text-text-muted">
                {locale === 'ar'
                  ? 'سجّل الدخول للوصول إلى تفاصيل حسابك الكاملة وتعديل تفضيلات اللغة.'
                  : 'Sign in to access your full account settings and update your language preferences.'}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link href="/login">
                  <Button variant="primary">
                    {tNav('login')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="secondary">
                    {tNav('signup')}
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
