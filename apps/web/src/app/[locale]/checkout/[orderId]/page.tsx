import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ShoppingBag, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { CheckoutSandboxCard } from '@/components/checkout/checkout-sandbox-card';
import { apiClient } from '@/lib/api';
import { Link } from '@/i18n/routing';
import type { OrderDto } from '@sage/shared';

interface CheckoutPageProps {
  params: Promise<{
    locale: string;
    orderId: string;
  }>;
}

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { locale, orderId } = await params;
  return {
    title: `Checkout (${orderId.slice(0, 8)}) — Sage (سايج)`,
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale, orderId } = await params;
  const currentLocale = (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const t = await getTranslations('Payments');

  let order: OrderDto;
  try {
    const res = await apiClient<{ order: OrderDto }>(`/payments/orders/${orderId}`);
    order = res.order;
  } catch {
    notFound();
  }

  const courseTitle =
    order.courseTitle[currentLocale] ||
    order.courseTitle.en ||
    order.courseTitle.ar ||
    'Sage Course';

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4 sm:px-6 space-y-8">
      {/* Breadcrumb / Back link */}
      <div className="flex items-center gap-2 text-xs text-text-muted text-start">
        <Link href="/courses" className="hover:text-primary transition-colors flex items-center gap-1.5">
          {currentLocale === 'ar' ? (
            <ArrowRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowLeft className="w-3.5 h-3.5" />
          )}
          <span>{t('returnToCatalog')}</span>
        </Link>
      </div>

      {/* Page Title */}
      <div className="space-y-1 text-start">
        <div className="flex items-center gap-2 text-accent">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-xs uppercase font-bold tracking-wider">
            {t('orderCheckout')}
          </span>
        </div>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold text-text">
          {t('checkoutTitle')}
        </h1>
        <p className="text-xs text-text-muted">
          Order Reference:{' '}
          <span dir="ltr" className="font-mono font-medium text-text">
            {order.id}
          </span>
        </p>
      </div>

      {/* Order Summary Receipt */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm text-start">
        <h2 className="font-headline text-base font-bold text-text border-b border-border pb-3">
          {t('orderSummary')}
        </h2>

        <div className="flex items-baseline justify-between gap-4">
          <div className="space-y-0.5 max-w-sm">
            <h3 className="text-sm font-semibold text-text">{courseTitle}</h3>
            <p className="text-xs text-text-muted">{t('unlimitedAccess')}</p>
          </div>
          <div className="font-headline text-lg font-bold text-text" dir="ltr">
            ${(order.amountCents / 100).toFixed(2)}
          </div>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-text">{t('totalDue')}</span>
          <span className="font-headline text-xl font-bold text-primary dark:text-accent" dir="ltr">
            ${(order.amountCents / 100).toFixed(2)} {order.currency}
          </span>
        </div>
      </div>

      {/* Interactive Sandbox Payment Card */}
      <CheckoutSandboxCard order={order} locale={currentLocale} />
    </div>
  );
}
