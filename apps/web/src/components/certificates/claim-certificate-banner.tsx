'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Award, CheckCircle, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { apiClient } from '@/lib/api';
import type { CourseProgressDto, CertificateDto } from '@sage/shared';

interface ClaimCertificateBannerProps {
  courseId: string;
  courseSlug: string;
  locale: 'ar' | 'en';
}

export function ClaimCertificateBanner({
  courseId,
  courseSlug,
  locale,
}: ClaimCertificateBannerProps) {
  const t = useTranslations('Certificates');
  const [progress, setProgress] = React.useState<CourseProgressDto | null>(null);
  const [existingCert, setExistingCert] = React.useState<CertificateDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [claiming, setClaiming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const [progRes, certsRes] = await Promise.allSettled([
          apiClient<{ courseProgress: CourseProgressDto }>(`/progress/courses/${courseId}`),
          apiClient<{ items: CertificateDto[] }>('/certificates/mine'),
        ]);

        if (!isMounted) return;

        if (progRes.status === 'fulfilled' && progRes.value.courseProgress) {
          setProgress(progRes.value.courseProgress);
        }

        if (certsRes.status === 'fulfilled' && certsRes.value.items) {
          const found = certsRes.value.items.find((c) => c.courseId === courseId);
          if (found) {
            setExistingCert(found);
          }
        }
      } catch {
        // Unauthenticated or not enrolled
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await apiClient<{ certificate: CertificateDto }>(
        `/certificates/claim/${courseId}`,
        {
          method: 'POST',
        }
      );
      setExistingCert(res.certificate);
    } catch (err: any) {
      setError(err?.message || 'Could not claim certificate');
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !progress) {
    return null;
  }

  const isCompleted = progress.percent === 100;

  if (!isCompleted) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <Award className="w-4 h-4 text-accent shrink-0" />
          <span className="text-text font-medium">
            Course Completion: {progress.percent}% ({progress.completedLessons}/{progress.totalLessons} lessons)
          </span>
        </div>
        <div className="w-full sm:w-48 bg-paper-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-accent bg-paper-200/60 dark:bg-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-e1 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 text-start">
        <div className="w-10 h-10 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="font-headline text-base font-bold text-text">
            {t('claimCertificateCelebration')}
          </h4>
          <p className="text-xs text-text-muted">
            {existingCert
              ? `Official Serial: ${existingCert.serial}`
              : 'Claim your verifiable academic certificate of distinction now.'}
          </p>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </div>

      <div>
        {existingCert ? (
          <Link
            href={`/verify/${existingCert.serial}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold hover:bg-accent/90 transition-colors focus-ring shadow-sm"
          >
            <span>{t('viewCertificate')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Button
            size="sm"
            variant="accent"
            onClick={handleClaim}
            disabled={claiming}
            className="flex items-center gap-2 bg-accent text-on-accent hover:bg-accent/90 shadow-sm"
          >
            {claiming ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('claimingCertificate')}</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>{t('claimCertificate')}</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
