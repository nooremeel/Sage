import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Illustration } from '@/components/illustrations/illustration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RatingStars } from '@/components/ui/rating-stars';
import { CourseCard } from '@/components/domain/course-card';
import { ArrowEnd } from '@/components/ui/directional-icon';
import {
  DEMO_CATEGORIES,
  DEMO_TESTIMONIALS,
  getDemoCourses,
} from '@/lib/demo-courses';
import {
  CheckCircle2,
  ShieldCheck,
  Award,
  BookOpen,
  Quote,
  Sparkles,
} from 'lucide-react';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = locale as 'ar' | 'en';

  const tHome = await getTranslations('home');
  const tCatalog = await getTranslations('catalog');

  // Featured Courses (curated selection of 3 top-rated courses)
  const allCourses = getDemoCourses();
  const featuredCourses = allCourses.slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-20 sm:space-y-24">
      {/* 1. Scholarly Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-10 sm:gap-14 text-start pt-4 sm:pt-8">
        <div className="flex-1 space-y-6 rtl:space-y-7">
          <div className="flex items-center gap-2">
            <Badge variant="sage" className="gap-1.5 py-1 px-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span className="font-medium text-xs">{tHome('status')}</span>
            </Badge>
          </div>

          <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.18] rtl:leading-[1.45] rtl:tracking-normal">
            {tHome('heroTitle')}
          </h1>

          <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl">
            {tHome('heroSubtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button asChild variant="accent" size="lg" className="gap-2 shadow-xs">
              <Link href="/courses">
                <span>{tHome('exploreCourses')}</span>
                <ArrowEnd className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="gap-2">
              <Link href="/courses?category=islamic-arts">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{tHome('browseArts')}</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <Illustration
            name="hero-study"
            size={320}
            wash="amber"
            title="Scholarly study scene"
            className="drop-shadow-xs transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      </section>

      {/* 2. Category Explorer Grid */}
      <section className="space-y-8 text-start" data-testid="category-explorer">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="default" className="w-fit text-xs">
              {tHome('categoriesBadge')}
            </Badge>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-text rtl:leading-[1.4] rtl:tracking-normal">
              {tHome('categoriesTitle')}
            </h2>
            <p className="text-sm text-text-muted max-w-xl">
              {tHome('categoriesSubtitle')}
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-end"
          >
            <span>{tHome('viewCatalog')}</span>
            <ArrowEnd className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/courses?category=${cat.slug}`}
              className="group block"
              data-testid={`category-card-${cat.slug}`}
            >
              <Card className="h-full p-6 space-y-4 border border-border/80 bg-card transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-e1">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-paper-200/80 p-2 dark:bg-bg-subtle">
                    <Illustration
                      name={cat.icon}
                      size={42}
                      wash="amber"
                      className="transition-transform duration-200 group-hover:scale-110"
                    />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tHome('coursesCount', { count: cat.courseCount })}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-headline text-lg font-bold text-text transition-colors group-hover:text-primary">
                    {cat.name[activeLocale]}
                  </h3>
                  <p className="mt-2 text-xs text-text-muted leading-relaxed line-clamp-2">
                    {cat.description[activeLocale]}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-1 text-xs font-medium text-primary">
                  <span>{tCatalog('searchBtn')}</span>
                  <ArrowEnd className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Courses Showcase */}
      <section className="space-y-8 text-start" data-testid="featured-courses">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="accent" className="w-fit text-xs">
              {tHome('featuredBadge')}
            </Badge>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-text rtl:leading-[1.4] rtl:tracking-normal">
              {tHome('featuredTitle')}
            </h2>
            <p className="text-sm text-text-muted max-w-xl">
              {tHome('featuredSubtitle')}
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-end"
          >
            <span>{tHome('viewAllCourses')}</span>
            <ArrowEnd className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.map((c) => {
            const trans =
              c.translations.find((t) => t.locale === activeLocale) ||
              c.translations[0];
            const sections = c.sections || [];
            const lessonsCount = sections.reduce(
              (acc, s) => acc + (s.lessons?.length || 0),
              0
            );
            const totalSec = sections.reduce(
              (acc, s) =>
                acc +
                (s.lessons || []).reduce((lAcc, l) => lAcc + (l.durationSec || 0), 0),
              0
            );
            const durationHours = `${(totalSec / 3600).toFixed(1)} ${tCatalog('hours')}`;
            const price =
              c.priceCents === 0
                ? tCatalog('free')
                : `$${(c.priceCents / 100).toFixed(0)}`;
            const categoryIcon =
              c.categoryId === 'cat-eng-001'
                ? 'category-code'
                : c.categoryId === 'cat-arts-002'
                  ? 'category-design'
                  : 'category-business';

            return (
              <CourseCard
                key={c.id}
                title={trans?.title || ''}
                instructor={c.instructorName || ''}
                rating={c.ratingAvg}
                reviewCount={c.ratingCount}
                price={price}
                level={c.level}
                lessonsCount={lessonsCount}
                duration={durationHours}
                categoryIcon={categoryIcon}
                href={`/courses/${trans?.slug || c.id}`}
              />
            );
          })}
        </div>
      </section>

      {/* 4. Scholarly Pedagogical Pillars */}
      <section className="space-y-8 text-start" data-testid="pedagogical-pillars">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <Badge variant="sage" className="mx-auto text-xs">
            {tHome('pillarsBadge')}
          </Badge>
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-text rtl:leading-[1.4] rtl:tracking-normal">
            {tHome('pillarsTitle')}
          </h2>
          <p className="text-sm text-text-muted">
            {tHome('pillarsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 border border-border/80 bg-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-paper-200 text-primary dark:bg-bg-subtle">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-headline text-lg font-bold text-text">
              {tHome('pillar1Title')}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {tHome('pillar1Desc')}
            </p>
          </Card>

          <Card className="p-6 space-y-4 border border-border/80 bg-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-paper-200 text-primary dark:bg-bg-subtle">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-headline text-lg font-bold text-text">
              {tHome('pillar2Title')}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {tHome('pillar2Desc')}
            </p>
          </Card>

          <Card className="p-6 space-y-4 border border-border/80 bg-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-paper-200 text-primary dark:bg-bg-subtle">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-headline text-lg font-bold text-text">
              {tHome('pillar3Title')}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {tHome('pillar3Desc')}
            </p>
          </Card>
        </div>
      </section>

      {/* 5. Student Testimonials Showcase */}
      <section className="space-y-8 text-start" data-testid="student-testimonials">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <Badge variant="accent" className="mx-auto text-xs">
            {tHome('testimonialsBadge')}
          </Badge>
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-text rtl:leading-[1.4] rtl:tracking-normal">
            {tHome('testimonialsTitle')}
          </h2>
          <p className="text-sm text-text-muted">
            {tHome('testimonialsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_TESTIMONIALS.map((test) => (
            <Card
              key={test.id}
              className="flex flex-col justify-between p-6 space-y-4 border border-border/80 bg-card hover:border-primary/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <RatingStars rating={test.rating} count={test.rating} size="sm" />
                  <Quote className="h-4 w-4 text-accent/60" />
                </div>
                <p className="font-serif italic text-xs text-text leading-relaxed rtl:font-sans rtl:not-italic rtl:text-xs">
                  &ldquo;{test.quote[activeLocale]}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-200 text-primary font-bold text-xs dark:bg-bg-subtle">
                  {test.avatarSeed}
                </div>
                <div className="min-w-0">
                  <h4 className="font-headline text-xs font-bold text-text truncate">
                    {test.author[activeLocale]}
                  </h4>
                  <p className="text-[11px] text-text-muted truncate">
                    {test.role[activeLocale]}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Closing Scholarly Call to Action */}
      <section className="rounded-xl border border-border/90 bg-paper-200/50 p-8 sm:p-12 text-center space-y-6 shadow-xs dark:bg-bg-subtle/50">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-xs border border-border">
          <Sparkles className="h-6 w-6 text-accent" />
        </div>
        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-text rtl:leading-[1.4] rtl:tracking-normal">
            {tHome('ctaTitle')}
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            {tHome('ctaSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button asChild variant="accent" size="lg" className="shadow-xs">
            <Link href="/courses">
              <span>{tHome('ctaButton')}</span>
              <ArrowEnd className="h-4 w-4 ms-1" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/login">
              <span>{tHome('ctaSecondary')}</span>
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
