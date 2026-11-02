'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, ShieldCheck, Calendar, User, ExternalLink } from 'lucide-react';
import { ArrowEnd } from '@/components/ui/directional-icon';
import { cn } from '@/lib/utils';
import type { CertificateDto } from '@sage/shared';

export interface EarnedCertificateCardProps {
  certificate: CertificateDto;
  locale: 'ar' | 'en';
  className?: string;
}

export function EarnedCertificateCard({
  certificate,
  locale,
  className,
}: EarnedCertificateCardProps) {
  const tProfile = useTranslations('profile');

  const title =
    certificate.courseTitle[locale] ||
    certificate.courseTitle.en ||
    certificate.courseTitle.ar ||
    'Scholarly Course';

  let formattedDate = certificate.issuedAt;
  try {
    formattedDate = new Intl.DateTimeFormat(
      locale === 'ar' ? 'ar-EG' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    ).format(new Date(certificate.issuedAt));
  } catch {
    // Keep fallback
  }

  return (
    <Card
      elevation="e2"
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden border border-border p-6 text-start transition-all duration-300 hover:border-accent/60 hover:shadow-e2',
        className
      )}
    >
      {/* Decorative parchment background accent */}
      <div className="absolute -top-10 -end-10 h-32 w-32 rounded-full bg-accent/5 blur-2xl transition-all group-hover:bg-accent/10 pointer-events-none" />

      <div className="space-y-4">
        {/* Top Header: Medallion and Serial */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent shadow-xs">
              <Award className="h-5 w-5" />
            </div>
            <Badge variant="accent" className="font-mono text-xs">
              {certificate.serial}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-sage-700 dark:text-sage-300">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Verified</span>
          </div>
        </div>

        {/* Course Title */}
        <div className="pt-1">
          <h3 className="font-headline text-lg sm:text-xl font-bold tracking-tight text-text transition-colors group-hover:text-primary">
            {title}
          </h3>

          <div className="mt-3 space-y-1.5 text-xs text-text-muted">
            {certificate.studentName && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium text-text">{certificate.studentName}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{tProfile('issuedOn', { date: formattedDate })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <Link
          href={`/verify/${certificate.serial}`}
          className="inline-block w-full"
        >
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center group-hover:border-primary/50 group-hover:bg-primary/5"
          >
            <span>{tProfile('viewVerify')}</span>
            <ArrowEnd className="h-3.5 w-3.5 ms-2" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
