'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Star, MessageSquare, Send, Loader2, CheckCircle2, ShieldCheck, PenLine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/ui/rating-stars';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  getDemoCourseReviews,
  getDemoRatingDistribution,
  addDemoCourseReview,
  type RatingDistributionData,
} from '@/lib/demo-courses';
import type { ReviewDto, CourseReviewsResponseDto } from '@sage/shared';
import { cn } from '@/lib/utils';

interface ReviewSectionProps {
  courseId: string;
  locale: 'ar' | 'en';
}

export function ReviewSection({ courseId, locale }: ReviewSectionProps) {
  const t = useTranslations('Reviews');
  const { user } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = React.useState<ReviewDto[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [averageRating, setAverageRating] = React.useState(5.0);
  const [loading, setLoading] = React.useState(true);
  const [selectedStarFilter, setSelectedStarFilter] = React.useState<number | null>(null);

  // Form states
  const [showForm, setShowForm] = React.useState(false);
  const [selectedRating, setSelectedRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Initial reviews fetch with offline fallback
  React.useEffect(() => {
    let isMounted = true;

    async function fetchReviews() {
      try {
        const res = await apiClient<CourseReviewsResponseDto>(
          `/reviews/courses/${courseId}`
        );
        if (isMounted) {
          if (res.reviews && res.reviews.length > 0) {
            setReviews(res.reviews);
            setTotalCount(res.totalCount || res.reviews.length);
            setAverageRating(res.averageRating || 5.0);
          } else {
            // Fallback to demo reviews
            const demoList = getDemoCourseReviews(courseId);
            const dist = getDemoRatingDistribution(courseId);
            setReviews(demoList);
            setTotalCount(dist.totalCount);
            setAverageRating(dist.averageRating);
          }
        }
      } catch {
        if (isMounted) {
          const demoList = getDemoCourseReviews(courseId);
          const dist = getDemoRatingDistribution(courseId);
          setReviews(demoList);
          setTotalCount(dist.totalCount);
          setAverageRating(dist.averageRating);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // Dynamic distribution calculation from current review state
  const distributionData: RatingDistributionData = React.useMemo(() => {
    const total = reviews.length;
    const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reviews) {
      const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
      sum += r.rating;
    }

    const calculatedAvg = total > 0 ? Number((sum / total).toFixed(2)) : 5.0;

    return {
      averageRating: calculatedAvg,
      totalCount: total,
      distribution: {
        5: { count: counts[5], percentage: total > 0 ? Math.round((counts[5] / total) * 100) : 0 },
        4: { count: counts[4], percentage: total > 0 ? Math.round((counts[4] / total) * 100) : 0 },
        3: { count: counts[3], percentage: total > 0 ? Math.round((counts[3] / total) * 100) : 0 },
        2: { count: counts[2], percentage: total > 0 ? Math.round((counts[2] / total) * 100) : 0 },
        1: { count: counts[1], percentage: total > 0 ? Math.round((counts[1] / total) * 100) : 0 },
      },
    };
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSubmitSuccess(false);

    const author = {
      id: user?.id || 'usr-student-001',
      name: user?.email ? user.email.split('@')[0] : 'Zaid Al-Harbi (Demo Student)',
    };

    try {
      const res = await apiClient<{ review: ReviewDto }>(
        `/reviews/courses/${courseId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            rating: selectedRating,
            comment: comment.trim() || undefined,
          }),
        }
      );

      const saved = res.review;
      setReviews((prev) => [saved, ...prev.filter((r) => r.userId !== saved.userId)]);
      setSubmitSuccess(true);
      setComment('');
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch {
      // Offline fallback: optimistically add to demo store
      const demoRev = addDemoCourseReview(courseId, {
        rating: selectedRating,
        comment: comment.trim() || undefined,
        user: author,
      });

      setReviews((prev) => [demoRev, ...prev.filter((r) => r.userId !== demoRev.userId)]);
      setTotalCount((c) => c + 1);
      setSubmitSuccess(true);
      setComment('');
      setTimeout(() => setSubmitSuccess(false), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarCount = hoverRating ?? selectedRating;

  // Filter reviews by star level if active
  const displayedReviews = React.useMemo(() => {
    if (selectedStarFilter === null) return reviews;
    return reviews.filter((r) => Math.round(r.rating) === selectedStarFilter);
  }, [reviews, selectedStarFilter]);

  return (
    <div className="space-y-8 pt-8 border-t border-border text-start" data-testid="reviews-section">
      {/* 1. Header & Overall Rating Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="font-headline text-2xl font-bold text-text">
              {t('courseReviews')}
            </h2>
          </div>
          <p className="text-xs text-text-muted">
            {t('reviewsCount', { count: distributionData.totalCount })}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            if (!user) {
              router.push('/login');
              return;
            }
            setShowForm((prev) => !prev);
          }}
          data-testid="write-review-btn"
          className="flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-hover shadow-sm text-xs font-semibold"
          size="sm"
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>{showForm ? t('noReviewsYet') === '' ? 'Close' : 'Cancel' : t('writeReview')}</span>
        </Button>
      </div>

      {/* 2. Academic Rating Breakdown & 5-Bar Histogram Card */}
      <div
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        data-testid="rating-summary"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Big Overall Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-e border-border/70 space-y-2">
            <span
              className="font-headline text-5xl font-extrabold text-text tracking-tight"
              data-testid="average-rating-number"
              dir="ltr"
            >
              {distributionData.averageRating.toFixed(1)}
            </span>
            <RatingStars rating={distributionData.averageRating} size="md" />
            <p className="text-xs font-medium text-text-muted">
              {t('overallRating')} • {t('outOfFive')}
            </p>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-bg-subtle text-text-muted font-mono">
              {t('reviewsCount', { count: distributionData.totalCount })}
            </span>
          </div>

          {/* Right Column: 5-Tier Distribution Histogram */}
          <div className="md:col-span-8 space-y-2.5" data-testid="rating-histogram">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider mb-3">
              {t('ratingBreakdown')}
            </h4>

            {([5, 4, 3, 2, 1] as const).map((star) => {
              const data = distributionData.distribution[star];
              const isSelected = selectedStarFilter === star;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStarFilter(isSelected ? null : star)}
                  data-testid={`histogram-row-${star}`}
                  className={cn(
                    'w-full flex items-center gap-3 p-1 rounded-lg transition-colors group text-start focus-ring',
                    isSelected ? 'bg-primary-tint/40' : 'hover:bg-bg-subtle/50'
                  )}
                >
                  {/* Star Label */}
                  <span className="flex items-center gap-1 min-w-[70px] text-xs font-medium text-text group-hover:text-primary transition-colors">
                    <span>{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  </span>

                  {/* Progress Bar Track */}
                  <div className="flex-1 h-3 bg-bg-subtle rounded-full overflow-hidden relative">
                    <div
                      data-testid={`histogram-bar-${star}`}
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>

                  {/* Percentage & Count */}
                  <div className="flex items-center gap-2 min-w-[75px] justify-end text-xs font-mono text-text-muted">
                    <span className="font-semibold text-text">{data.percentage}%</span>
                    <span>({data.count})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Review Submission Form (Collapsible) */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          data-testid="review-form"
          className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-e2 animate-in fade-in-50 slide-in-from-top-3 duration-200"
        >
          <div className="space-y-1">
            <h3 className="font-headline text-lg font-bold text-text">
              {t('writeReview')}
            </h3>
            <p className="text-xs text-text-muted">
              {t('rating')}
            </p>
          </div>

          {/* Interactive Star Picker */}
          <div className="flex items-center gap-2" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                data-testid={`review-rating-star-${star}`}
                className="p-1 rounded-md transition-transform hover:scale-125 focus-ring"
                aria-label={`Rate ${star} out of 5 stars`}
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= activeStarCount
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-border stroke-current'
                  }`}
                />
              </button>
            ))}
            <span className="ms-2 text-sm font-bold text-accent font-mono">
              {activeStarCount} / 5
            </span>
          </div>

          {/* Review Commentary Textarea */}
          <div className="space-y-1.5">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('shareYourExperience')}
              rows={4}
              maxLength={1000}
              data-testid="review-comment-input"
              className="w-full text-sm rounded-xl border border-border bg-card text-text focus-ring"
              required
            />
            <div className="flex justify-end">
              <span className="text-[11px] text-text-muted font-mono">
                {t('charactersCount', { count: comment.length })}
              </span>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-danger font-medium">
              {errorMessage}
            </p>
          )}

          {submitSuccess && (
            <div className="flex items-center gap-2 text-xs text-success font-medium bg-success-tint/40 p-3 rounded-lg border border-success/30">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>{t('reviewSuccess')}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              data-testid="submit-review-btn"
              className="flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-hover shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('submitting')}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('submitReview')}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* 4. Star Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-3">
        <span className="text-xs font-semibold text-text-muted me-2">
          {t('filterReviews')}:
        </span>
        <button
          type="button"
          onClick={() => setSelectedStarFilter(null)}
          data-testid="filter-star-all"
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-full transition-colors focus-ring',
            selectedStarFilter === null
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-bg-subtle text-text hover:bg-border/60'
          )}
        >
          {t('allRatings')} ({reviews.length})
        </button>

        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = distributionData.distribution[star].count;
          const isSelected = selectedStarFilter === star;

          return (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedStarFilter(isSelected ? null : star)}
              data-testid={`filter-star-${star}`}
              className={cn(
                'flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-colors focus-ring',
                isSelected
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'bg-bg-subtle text-text hover:bg-border/60'
              )}
            >
              <span>{star}</span>
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 5. Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-text-muted/50 mx-auto" />
          <h4 className="font-headline text-lg font-semibold text-text">
            {t('noReviewsYet')}
          </h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {t('beFirstToReview')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((rev) => (
            <div
              key={rev.id}
              data-testid="review-card"
              className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold text-sm flex items-center justify-center shrink-0">
                    {rev.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">
                        {rev.userName}
                      </span>
                      <span
                        data-testid="verified-student-badge"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success-tint/40 text-success text-[10px] font-semibold border border-success/30"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{t('verifiedStudent')}</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-text-muted block">
                      {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
                        dateStyle: 'medium',
                      }).format(new Date(rev.createdAt))}
                    </span>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-2">
                  <RatingStars rating={rev.rating} size="sm" />
                  <span className="text-xs font-bold text-accent font-mono">
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              {rev.comment && (
                <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line ps-12">
                  {rev.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
