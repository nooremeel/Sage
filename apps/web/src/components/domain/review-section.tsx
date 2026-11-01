'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Star, MessageSquare, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/ui/rating-stars';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { ReviewDto, CourseReviewsResponseDto } from '@sage/shared';

interface ReviewSectionProps {
  courseId: string;
  locale: 'ar' | 'en';
}

export function ReviewSection({ courseId, locale }: ReviewSectionProps) {
  const t = useTranslations('Reviews');
  const { user } = useAuth();

  const [reviews, setReviews] = React.useState<ReviewDto[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [averageRating, setAverageRating] = React.useState(5.0);
  const [loading, setLoading] = React.useState(true);

  // Form states
  const [selectedRating, setSelectedRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchReviews() {
      try {
        const res = await apiClient<CourseReviewsResponseDto>(
          `/reviews/courses/${courseId}`
        );
        if (isMounted) {
          setReviews(res.reviews || []);
          setTotalCount(res.totalCount || 0);
          setAverageRating(res.averageRating || 5.0);
        }
      } catch {
        // Fallback gracefully
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSubmitSuccess(false);

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

      // Optimistically update review list
      setReviews((prev) => {
        const filtered = prev.filter((r) => r.userId !== saved.userId);
        return [saved, ...filtered];
      });

      // Recalculate local stats
      setReviews((currentList) => {
        const newCount = currentList.length;
        const newSum = currentList.reduce((acc, r) => acc + r.rating, 0);
        const newAvg = Number((newSum / (newCount || 1)).toFixed(2));
        setTotalCount(newCount);
        setAverageRating(newAvg);
        return currentList;
      });

      setComment('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Could not submit review. You must be enrolled in the course.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarCount = hoverRating ?? selectedRating;

  return (
    <div className="space-y-6 pt-6 border-t border-border">
      {/* Header & Overall Rating Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 text-start">
          <h2 className="font-headline text-2xl font-bold text-text">
            {t('courseReviews')}
          </h2>
          <p className="text-xs text-text-muted">
            {t('reviewsCount', { count: totalCount })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold font-headline text-text" dir="ltr">
            {averageRating.toFixed(1)}
          </div>
          <RatingStars rating={averageRating} count={totalCount} size="md" />
        </div>
      </div>

      {/* Review Submission Form */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-e1"
        >
          <div className="space-y-1 text-start">
            <h3 className="font-headline text-base font-semibold text-text">
              {t('writeReview')}
            </h3>
            <p className="text-xs text-text-muted">
              {t('rating')}
            </p>
          </div>

          {/* Interactive Star Picker */}
          <div className="flex items-center gap-1.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 rounded transition-transform hover:scale-110 focus-ring"
                aria-label={`Rate ${star} out of 5 stars`}
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    star <= activeStarCount
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-border stroke-current'
                  }`}
                />
              </button>
            ))}
            <span className="ms-2 text-xs font-semibold text-text-muted font-mono">
              {activeStarCount} / 5
            </span>
          </div>

          {/* Optional Review Comment */}
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('shareYourExperience')}
            rows={3}
            maxLength={1000}
            className="w-full text-sm"
          />

          {errorMessage && (
            <p className="text-xs text-danger font-medium text-start">
              {errorMessage}
            </p>
          )}

          {submitSuccess && (
            <div className="flex items-center gap-2 text-xs text-success font-medium text-start">
              <CheckCircle2 className="w-4 h-4" />
              <span>Review submitted successfully!</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
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
      ) : (
        <div className="rounded-lg border border-border bg-paper-200/50 p-4 text-center">
          <p className="text-xs text-text-muted">
            {t('enrollToReview')}
          </p>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-text-muted/60 mx-auto" />
          <h4 className="font-headline text-base font-semibold text-text">
            {t('noReviewsYet')}
          </h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {t('beFirstToReview')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-lg border border-border bg-card p-4 space-y-2 text-start shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-paper-200 text-text font-semibold text-xs flex items-center justify-center shrink-0">
                    {rev.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-text">
                    {rev.userName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <RatingStars rating={rev.rating} size="sm" />
                  <span className="text-[10px] text-text-muted font-mono">
                    {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
                      dateStyle: 'medium',
                    }).format(new Date(rev.createdAt))}
                  </span>
                </div>
              </div>

              {rev.comment && (
                <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line ps-9">
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

