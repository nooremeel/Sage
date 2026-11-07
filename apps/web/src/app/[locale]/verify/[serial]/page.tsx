import { getTranslations } from 'next-intl/server';
import { ShieldCheck, AlertCircle, Award } from 'lucide-react';
import { ArrowStart } from '@/components/ui/directional-icon';
import { CertificateView } from '@/components/certificates/certificate-view';
import { apiClient } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { getDemoCertificateVerification } from '@/lib/demo-courses';
import type { PublicCertificateVerificationDto } from '@sage/shared';

interface VerifyPageProps {
  params: Promise<{
    locale: string;
    serial: string;
  }>;
}

export async function generateMetadata({ params }: VerifyPageProps) {
  const { locale, serial } = await params;
  let verification: (PublicCertificateVerificationDto & { slug?: string }) | null = null;

  try {
    const res = await apiClient<{ verification: PublicCertificateVerificationDto }>(
      `/certificates/verify/${serial}`
    );
    verification = res.verification;
  } catch {
    verification = getDemoCertificateVerification(serial);
  }

  if (verification && verification.isValid) {
    const title =
      verification.courseTitle[locale] ||
      verification.courseTitle.en ||
      verification.courseTitle.ar ||
      'Course';
    return {
      title: `Certificate Verification (${serial}) — ${verification.studentName} — Sage (سايج)`,
      description: `Official verification of certificate ${serial} awarded to ${verification.studentName} for completing ${title}.`,
    };
  }

  return {
    title: `Certificate Verification (${serial}) — Sage (سايج)`,
  };
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { locale, serial } = await params;
  const currentLocale = (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const t = await getTranslations('Certificates');

  let verification: (PublicCertificateVerificationDto & { slug?: string }) | null = null;

  try {
    const res = await apiClient<{ verification: PublicCertificateVerificationDto & { slug?: string } }>(
      `/certificates/verify/${serial}`
    );
    verification = res.verification;
  } catch {
    // Resilient offline fallback for evaluation & demo certificates
    verification = getDemoCertificateVerification(serial);
  }

  if (!verification || !verification.isValid) {
    return (
      <div className="container mx-auto max-w-2xl py-20 px-4 sm:px-6">
        <div className="rounded-lg border border-danger/40 bg-card p-8 sm:p-12 text-center space-y-6 shadow-e1">
          <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-text rtl:leading-[1.45] rtl:tracking-normal">
              {t('invalidCertificate')}
            </h1>
            <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              {t('invalidCertificateDesc')}
            </p>
          </div>

          <div
            dir="ltr"
            className="inline-block px-4 py-2 rounded bg-paper-200 dark:bg-card border border-border text-xs font-mono font-semibold text-text-muted"
          >
            {serial}
          </div>

          <div className="pt-4">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors focus-ring"
            >
              <ArrowStart className="w-4 h-4" />
              <span>{t('backToCourse')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-10 px-4 sm:px-6 space-y-8">
      {/* Verification Seal Status Banner (Hidden on print) */}
      <div className="rounded-lg border border-sage-700/30 bg-sage-300/15 dark:bg-sage-700/20 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 print:hidden shadow-sm text-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sage-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h2 className="font-headline text-base sm:text-lg font-bold text-text">
              {t('verifiedBySage')}
            </h2>
            <p className="text-xs text-text-muted">
              {t('verifyAuthenticity')} • {t('serialNumber')}:{' '}
              <span dir="ltr" className="font-mono font-medium text-text">
                {verification.serial}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-sage-700 dark:text-sage-300">
          <Award className="w-4 h-4" />
          <span>{verification.studentName}</span>
        </div>
      </div>

      {/* Render Certificate View */}
      <CertificateView
        certificate={verification}
        locale={currentLocale}
        courseSlug={verification.slug}
      />
    </div>
  );
}
