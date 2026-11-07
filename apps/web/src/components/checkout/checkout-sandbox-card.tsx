'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Tag,
  Sparkles,
  BookOpen,
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { ArrowEnd, ArrowStart } from '@/components/ui/directional-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { validateDemoCoupon, type CouponValidationResult } from '@/lib/demo-courses';
import type { OrderDto } from '@sage/shared';
import { cn } from '@/lib/utils';

export interface CheckoutSandboxCardProps {
  order: OrderDto;
  locale: 'ar' | 'en';
  instructorName?: string;
  durationSec?: number;
  lessonsCount?: number;
  slug?: string;
  firstLessonId?: string;
  referenceCode?: string;
}

export function CheckoutSandboxCard({
  order,
  locale,
  instructorName = 'Nour Emil (نور إميل)',
  durationSec = 2400,
  lessonsCount = 4,
  slug = 'modern-web-architecture',
  firstLessonId = 'les-arch-01-vid',
  referenceCode: initialRefCode,
}: CheckoutSandboxCardProps) {
  const t = useTranslations('Payments');
  const router = useRouter();

  const [status, setStatus] = React.useState<OrderDto['status']>(order.status);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);

  // Test card scenario selector
  const [cardScenario, setCardScenario] = React.useState<'success' | 'fail'>('success');

  const courseTitle =
    order.courseTitle[locale] ||
    order.courseTitle.en ||
    order.courseTitle.ar ||
    'Sage Scholarly Course';

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: order.currency || 'USD',
    }).format(cents / 100);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hours = (mins / 60).toFixed(1);
      return `${hours}h`;
    }
    return `${mins}m`;
  };

  const originalPriceCents = order.amountCents;
  const currentAmountCents = appliedCoupon ? appliedCoupon.finalAmountCents : originalPriceCents;
  const discountCents = appliedCoupon ? appliedCoupon.discountCents : 0;
  const isFree = currentAmountCents === 0;

  const orderReference =
    initialRefCode ||
    `SAGE-ORD-2026-${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase() || 'ALPHA88'}`;

  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponInput.trim();
    if (!code) return;

    setIsApplyingCoupon(true);
    setCouponError(null);

    // Validate coupon code against scholarly rules
    const result = validateDemoCoupon(code, originalPriceCents);
    if (result.valid) {
      setAppliedCoupon(result);
      setCouponError(null);
    } else {
      setAppliedCoupon(null);
      setCouponError(t('invalidCoupon'));
    }
    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const handleSimulate = async (action: 'pay' | 'fail') => {
    setLoadingAction(action);
    setErrorMessage(null);

    try {
      const res = await apiClient<{ status: string; orderId: string }>(
        `/payments/orders/${order.id}/simulate`,
        {
          method: 'POST',
          body: JSON.stringify({ action }),
        }
      );

      if (res.status === 'success') {
        setStatus('completed');
      } else {
        setStatus('failed');
      }
    } catch {
      // Offline fallback: simulate successful/failed state cleanly
      if (action === 'pay') {
        setStatus('completed');
      } else {
        setStatus('failed');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancel = async () => {
    setLoadingAction('cancel');
    setErrorMessage(null);

    try {
      await apiClient(`/payments/orders/${order.id}/cancel`, {
        method: 'POST',
      });
      setStatus('cancelled');
      router.push(`/${locale}/courses`);
    } catch {
      setStatus('cancelled');
      router.push(`/${locale}/courses`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartLearning = () => {
    if (firstLessonId) {
      router.push(`/${locale}/courses/${slug}/lessons/${firstLessonId}`);
    } else {
      router.push(`/${locale}/courses/${slug}`);
    }
  };

  // 1. COMPLETED / SUCCESS RECEIPT STATE
  if (status === 'completed') {
    return (
      <div className="rounded-lg border-2 border-success bg-paper-100/70 dark:bg-card p-6 sm:p-8 space-y-6 shadow-e1 animate-in fade-in duration-300 text-start">
        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-headline text-2xl font-bold text-text">
              {t('paymentSuccessTitle')}
            </h3>
            <p className="text-xs text-text-muted">
              {t('paymentSuccessDesc')}
            </p>
          </div>
        </div>

        {/* Archival Receipt Card */}
        <div className="rounded-md border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-text">
                {t('officialReceipt')}
              </span>
            </div>
            <span dir="ltr" className="font-mono text-xs font-semibold text-text-muted">
              {orderReference}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-muted">{t('orderSummary')}</span>
              <span className="font-semibold text-text text-end">{courseTitle}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-muted">{t('instructorLabel')}</span>
              <span className="font-medium text-text">{instructorName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-muted">{t('unlimitedAccess')}</span>
              <span className="text-success font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between py-1 border-b border-border/40 text-accent">
                <span>{t('couponApplied', { code: appliedCoupon.code, percent: appliedCoupon.discountPercent })}</span>
                <span dir="ltr">-{formatPrice(discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-sm font-bold">
              <span className="text-text">{t('totalDue')}</span>
              <span className="font-headline text-base text-primary dark:text-accent" dir="ltr">
                {isFree ? '$0.00 USD' : formatPrice(currentAmountCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="accent"
            size="lg"
            onClick={handleStartLearning}
            className="flex items-center gap-2 font-semibold shadow-sm"
          >
            <span>{t('startLearning')}</span>
            <ArrowEnd className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push(`/${locale}/courses`)}
            className="text-xs"
          >
            {t('returnToCatalog')}
          </Button>
        </div>
      </div>
    );
  }

  // 2. CANCELLED STATE
  if (status === 'cancelled') {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-paper-200 text-text-muted flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-headline text-xl font-bold text-text">
            {t('orderCancelledTitle')}
          </h3>
          <p className="text-xs text-text-muted">
            {t('orderCancelledDesc')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/${locale}/courses`)}
          className="mx-auto"
        >
          {t('returnToCatalog')}
        </Button>
      </div>
    );
  }

  // 3. MAIN CHECKOUT CARD WITH PROMOTIONAL COUPONS & TEST CARDS
  return (
    <div className="space-y-6">
      {/* Detailed Order Breakdown Card */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-5 shadow-sm text-start">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-headline text-base font-bold text-text">
            {t('orderSummary')}
          </h2>
          <span dir="ltr" className="font-mono text-xs text-text-muted">
            {orderReference}
          </span>
        </div>

        {/* Course Details Snippet */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text leading-snug">
                {courseTitle}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-text-muted" />
                  <span>{instructorName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-text-muted" />
                  <span>{t('lessonsCount', { count: lessonsCount })}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  <span>{t('durationLabel', { duration: formatDuration(durationSec) })}</span>
                </span>
              </div>
            </div>

            <div className="font-headline text-lg font-bold text-text shrink-0" dir="ltr">
              {formatPrice(originalPriceCents)}
            </div>
          </div>

          <p className="text-xs text-text-muted pt-1">
            {t('unlimitedAccess')}
          </p>
        </div>

        {/* Promotional Coupon Redemption */}
        <div className="rounded-md border border-border/70 bg-paper-100/60 dark:bg-card/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="coupon-input" className="text-xs font-semibold text-text flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>{t('couponLabel')}</span>
            </label>
            {appliedCoupon && (
              <Badge variant="sage" className="text-[11px] font-bold">
                {appliedCoupon.code === 'SAGE100' ? t('freeEnrollmentBadge') : `${appliedCoupon.discountPercent}% Off`}
              </Badge>
            )}
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded bg-success/10 border border-success/30 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-success font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t('couponApplied', { code: appliedCoupon.code, percent: appliedCoupon.discountPercent })}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-xs text-danger hover:underline font-medium focus-ring rounded-xs px-1"
              >
                {t('removeCoupon')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                id="coupon-input"
                type="text"
                dir="ltr"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder={t('couponPlaceholder')}
                className="flex-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-mono uppercase text-text focus-ring"
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={isApplyingCoupon || !couponInput.trim()}
                className="text-xs shrink-0"
              >
                {isApplyingCoupon ? t('applyingCoupon') : t('applyCoupon')}
              </Button>
            </form>
          )}

          {couponError && (
            <p className="text-xs text-danger font-medium">{couponError}</p>
          )}

          {/* Quick Click Demo Coupons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted pt-1">
            <span>Try:</span>
            <button
              type="button"
              onClick={() => {
                setCouponInput('SAGE100');
                const res = validateDemoCoupon('SAGE100', originalPriceCents);
                setAppliedCoupon(res);
                setCouponError(null);
              }}
              className="px-2 py-0.5 rounded bg-paper-200 dark:bg-card border border-border hover:border-accent text-accent font-mono text-[11px] font-bold"
            >
              SAGE100 (100% Free)
            </button>
            <button
              type="button"
              onClick={() => {
                setCouponInput('SCHOLAR50');
                const res = validateDemoCoupon('SCHOLAR50', originalPriceCents);
                setAppliedCoupon(res);
                setCouponError(null);
              }}
              className="px-2 py-0.5 rounded bg-paper-200 dark:bg-card border border-border hover:border-accent font-mono text-[11px]"
            >
              SCHOLAR50 (50% Off)
            </button>
            <button
              type="button"
              onClick={() => {
                setCouponInput('WELCOME20');
                const res = validateDemoCoupon('WELCOME20', originalPriceCents);
                setAppliedCoupon(res);
                setCouponError(null);
              }}
              className="px-2 py-0.5 rounded bg-paper-200 dark:bg-card border border-border hover:border-accent font-mono text-[11px]"
            >
              WELCOME20 (20% Off)
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-border pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>{t('originalPrice')}</span>
            <span dir="ltr">{formatPrice(originalPriceCents)}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between text-accent font-semibold">
              <span>{t('discount')} ({appliedCoupon.code})</span>
              <span dir="ltr">-{formatPrice(discountCents)}</span>
            </div>
          )}

          <div className="border-t border-border/60 pt-2 flex items-center justify-between text-sm font-bold">
            <span className="text-text">{t('totalDue')}</span>
            <span className="font-headline text-xl font-bold text-primary dark:text-accent" dir="ltr">
              {isFree ? '$0.00 USD' : formatPrice(currentAmountCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Sandbox Test Cards & Gateway Simulation */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-6 shadow-e1 text-start">
        {/* Sandbox Notice Banner */}
        <div className="rounded-md border border-accent/40 bg-accent/10 p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-text">
              {t('sandboxModeTitle')}
            </h4>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {t('sandboxModeNotice')}
            </p>
          </div>
        </div>

        {/* 1-Click Sandbox Test Card Selector */}
        {!isFree && (
          <div className="space-y-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-text flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                <span>{t('testCardsTitle')}</span>
              </h4>
              <p className="text-[11px] text-text-muted">
                {t('testCardsSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Success Card */}
              <button
                type="button"
                onClick={() => {
                  setCardScenario('success');
                  setErrorMessage(null);
                }}
                className={cn(
                  'rounded-lg border p-3.5 text-start space-y-2 transition-all focus-ring',
                  cardScenario === 'success'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-card hover:bg-paper-100/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>{t('testCardSuccessName')}</span>
                  </span>
                  <Badge variant="sage" className="text-[10px]">
                    3D-Secure Valid
                  </Badge>
                </div>
                <div dir="ltr" className="font-mono text-xs text-text-muted">
                  •••• •••• •••• 4242
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  {t('testCardSuccessDesc')}
                </p>
              </button>

              {/* Option B: Fail Card */}
              <button
                type="button"
                onClick={() => {
                  setCardScenario('fail');
                  setErrorMessage(null);
                }}
                className={cn(
                  'rounded-lg border p-3.5 text-start space-y-2 transition-all focus-ring',
                  cardScenario === 'fail'
                    ? 'border-danger bg-danger/5 ring-1 ring-danger'
                    : 'border-border bg-card hover:bg-paper-100/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                    <span>{t('testCardFailName')}</span>
                  </span>
                  <Badge variant="danger" className="text-[10px]">
                    402 Declined
                  </Badge>
                </div>
                <div dir="ltr" className="font-mono text-xs text-text-muted">
                  •••• •••• •••• 0002
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  {t('testCardFailDesc')}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {status === 'failed' && (
          <div className="rounded-md border border-danger/40 bg-danger/10 p-3.5 flex items-start gap-3 text-start text-danger animate-in fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <h5 className="font-semibold">{t('paymentFailedTitle')}</h5>
              <p>{t('paymentFailedDesc')}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="text-xs text-danger text-start font-medium">
            {errorMessage}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {isFree ? (
            <Button
              variant="accent"
              size="lg"
              onClick={() => handleSimulate('pay')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm"
            >
              {loadingAction === 'pay' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('processingPayment')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('freeEnrollmentAction')}</span>
                </>
              )}
            </Button>
          ) : cardScenario === 'success' ? (
            <Button
              variant="accent"
              size="lg"
              onClick={() => handleSimulate('pay')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm"
            >
              {loadingAction === 'pay' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('processingPayment')}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {t('payAmount', {
                      amount: formatPrice(currentAmountCents),
                    })}
                  </span>
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleSimulate('fail')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-center gap-2 font-semibold border-danger/50 text-danger hover:bg-danger/10 shadow-sm"
            >
              {loadingAction === 'fail' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('processingPayment')}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-danger" />
                  <span>{t('simulateFailure')}</span>
                </>
              )}
            </Button>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-text-muted flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>{t('securityGuarantee')}</span>
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={loadingAction !== null}
              className="text-xs text-text-muted hover:text-danger hover:bg-danger/10 px-2"
            >
              <XCircle className="w-3.5 h-3.5 me-1" />
              <span>{t('cancelOrder')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
