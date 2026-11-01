'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Ticket, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
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
    } catch (err: any) {
      setErrorMessage(err.message || 'Enrollment failed');
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

    if (!couponCode.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient('/enrollments/coupon', {
        method: 'POST',
        body: JSON.stringify({ courseId, code: couponCode }),
      });
      setIsEnrolled(true);
      if (firstLessonId) {
        router.push(`/${locale}/courses/${courseSlug}/lessons/${firstLessonId}`);
      }
    } catch (err: any) {
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
      <div className="p-6 bg-surface rounded-xl border border-rule animate-pulse">
        <div className="h-6 bg-rule/50 rounded w-1/3 mb-4" />
        <div className="h-10 bg-rule/50 rounded w-full" />
      </div>
    );
  }

  // Already Enrolled View
  if (isEnrolled) {
    return (
      <div className="p-6 bg-surface rounded-xl border border-rule shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sage-700 font-medium text-sm">
          <CheckCircle2 className="w-5 h-5 text-sage-700" />
          <span>{t('alreadyEnrolled')}</span>
        </div>
        <p className="text-xs text-ink-600">{t('readyToLearn')}</p>
        {firstLessonId && (
          <button
            onClick={() =>
              router.push(`/${locale}/courses/${courseSlug}/lessons/${firstLessonId}`)
            }
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-ink-900 hover:bg-blue-800 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
          >
            <span>{t('continueLearning')}</span>
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        )}
      </div>
    );
  }

  // Not Enrolled View
  const isFree = priceCents === 0;

  return (
    <div className="p-6 bg-surface rounded-xl border border-rule shadow-sm space-y-5">
      <div className="flex items-baseline justify-between border-b border-rule/60 pb-4">
        <span className="text-sm text-ink-600 font-medium">{t('courseAccess')}</span>
        <span className="text-2xl font-serif font-bold text-ink-900">
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
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-500/90 text-ink-900 font-semibold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
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
            onClick={handleFreeEnroll}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-500/90 text-ink-900 font-semibold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{t('buyCourse')}</span>
          </button>

          {/* Coupon Accordion */}
          <div className="border-t border-rule/60 pt-3">
            {!showCouponInput ? (
              <button
                type="button"
                onClick={() => setShowCouponInput(true)}
                className="flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-medium"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>{t('haveCoupon')}</span>
              </button>
            ) : (
              <form onSubmit={handleCouponEnroll} className="space-y-2">
                <label className="block text-xs font-medium text-ink-600">
                  {t('couponCodeLabel')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. SAGE100"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-rule focus:outline-none focus:ring-1 focus:ring-blue-700 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !couponCode.trim()}
                    className="px-3 py-1.5 bg-ink-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
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
