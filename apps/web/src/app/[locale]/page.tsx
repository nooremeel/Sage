import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Illustration } from '@/components/illustrations/illustration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ArrowStart, ArrowEnd } from '@/components/ui/directional-icon';
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const tCommon = useTranslations('common');
  const tHome = useTranslations('home');

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-12 text-start">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant="sage" className="gap-1.5 py-1 px-2.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{tHome('status')}</span>
            </Badge>
          </div>

          <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.15]">
            {tHome('heroTitle')}
          </h1>

          <p className="text-lg text-text-muted leading-relaxed max-w-2xl">
            {tHome('heroSubtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button asChild variant="accent" size="lg">
              <Link href="/styleguide" className="gap-2">
                <span>{tHome('viewStyleguide')}</span>
                <ArrowEnd className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/styleguide" className="gap-2">
                <span>{tCommon('learnMore')}</span>
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
            className="drop-shadow-xs"
          />
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
        <Card className="p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-paper-200 text-primary dark:bg-bg-subtle">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-headline text-xl font-semibold text-text">
            حماية البث والمحتوى المرئي
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            تجزئة فيديوهات HLS ورموز تفويض ديناميكية محدودة الوقت لمنع التحميل أو المشاركة غير المصرح بها.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-paper-200 text-primary dark:bg-bg-subtle">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="font-headline text-xl font-semibold text-text">
            معمارية سحابية فورية واقتصادية
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            تشغيل كامل بدون كلفة خوادم مستمرة (Vercel + Neon + Upstash Redis) مع استجابة فائقة السرعة.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-paper-200 text-primary dark:bg-bg-subtle">
            <Illustration name="logo-leaf" size={28} wash="amber" />
          </div>
          <h3 className="font-headline text-xl font-semibold text-text">
            هندسة عربية أصيلة RTL
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            تخطيط منطقي دقيق بالكامل وتطبيع متقدم للبحث العربي في PostgreSQL وتوافق طباعي أكاديمي.
          </p>
        </Card>
      </section>
    </main>
  );
}
