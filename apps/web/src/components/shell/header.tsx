'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Illustration } from '@/components/illustrations/illustration';
import { LanguageSwitcher } from '@/components/shell/language-switcher';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: '/', label: tNav('home') },
    { href: '/styleguide', label: tNav('styleguide') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-headline text-2xl font-semibold tracking-tight text-text hover:opacity-90 focus-ring rounded-md"
        >
          <Illustration name="logo-leaf" size={32} wash="amber" />
          <span className="text-primary font-bold">{tCommon('appName')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary focus-ring rounded-xs px-1 py-0.5',
                  isActive ? 'text-primary font-semibold' : 'text-text-muted'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? tNav('close') : tNav('menu')}
            className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-text focus-ring"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer from inline-end */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 flex justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 border-s border-border bg-card p-6 shadow-e2 flex flex-col gap-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'text-base font-medium rounded-md px-3 py-2 transition-colors',
                      isActive
                        ? 'bg-primary-tint text-primary font-semibold'
                        : 'text-text hover:bg-bg-subtle'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
