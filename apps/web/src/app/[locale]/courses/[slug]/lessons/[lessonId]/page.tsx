import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LessonVideoWithHeartbeat } from '@/components/media/lesson-video-with-heartbeat';
import { QuizRunner } from '@/components/quiz/quiz-runner';
import { QASection } from '@/components/domain/qa-section';
import { ClaimCertificateBanner } from '@/components/certificates/claim-certificate-banner';
import { Illustration } from '@/components/illustrations/illustration';
import { Link } from '@/i18n/routing';
import { apiClient } from '@/lib/api';
import { getDemoCourseBySlug, getDemoLessonById, DEMO_STREAM_URL } from '@/lib/demo-courses';
import {
  PlayCircle,
  FileText,
  Lock,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { CourseDto, PlaybackResponseDto, SectionDto, LessonDto } from '@sage/shared';

interface LessonPageProps {
  params: Promise<{
    locale: string;
    slug: string;
    lessonId: string;
  }>;
}

export default async function LessonPlaybackPage({ params }: LessonPageProps) {
  const { locale, slug, lessonId } = await params;
  const currentLocale = (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const t = await getTranslations('courseDetail');

  let course: CourseDto | undefined;
  try {
    const res = await apiClient<{ course: CourseDto }>(
      `/courses/detail/${slug}?locale=${locale}`
    );
    course = res.course;
  } catch {
    course = getDemoCourseBySlug(slug);
  }

  if (!course) {
    // Try finding course by lesson id directly in demo dataset
    const demoLookup = getDemoLessonById(lessonId);
    if (demoLookup) {
      course = demoLookup.course;
    } else {
      notFound();
    }
  }

  // Find target lesson and section
  let targetLesson: LessonDto | null = null;
  let targetSection: SectionDto | null = null;

  for (const s of course.sections || []) {
    const found = (s.lessons || []).find((l) => l.id === lessonId);
    if (found) {
      targetLesson = found;
      targetSection = s;
      break;
    }
  }

  if (!targetLesson) {
    // Fallback to first lesson if not found
    const firstSection = course.sections?.[0];
    const firstLesson = firstSection?.lessons?.[0];
    if (firstLesson) {
      targetLesson = firstLesson;
      targetSection = firstSection;
    } else {
      notFound();
    }
  }

  // Flatten all lessons to enable Prev/Next navigation
  const allLessons: Array<{
    id: string;
    title: { ar?: string; en?: string };
    type: string;
    isFreePreview?: boolean;
  }> = [];
  (course.sections || []).forEach((sec) => {
    (sec.lessons || []).forEach((les) => {
      allLessons.push(les);
    });
  });

  const currentIndex = allLessons.findIndex((l) => l.id === targetLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  // Request playback token
  let playbackData: PlaybackResponseDto | null = null;
  let apiDenied = false;

  try {
    playbackData = await apiClient<PlaybackResponseDto>(
      `/curriculum/lessons/${lessonId}/playback`
    );
  } catch {
    apiDenied = true;
  }

  // Entitlement logic:
  // 1. Free preview lessons are ALWAYS playable
  // 2. Complimentary courses (price = 0) are ALWAYS playable
  // 3. If playback token was granted, it's playable
  // 4. Paid non-preview lessons without token show protected content card
  const isComplimentary = course.priceCents === 0;
  const isFreePreview = Boolean(targetLesson.isFreePreview);
  const isPlayable = isFreePreview || isComplimentary || Boolean(playbackData);

  const manifestUrl = playbackData?.manifestUrl || DEMO_STREAM_URL;

  const courseTrans =
    course.translations.find((t) => t.locale === locale) || course.translations[0];
  const lessonTitle = targetLesson.title?.[currentLocale] || targetLesson.title?.en || 'Lesson';

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 sm:px-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/courses" className="hover:text-primary transition-colors">
          {t('coursesBreadcrumb')}
        </Link>
        <span>/</span>
        <Link href={`/courses/${slug}`} className="hover:text-primary transition-colors">
          {courseTrans?.title || 'Course'}
        </Link>
        <span>/</span>
        <span className="text-text font-medium">{lessonTitle}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content: Player / Quiz / Lesson Body */}
        <div className="lg:col-span-3 space-y-6">
          {/* Certificate Claim / Course Progress Milestone Banner */}
          <ClaimCertificateBanner
            courseId={course.id}
            courseSlug={slug}
            locale={currentLocale}
          />

          {targetLesson.type === 'quiz' ? (
            <QuizRunner lessonId={lessonId} locale={currentLocale} />
          ) : isPlayable ? (
            <LessonVideoWithHeartbeat
              manifestUrl={manifestUrl}
              lessonId={lessonId}
              durationSec={targetLesson.durationSec}
            />
          ) : (
            <div className="aspect-video w-full rounded-lg border border-border bg-card flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-sm">
              <Illustration name="empty-courses" size={88} wash="amber" />
              <div className="space-y-1.5">
                <h3 className="font-headline text-xl font-bold text-text">
                  {t('protectedLesson')}
                </h3>
                <p className="text-sm text-text-muted max-w-md mx-auto">
                  {t('protectedLessonDesc')}
                </p>
              </div>
              <Link
                href={`/courses/${slug}`}
                className="px-6 py-2.5 rounded-md bg-accent text-on-accent text-xs font-semibold hover:opacity-95 transition-all shadow-sm"
              >
                {t('enrollNow')}
              </Link>
            </div>
          )}

          {/* Lesson Header, Badges & Notes */}
          <div className="space-y-3 text-start border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-accent">
                {targetSection?.title?.[currentLocale] || targetSection?.title?.en}
              </span>

              {targetLesson.isFreePreview && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('freePreview')}</span>
                </span>
              )}

              {targetLesson.durationSec > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-text-muted font-mono bg-bg-subtle px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  <span>{t('durationMinutes', { mins: Math.floor(targetLesson.durationSec / 60) })}</span>
                </span>
              )}
            </div>

            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-text rtl:leading-snug rtl:tracking-normal rtl:py-1">
              {lessonTitle}
            </h1>

            {/* Prev / Next Lesson Navigation Bar */}
            <div className="flex items-center justify-between pt-2">
              {prevLesson ? (
                <Link
                  href={`/courses/${slug}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-primary transition-colors py-1 px-2.5 rounded border border-border/60 hover:border-border"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rtl:-scale-x-100" />
                  <span className="truncate max-w-[180px]">
                    {prevLesson.title?.[currentLocale] || prevLesson.title?.en}
                  </span>
                </Link>
              ) : <div />}

              {nextLesson ? (
                <Link
                  href={`/courses/${slug}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary-hover transition-colors py-1 px-2.5 rounded border border-primary/30 hover:border-primary bg-primary/5"
                >
                  <span className="truncate max-w-[180px]">
                    {nextLesson.title?.[currentLocale] || nextLesson.title?.en}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
                </Link>
              ) : <div />}
            </div>
          </div>

          {/* Lesson Q&A Discussion Section */}
          <QASection lessonId={lessonId} locale={currentLocale} />
        </div>

        {/* Sidebar: Curriculum Outline */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3 sticky top-20 shadow-xs">
            <h3 className="font-headline text-base font-bold text-text text-start border-b border-border pb-2">
              {t('curriculum')}
            </h3>

            <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pe-1">
              {(course.sections || []).map((sec, sIdx) => (
                <div key={sec.id} className="space-y-1.5 text-start">
                  <div className="text-xs font-semibold text-text-muted">
                    {t('moduleTitle', { num: sIdx + 1 })} {sec.title?.[currentLocale] || sec.title?.en}
                  </div>

                  <div className="space-y-1">
                    {(sec.lessons || []).map((les) => {
                      const isActive = les.id === lessonId;
                      const isLesPlayable =
                        isComplimentary || les.isFreePreview || Boolean(playbackData);

                      return (
                        <Link
                          key={les.id}
                          href={`/courses/${slug}/lessons/${les.id}`}
                          className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                            isActive
                              ? 'bg-primary text-white dark:text-slate-950 font-medium shadow-xs'
                              : 'hover:bg-bg-subtle text-text'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {les.type === 'video' ? (
                              <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                            ) : les.type === 'quiz' ? (
                              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="truncate">
                              {les.title?.[currentLocale] || les.title?.en}
                            </span>
                          </div>

                          {!isLesPlayable && !isActive && (
                            <Lock className="w-3 h-3 text-text-muted shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
