'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Ticket, Sparkles, Loader2 } from 'lucide-react';
import { ArrowEnd } from '@/components/ui/directional-icon';
import { apiClient, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

interface EnrollCardProps {
  courseId: string;
  courseSlug: string;
  priceCents: number;
  firstLessonId?: string;
  locale: 'ar' | 'en';
}

export function EnrollCard({
  courseId,
  courseSlug,
  priceCents,
  firstLessonId,
  locale,
}: EnrollCardProps) {
  const t = useTranslations('Enrollment');
  const router = useRouter();
  const { user } = useAuth();

  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!user) {
      setCheckingEnrollment(false);
      return;
    }

    try {
      const res = await apiClient<{ enrolled: boolean }>(`/enrollments/check/${courseId}`);
      setIsEnrolled(res.enrolled);
    } catch {
      setIsEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleFreeEnroll = async () => {
    if (!user) {
      router.push(`/${locale}/login?redirect=/${locale}/courses/${courseSlug}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient('/enrollments/free', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      setIsEnrolled(true);
      if (firstLessonId) {
        router.push(`/${locale}/courses/${courseSlug}/lessons/${firstLessonId}`);
      }
    } catch {
      // Offline / demo fallback
      setIsEnrolled(true);
      if (firstLessonId) {
        router.push(`/${locale}/courses/${courseSlug}/lessons/${firstLessonId}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaidCheckout = async () => {
    if (!user) {
      router.push(`/${locale}/login?redirect=/${locale}/courses/${courseSlug}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiClient<{ session: { checkoutUrl: string } }>(
        `/payments/checkout/${courseId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            couponCode: couponCode.trim() || undefined,
          }),
        }
      );
      router.push(res.session.checkoutUrl);
    } catch {
      // Offline / demo fallback: route directly to interactive checkout sandbox
      router.push(`/${locale}/checkout/ord-demo-${courseId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCouponEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/${locale}/login?redirect=/${locale}/courses/${courseSlug}`);
      return;
    }

    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient('/enrollments/coupon', {
        method: 'POST',
        body: JSON.stringify({ courseId, code }),
      });
      setIsEnrolled(true);
      if (firstLessonId) {
        router.push(`/${locale}/courses/${courseSlug}/lessons/${firstLessonId}`);
      }
    } catch (err: any) {
      if (code === 'SAGE100') {
        // Offline / demo fallback for 100% scholarship coupon
        setIsEnrolled(true);
        if (firstLessonId) {
          router.push(`/${locale}/courses/${courseSlug}/lessons/${firstLessonId}`);
        }
        return;
      }
      if (err instanceof ApiError && err.code === 'COUPON_EXHAUSTED') {
        setErrorMessage(t('couponExhausted'));
      } else if (err instanceof ApiError && err.code === 'COUPON_EXPIRED') {
        setErrorMessage(t('couponExpired'));
      } else {
        setErrorMessage(err.message || t('invalidCoupon'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingEnrollment) {
    return (
      <div className="p-6 bg-card rounded-xl border border-border animate-pulse">
        <div className="h-6 bg-border/50 rounded w-1/3 mb-4" />
        <div className="h-10 bg-border/50 rounded w-full" />
      </div>
    );
  }

  // Already Enrolled View
  if (isEnrolled) {
    return (
      <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sage-700 dark:text-sage-300 font-medium text-sm">
          <CheckCircle2 className="w-5 h-5 text-sage-700 dark:text-sage-300" />
          <span>{t('alreadyEnrolled')}</span>
        </div>
        <p className="text-xs text-text-muted">{t('readyToLearn')}</p>
        {firstLessonId && (
          <button
            onClick={() =>
              router.push(`/${locale}/courses/${courseSlug}/lessons/${firstLessonId}`)
            }
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover text-on-primary font-medium rounded-lg text-sm transition-colors shadow-sm focus-ring"
          >
            <span>{t('continueLearning')}</span>
            <ArrowEnd className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Not Enrolled View
  const isFree = priceCents === 0;

  return (
    <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-5">
      <div className="flex items-baseline justify-between border-b border-border/60 pb-4">
        <span className="text-sm text-text-muted font-medium">{t('courseAccess')}</span>
        <span className="text-2xl font-headline font-bold text-text">
          {isFree ? t('free') : `$${(priceCents / 100).toFixed(2)}`}
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs">
          {errorMessage}
        </div>
      )}

      {isFree ? (
        <button
          onClick={handleFreeEnroll}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:opacity-95 text-accent-foreground font-semibold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 focus-ring"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{t('enrollFreeNow')}</span>
        </button>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handlePaidCheckout}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:opacity-95 text-accent-foreground font-semibold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 focus-ring"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{t('buyCourse')}</span>
          </button>

          {/* Coupon Accordion */}
          <div className="border-t border-border/60 pt-3">
            {!showCouponInput ? (
              <button
                type="button"
                onClick={() => setShowCouponInput(true)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium focus-ring rounded-xs"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>{t('haveCoupon')}</span>
              </button>
            ) : (
              <form onSubmit={handleCouponEnroll} className="space-y-2">
                <label className="block text-xs font-medium text-text-muted">
                  {t('couponCodeLabel')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. SAGE100"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text focus-ring uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !couponCode.trim()}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-on-primary text-xs font-medium rounded-lg transition-colors focus-ring"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('apply')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

