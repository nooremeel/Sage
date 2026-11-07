'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Printer, ShieldCheck, Award } from 'lucide-react';
import { ArrowStart } from '@/components/ui/directional-icon';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { QrCodeSvg } from './qr-code-svg';

export interface CertificateData {
  serial: string;
  studentName: string;
  courseTitle: Record<string, string>;
  instructorName: string;
  issuedAt: string;
}

export interface CertificateViewProps {
  certificate: CertificateData;
  locale: 'ar' | 'en';
  courseSlug?: string;
}

export function CertificateView({
  certificate,
  locale,
  courseSlug,
}: CertificateViewProps) {
  const t = useTranslations('Certificates');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const primaryTitle =
    certificate.courseTitle[locale] ||
    certificate.courseTitle.en ||
    certificate.courseTitle.ar ||
    'Scholarly Course';

  const secondaryTitle =
    locale === 'ar'
      ? certificate.courseTitle.en
      : certificate.courseTitle.ar;

  const formattedDate = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-EG' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  ).format(new Date(certificate.issuedAt));

  const verificationUrl = mounted
    ? `${window.location.origin}/${locale}/verify/${certificate.serial}`
    : `https://sage.academy/${locale}/verify/${certificate.serial}`;

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        {courseSlug ? (
          <Link
            href={`/courses/${courseSlug}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-primary transition-colors focus-ring rounded-xs"
          >
            <ArrowStart className="h-4 w-4" />
            <span>{t('backToCourse')}</span>
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2 border-border shadow-e1 hover:bg-bg-subtle"
          >
            <Printer className="h-4 w-4" />
            <span>{t('printCertificate')}</span>
          </Button>
        </div>
      </div>

      {/* Main Certificate Sheet */}
      <div
        className="relative bg-paper text-ink-900 border-8 border-double border-sage-700/80 dark:border-sage-300/80 rounded-lg p-8 sm:p-14 shadow-e2 overflow-hidden print:border-4 print:border-black print:shadow-none print:m-0 print:p-8 print:bg-white print:text-black"
        style={{ minHeight: '580px' }}
      >
        {/* Decorative Arabesque Watermark Center Insignia */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none print:hidden">
          <svg
            className="w-96 h-96 text-sage-700"
            viewBox="0 0 200 200"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M100 0 L125 75 L200 100 L125 125 L100 200 L75 125 L0 100 L75 75 Z" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="6" />
          </svg>
        </div>

        {/* Certificate Inner Frame */}
        <div className="border border-sage-300 dark:border-sage-700/60 p-6 sm:p-10 text-center flex flex-col justify-between h-full space-y-8 relative z-10 print:border-black">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="font-headline font-bold text-xl sm:text-2xl tracking-wider text-sage-700 dark:text-sage-300 print:text-black">
                SAGE • سايج
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight text-ink-900 print:text-black uppercase rtl:leading-[1.45] rtl:tracking-normal">
                {t('certificateOfCompletion')}
              </h1>
              <p className="text-xs uppercase tracking-widest text-ink-600 print:text-black">
                {t('credentialSubtitle')}
              </p>
            </div>

            <div className="w-24 h-0.5 bg-accent mx-auto print:bg-black" />
          </div>

          {/* Student Recipient Presentation */}
          <div className="space-y-3 my-4">
            <p className="font-headline italic text-sm sm:text-base text-ink-600 print:text-black">
              {t('thisIsToCertify')}
            </p>

            <h2 className="font-headline text-3xl sm:text-5xl font-bold text-primary dark:text-accent print:text-black tracking-wide underline decoration-1 underline-offset-8 decoration-accent/60 rtl:leading-[1.45] rtl:tracking-normal">
              {certificate.studentName}
            </h2>

            <p className="font-headline italic text-sm sm:text-base text-ink-600 print:text-black">
              {t('hasSuccessfullyCompleted')}
            </p>

            <div className="space-y-1 pt-2">
              <h3 className="font-headline text-xl sm:text-3xl font-bold text-ink-900 print:text-black max-w-2xl mx-auto leading-snug rtl:leading-[1.45] rtl:tracking-normal">
                {primaryTitle}
              </h3>
              {secondaryTitle && secondaryTitle !== primaryTitle && (
                <p className="text-xs sm:text-sm text-ink-600 print:text-black font-medium">
                  {secondaryTitle}
                </p>
              )}
            </div>
          </div>

          {/* Footer: Signatures, Stamp & QR Verification */}
          <div className="pt-8 border-t border-border/80 print:border-black grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-start">
            {/* Instructor Signature Block */}
            <div className="space-y-1 text-center sm:text-start">
              <div className="h-10 flex items-end justify-center sm:justify-start">
                <span className="font-headline italic text-lg sm:text-xl text-ink-900 print:text-black select-none">
                  {certificate.instructorName}
                </span>
              </div>
              <div className="w-full max-w-[200px] mx-auto sm:mx-0 border-b border-ink-900/60 print:border-black" />
              <p className="text-xs text-ink-600 print:text-black font-medium">
                {t('instructor')}: {certificate.instructorName}
              </p>
            </div>

            {/* Platform Seal Badge */}
            <div className="flex flex-col items-center justify-center text-center space-y-1.5">
              <div className="w-16 h-16 rounded-full border-2 border-sage-700 dark:border-sage-300 print:border-black flex flex-col items-center justify-center bg-paper-200/50 print:bg-transparent shadow-sm">
                <ShieldCheck className="w-7 h-7 text-sage-700 dark:text-sage-300 print:text-black" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sage-700 dark:text-sage-300 print:text-black">
                {t('verifiedBySage')}
              </span>
              <span className="text-[10px] text-ink-600 print:text-black">
                {t('issuedOn')}: {formattedDate}
              </span>
            </div>

            {/* QR Verification Block */}
            <div className="flex items-center justify-center sm:justify-end gap-3">
              <div className="p-1.5 bg-white border border-border print:border-black rounded shadow-sm shrink-0">
                <QrCodeSvg value={verificationUrl} size={64} />
              </div>
              <div className="space-y-0.5 text-center sm:text-start">
                <div className="text-[10px] font-semibold text-ink-600 print:text-black uppercase tracking-wider">
                  {t('serialNumber')}
                </div>
                <div
                  dir="ltr"
                  className="font-mono text-xs font-bold tracking-wider text-ink-900 print:text-black"
                >
                  {certificate.serial}
                </div>
                <div className="text-[9px] text-ink-600 print:text-black">
                  {t('verifyAuthenticity')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
