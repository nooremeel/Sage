import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { VideoPlayer } from '@/components/media/video-player';
import { Illustration } from '@/components/illustrations/illustration';
import { Link } from '@/i18n/routing';
import { apiClient } from '@/lib/api';
import { PlayCircle, FileText, CheckCircle, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import type { CourseDto, PlaybackResponseDto, Locale } from '@sage/shared';

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

  let course: CourseDto;
  try {
    const res = await apiClient<{ course: CourseDto }>(
      `/courses/detail/${slug}?locale=${locale}`
    );
    course = res.course;
  } catch {
    notFound();
  }

  // Find target lesson
  let targetLesson: any = null;
  let targetSection: any = null;

  for (const s of course.sections || []) {
    const found = (s.lessons || []).find((l: any) => l.id === lessonId);
    if (found) {
      targetLesson = found;
      targetSection = s;
      break;
    }
  }

  if (!targetLesson) {
    notFound();
  }

  // Request playback token
  let playbackData: PlaybackResponseDto | null = null;
  let accessDenied = false;

  try {
    playbackData = await apiClient<PlaybackResponseDto>(
      `/curriculum/lessons/${lessonId}/playback`
    );
  } catch {
    accessDenied = true;
  }

  const courseTrans =
    course.translations.find((t) => t.locale === locale) || course.translations[0];
  const lessonTitle = targetLesson.title?.[currentLocale] || targetLesson.title?.en || 'Lesson';

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 sm:px-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/courses" className="hover:text-primary transition-colors">
          Courses
        </Link>
        <span>/</span>
        <Link href={`/courses/${slug}`} className="hover:text-primary transition-colors">
          {courseTrans?.title || 'Course'}
        </Link>
        <span>/</span>
        <span className="text-text font-medium">{lessonTitle}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content: Player / Lesson Body */}
        <div className="lg:col-span-3 space-y-6">
          {playbackData ? (
            <VideoPlayer
              manifestUrl={playbackData.manifestUrl}
              lessonId={lessonId}
            />
          ) : accessDenied ? (
            <div className="aspect-video w-full rounded-lg border border-border bg-card flex flex-col items-center justify-center p-8 text-center space-y-4">
              <Illustration name="empty-search" size={96} wash="amber" />
              <div className="space-y-1">
                <h3 className="font-headline text-xl font-bold text-text">
                  Protected Content
                </h3>
                <p className="text-sm text-text-muted max-w-md">
                  This lesson is part of the full curriculum. Enroll in the course to unlock unlimited streaming access.
                </p>
              </div>
              <Link
                href={`/courses/${slug}`}
                className="px-6 py-2.5 rounded-md bg-accent text-on-accent text-xs font-semibold hover:bg-accent/90 transition-colors focus-ring"
              >
                {t('enrollNow')}
              </Link>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-lg border border-border bg-card flex items-center justify-center">
              <p className="text-sm text-text-muted">Loading streaming player...</p>
            </div>
          )}

          {/* Lesson Header & Notes */}
          <div className="space-y-2 text-start">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-accent">
                {targetSection?.title?.[currentLocale] || targetSection?.title?.en}
              </span>
              {targetLesson.isFreePreview && (
                <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                  Free Preview
                </span>
              )}
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-text">
              {lessonTitle}
            </h1>
            {targetLesson.durationSec > 0 && (
              <p className="text-xs text-text-muted font-mono">
                Duration: {Math.floor(targetLesson.durationSec / 60)} minutes
              </p>
            )}
          </div>
        </div>

        {/* Sidebar: Curriculum Outline */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="font-headline text-base font-bold text-text text-start border-b border-border pb-2">
              Curriculum Outline
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pe-1">
              {(course.sections || []).map((sec, sIdx) => (
                <div key={sec.id} className="space-y-1.5 text-start">
                  <div className="text-xs font-semibold text-text-muted">
                    Module {sIdx + 1}: {sec.title?.[currentLocale] || sec.title?.en}
                  </div>

                  <div className="space-y-1">
                    {(sec.lessons || []).map((les) => {
                      const isActive = les.id === lessonId;
                      const isPlayable = les.isFreePreview || !accessDenied;

                      return (
                        <Link
                          key={les.id}
                          href={`/courses/${slug}/lessons/${les.id}`}
                          className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                            isActive
                              ? 'bg-primary text-on-primary font-medium'
                              : 'hover:bg-bg-subtle text-text'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {les.type === 'video' ? (
                              <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="truncate">
                              {les.title?.[currentLocale] || les.title?.en}
                            </span>
                          </div>

                          {!isPlayable && !isActive && (
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
