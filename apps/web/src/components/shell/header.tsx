'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Illustration } from '@/components/illustrations/illustration';
import { LanguageSwitcher } from '@/components/shell/language-switcher';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Menu, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
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
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* User Auth Action (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            {!isLoading && (
              user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 text-xs font-medium text-text hover:text-primary border border-border rounded-md px-2.5 py-1.5 focus-ring"
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {tNav('login')}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="accent" size="sm">
                      {tNav('signup')}
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>

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
          <div className="relative w-64 border-s border-border bg-card p-6 shadow-e2 flex flex-col justify-between">
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

            <div className="pt-6 border-t border-border flex flex-col gap-2">
              {!isLoading && (
                user ? (
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md p-2 text-sm font-medium text-text hover:bg-bg-subtle"
                  >
                    <User className="h-4 w-4 text-primary" />
                    <span>{tNav('profile')}</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="secondary" className="w-full">
                        {tNav('login')}
                      </Button>
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="accent" className="w-full">
                        {tNav('signup')}
                      </Button>
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
