import { getTranslations } from 'next-intl/server';
import { CourseCard } from '@/components/domain/course-card';
import { Illustration } from '@/components/illustrations/illustration';
import { Link } from '@/i18n/routing';
import { apiClient } from '@/lib/api';
import type { CourseDto, Locale } from '@sage/shared';

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; level?: string }>;
}

export default async function CoursesCatalogPage({ params, searchParams }: CoursesPageProps) {
  const { locale } = await params;
  const { category, level } = await searchParams;
  const t = await getTranslations('catalog');

  let courses: CourseDto[] = [];
  try {
    const query = new URLSearchParams();
    if (category) query.set('categorySlug', category);
    if (level) query.set('level', level);
    query.set('locale', locale);

    const res = await apiClient<{ courses: CourseDto[] }>(`/courses?${query.toString()}`);
    courses = res.courses || [];
  } catch {
    courses = [];
  }

  const categoryChips = [
    { slug: '', label: t('allCategories') },
    { slug: 'software-engineering', label: t('softwareEngineering') },
    { slug: 'islamic-arts', label: t('islamicArts') },
    { slug: 'business-leadership', label: t('businessLeadership') },
  ];

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 sm:px-6 space-y-10">
      {/* Catalog Header */}
      <div className="space-y-3 text-start max-w-2xl">
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-text">
          {t('title')}
        </h1>
        <p className="text-base text-text-muted">
          {t('subtitle')}
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {categoryChips.map((chip) => {
          const isActive = (category || '') === chip.slug;
          const href = chip.slug ? `/courses?category=${chip.slug}` : '/courses';
          return (
            <Link
              key={chip.slug}
              href={href}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus-ring ${
                isActive
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-card border border-border text-text hover:bg-bg-subtle'
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const trans =
              course.translations.find((t) => t.locale === locale) ||
              course.translations[0];

            const title = trans?.title || 'Untitled Course';
            const slug = trans?.slug || course.id;
            const price = course.priceCents === 0 ? t('free') : `$${(course.priceCents / 100).toFixed(2)}`;

            return (
              <CourseCard
                key={course.id}
                title={title}
                instructor={course.instructorName || 'Instructor'}
                rating={course.ratingAvg || 5.0}
                reviewCount={course.ratingCount || 10}
                price={price}
                level={course.level}
                lessonsCount={10}
                duration="3h 20m"
                href={`/courses/${slug}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 flex flex-col items-center justify-center">
          <Illustration name="empty-search" size={96} wash="amber" />
          <h3 className="font-headline text-xl font-semibold text-text">
            {t('noCoursesFound')}
          </h3>
          <p className="text-sm text-text-muted max-w-md">
            {t('noCoursesFoundDesc')}
          </p>
          <Link
            href="/courses"
            className="text-sm font-medium text-primary hover:underline focus-ring"
          >
            {t('clearFilters')}
          </Link>
        </div>
      )}
    </div>
  );
}

