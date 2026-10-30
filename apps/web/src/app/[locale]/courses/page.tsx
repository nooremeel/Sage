import { getTranslations } from 'next-intl/server';
import { CourseCard } from '@/components/domain/course-card';
import { Illustration } from '@/components/illustrations/illustration';
import { Link } from '@/i18n/routing';
import { apiClient } from '@/lib/api';
import type { CourseDto, Locale } from '@sage/shared';

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    level?: string;
    q?: string;
    price?: string;
    cursor?: string;
  }>;
}

export default async function CoursesCatalogPage({ params, searchParams }: CoursesPageProps) {
  const { locale } = await params;
  const { category, level, q, price, cursor } = await searchParams;
  const t = await getTranslations('catalog');

  let courses: CourseDto[] = [];
  let nextCursor: string | null = null;

  try {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (category) query.set('categorySlug', category);
    if (level) query.set('level', level);
    if (price) query.set('price', price);
    if (cursor) query.set('cursor', cursor);
    query.set('locale', locale);

    if (q) {
      const res = await apiClient<{ items: CourseDto[]; nextCursor: string | null }>(
        `/courses/search?${query.toString()}`
      );
      courses = res.items || [];
      nextCursor = res.nextCursor;
    } else {
      const res = await apiClient<{ courses: CourseDto[] }>(`/courses?${query.toString()}`);
      courses = res.courses || [];
    }
  } catch {
    courses = [];
  }

  const categoryChips = [
    { slug: '', label: t('allCategories') },
    { slug: 'software-engineering', label: t('softwareEngineering') },
    { slug: 'islamic-arts', label: t('islamicArts') },
    { slug: 'business-leadership', label: t('businessLeadership') },
  ];

  const levelChips = [
    { val: '', label: t('allLevels') },
    { val: 'beginner', label: t('beginner') },
    { val: 'intermediate', label: t('intermediate') },
    { val: 'advanced', label: t('advanced') },
  ];

  const priceChips = [
    { val: '', label: t('allPrices') },
    { val: 'free', label: t('free') },
    { val: 'paid', label: t('paid') },
  ];

  const buildFilterUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const current = { category, level, q, price, ...overrides };
    if (current.q) params.set('q', current.q);
    if (current.category) params.set('category', current.category);
    if (current.level) params.set('level', current.level);
    if (current.price) params.set('price', current.price);
    const qs = params.toString();
    return qs ? `/courses?${qs}` : '/courses';
  };

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

      {/* Search Input Bar */}
      <form method="GET" action={`/${locale}/courses`} className="relative max-w-xl">
        <input
          type="text"
          name="q"
          defaultValue={q || ''}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-md border border-border bg-card ps-4 pe-24 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
        />
        {category && <input type="hidden" name="category" value={category} />}
        {level && <input type="hidden" name="level" value={level} />}
        {price && <input type="hidden" name="price" value={price} />}
        <button
          type="submit"
          className="absolute end-1.5 top-1.5 bottom-1.5 rounded-sm bg-primary px-3 text-xs font-medium text-on-primary hover:bg-primary/90 transition-colors focus-ring"
        >
          {t('searchBtn')}
        </button>
      </form>

      {/* Filter Controls */}
      <div className="space-y-3 border-b border-border pb-6">
        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {categoryChips.map((chip) => {
            const isActive = (category || '') === chip.slug;
            return (
              <Link
                key={chip.slug}
                href={buildFilterUrl({ category: chip.slug || undefined })}
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

        {/* Level and Price Filters */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-2">
          <div className="flex items-center gap-1.5">
            {levelChips.map((lvl) => {
              const isActive = (level || '') === lvl.val;
              return (
                <Link
                  key={lvl.val}
                  href={buildFilterUrl({ level: lvl.val || undefined })}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    isActive
                      ? 'bg-bg-subtle text-primary font-semibold border border-border'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {lvl.label}
                </Link>
              );
            })}
          </div>

          <span className="text-border">|</span>

          <div className="flex items-center gap-1.5">
            {priceChips.map((pr) => {
              const isActive = (price || '') === pr.val;
              return (
                <Link
                  key={pr.val}
                  href={buildFilterUrl({ price: pr.val || undefined })}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    isActive
                      ? 'bg-bg-subtle text-primary font-semibold border border-border'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {pr.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const trans =
                course.translations.find((t) => t.locale === locale) ||
                course.translations[0];

              const title = trans?.title || 'Untitled Course';
              const slug = trans?.slug || course.id;
              const priceText = course.priceCents === 0 ? t('free') : `$${(course.priceCents / 100).toFixed(2)}`;

              return (
                <CourseCard
                  key={course.id}
                  title={title}
                  instructor={course.instructorName || 'Instructor'}
                  rating={course.ratingAvg || 5.0}
                  reviewCount={course.ratingCount || 10}
                  price={priceText}
                  level={course.level}
                  lessonsCount={10}
                  duration="3h 20m"
                  href={`/courses/${slug}`}
                />
              );
            })}
          </div>

          {/* Keyset Pagination Load More */}
          {nextCursor && (
            <div className="text-center pt-4">
              <Link
                href={buildFilterUrl({ cursor: nextCursor })}
                className="inline-flex items-center justify-center rounded-md border border-border bg-card px-6 py-2.5 text-xs font-semibold text-text hover:bg-bg-subtle focus-ring transition-colors"
              >
                {t('loadMore')}
              </Link>
            </div>
          )}
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
