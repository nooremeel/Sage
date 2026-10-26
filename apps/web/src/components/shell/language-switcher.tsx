'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LanguageSwitcherProps {
  className?: string;
  variant?: 'button' | 'compact';
}

export function LanguageSwitcher({ className, variant = 'button' }: LanguageSwitcherProps) {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = currentLocale === 'ar' ? 'en' : 'ar';
  // Always display each language in its own script per blueprint section 10.6
  const nextLocaleLabel = currentLocale === 'ar' ? 'English' : 'العربية';

  const handleToggle = () => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch language to ${nextLocaleLabel}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-bg-subtle focus-ring',
        variant === 'compact' && 'px-2 py-1 text-xs',
        className
      )}
    >
      <Globe className="h-3.5 w-3.5 text-text-muted shrink-0" />
      <span>{nextLocaleLabel}</span>
    </button>
  );
}
