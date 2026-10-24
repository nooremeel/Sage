import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent currentLocale={locale} />;
}

function HomeContent({ currentLocale }: { currentLocale: string }) {
  const tCommon = useTranslations('common');
  const tHome = useTranslations('home');
  const nextLocale = currentLocale === 'ar' ? 'en' : 'ar';
  const nextLocaleLabel = currentLocale === 'ar' ? tCommon('english') : tCommon('arabic');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <span className="font-headline text-2xl font-bold tracking-tight text-primary">
            {tCommon('appName')}
          </span>
          <Link
            href="/"
            locale={nextLocale}
            className="rounded border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-bg-subtle"
          >
            {nextLocaleLabel}
          </Link>
        </div>

        <h1 className="font-headline text-3xl font-semibold text-text">{tHome('welcome')}</h1>
        <p className="mt-2 text-base text-text-muted">{tCommon('tagline')}</p>

        <div className="mt-6 rounded-md bg-bg-subtle p-4 text-start">
          <p className="text-sm font-medium text-text">{tHome('status')}</p>
          <p className="mt-1 text-xs text-text-muted">{tHome('description')}</p>
        </div>
      </div>
    </main>
  );
}
