'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { ArrowEnd } from '@/components/ui/directional-icon';
import { BookOpen, User, CheckCircle2, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseDto, CourseProgressDto } from '@sage/shared';

export interface StudentProgressCardProps {
  course: CourseDto;
  progress: CourseProgressDto;
  locale: 'ar' | 'en';
  className?: string;
}

export function StudentProgressCard({
  course,
  progress,
  locale,
  className,
}: StudentProgressCardProps) {
  const tProfile = useTranslations('profile');
  const tCatalog = useTranslations('catalog');

  // Resolve localized title and slug
  const translation =
    course.translations.find((t) => t.locale === locale) ||
    course.translations.find((t) => t.locale === 'en') ||
    course.translations[0];

  const title = translation?.title || 'Course';
  const slug = translation?.slug || course.id;

  // Find next lesson to resume
  let nextLessonId = progress.lastAccessedLessonId;

  if (!nextLessonId && course.sections && course.sections.length > 0) {
    // Find first lesson not in completedLessonIds
    for (const sec of course.sections) {
      if (sec.lessons) {
        for (const les of sec.lessons) {
          if (!progress.completedLessonIds.includes(les.id)) {
            nextLessonId = les.id;
            break;
          }
        }
      }
      if (nextLessonId) break;
    }

    // If none found (all completed), default to first lesson
    if (!nextLessonId) {
      nextLessonId = course.sections[0]?.lessons?.[0]?.id || null;
    }
  }

  const continueHref = nextLessonId
    ? `/courses/${slug}/lessons/${nextLessonId}`
    : `/courses/${slug}`;

  const isCompleted = progress.percent >= 100;

  const levelLower = course.level?.toLowerCase() || '';
  const levelLabel = ['beginner', 'intermediate', 'advanced'].includes(levelLower)
    ? tCatalog(levelLower as 'beginner' | 'intermediate' | 'advanced')
    : course.level;

  return (
    <Card
      elevation="e2"
      className={cn(
        'flex flex-col justify-between overflow-hidden p-6 text-start transition-all duration-200 hover:border-primary/40 hover:shadow-e2',
        className
      )}
    >
      <div className="space-y-4">
        {/* Meta Header */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {course.categoryName || levelLabel}
          </Badge>

          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage-700 dark:text-sage-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              100%
            </span>
          ) : (
            <span className="text-xs font-semibold text-primary">
              {Math.round(progress.percent)}%
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <Link
            href={`/courses/${slug}`}
            className="group inline-block focus-ring rounded-xs"
          >
            <h3 className="font-headline text-lg sm:text-xl font-bold tracking-tight text-text transition-colors group-hover:text-primary">
              {title}
            </h3>
          </Link>

          {course.instructorName && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>{course.instructorName}</span>
            </div>
          )}
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {tProfile('lessonsCompleted', {
                completed: progress.completedLessons,
                total: progress.totalLessons,
              })}
            </span>
          </div>
          <ProgressBar value={progress.percent} aria-label={`${title} progress`} />
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-border">
        <Link href={continueHref} className="flex-1 min-w-[140px]">
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center group"
          >
            <PlayCircle className="h-4 w-4 me-1.5 shrink-0" />
            <span>{tProfile('continueLearning')}</span>
            <ArrowEnd className="h-3.5 w-3.5 ms-1.5" />
          </Button>
        </Link>

        <Link href={`/courses/${slug}`}>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <BookOpen className="h-3.5 w-3.5 me-1.5 shrink-0" />
            <span>{tProfile('courseOverview')}</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}
