import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RatingStars } from '@/components/ui/rating-stars';
import { CurriculumAccordion } from '@/components/domain/curriculum-accordion';
import { apiClient } from '@/lib/api';
import type { CourseDto, Locale } from '@sage/shared';
import { Check, ShieldCheck, Globe, Award } from 'lucide-react';

interface CourseDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { locale, slug } = await params;
  try {
    const res = await apiClient<{ course: CourseDto }>(`/courses/detail/${slug}?locale=${locale}`);
    const trans =
      res.course.translations.find((t) => t.locale === locale) ||
      res.course.translations[0];

    return {
      title: `${trans?.title || 'Course'} — Sage (سايج)`,
      description: trans?.subtitle || trans?.description?.slice(0, 160),
    };
  } catch {
    return {
      title: 'Course Not Found — Sage',
    };
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations('courseDetail');

  let course: CourseDto;
  try {
    const res = await apiClient<{ course: CourseDto }>(`/courses/detail/${slug}?locale=${locale}`);
    course = res.course;
  } catch {
    notFound();
  }

  const activeTrans =
    course.translations.find((t) => t.locale === locale) ||
    course.translations[0];

  const formattedSections = (course.sections || []).map((sec) => ({
    id: sec.id,
    title: (locale === 'ar' ? sec.title.ar : sec.title.en) || sec.title.en || sec.title.ar || '',
    lessons: (sec.lessons || []).map((l) => ({
      id: l.id,
      title: (locale === 'ar' ? l.title.ar : l.title.en) || l.title.en || l.title.ar || '',
      type: l.type as 'video' | 'article' | 'quiz',
      duration: `${Math.round(l.durationSec / 60)}m`,
      isFreePreview: l.isFreePreview,
    })),
  }));

  const priceText = course.priceCents === 0 ? t('free') : `$${(course.priceCents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen">
      {/* Course Hero Header */}
      <section className="border-b border-border bg-paper-200/50 dark:bg-bg-subtle/70 py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{course.level}</Badge>
            <Badge variant="default" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span>{course.primaryLocale === 'ar' ? 'العربية' : 'English'}</span>
            </Badge>
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text max-w-4xl">
            {activeTrans?.title}
          </h1>

          {activeTrans?.subtitle && (
            <p className="text-base sm:text-lg text-text-muted max-w-3xl leading-relaxed">
              {activeTrans.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-text-muted pt-2">
            <span>{t('instructor')}: <strong className="text-text font-semibold">{course.instructorName}</strong></span>
            <span>•</span>
            <RatingStars rating={course.ratingAvg || 5.0} count={course.ratingCount || 10} showNumber size="sm" />
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="container mx-auto max-w-6xl py-12 px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left / Reading Column */}
        <div className="lg:col-span-2 space-y-10">
          {/* About Course */}
          <div className="space-y-4">
            <h2 className="font-headline text-2xl font-semibold text-text">
              {t('aboutCourse')}
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-text-muted leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {activeTrans?.description}
            </div>
          </div>

          {/* Curriculum */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-2xl font-semibold text-text">
                {t('curriculum')}
              </h2>
              <span className="text-xs text-text-muted">
                {formattedSections.length} {t('sectionsCount')}
              </span>
            </div>

            {formattedSections.length > 0 ? (
              <CurriculumAccordion sections={formattedSections} />
            ) : (
              <p className="text-sm text-text-muted">{t('curriculumUnderReview')}</p>
            )}
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card elevation="e1" className="p-6 space-y-6 border-border bg-card">
              <div className="space-y-1">
                <span className="text-xs text-text-muted block">{t('tuition')}</span>
                <div className="font-headline text-3xl font-bold text-primary">
                  {priceText}
                </div>
              </div>

              <Button variant="accent" size="lg" className="w-full">
                {t('enrollNow')}
              </Button>

              <div className="border-t border-border pt-4 space-y-3 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sage-700 dark:text-sage-300 shrink-0" />
                  <span>{t('accessGuarantee')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{t('verifiedCertificate')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{t('bilingualMaterial')}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
