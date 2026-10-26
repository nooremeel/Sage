import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Illustration } from '@/components/illustrations/illustration';

export function Footer() {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');

  return (
    <footer className="mt-auto w-full bg-card/60 transition-colors">
      {/* Editorial Double Rule Signature */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <hr className="rule-double" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-start">
            <div className="flex items-center gap-2">
              <Illustration name="logo-leaf" size={26} wash="amber" />
              <span className="font-headline text-xl font-bold text-primary">
                {tCommon('appName')}
              </span>
            </div>
            <p className="text-xs text-text-muted">{tCommon('tagline')}</p>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <Link href="/" className="hover:text-primary transition-colors">
              {tNav('home')}
            </Link>
            <Link href="/styleguide" className="hover:text-primary transition-colors">
              {tNav('styleguide')}
            </Link>
            <span>·</span>
            <span>{tFooter('copyright')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
