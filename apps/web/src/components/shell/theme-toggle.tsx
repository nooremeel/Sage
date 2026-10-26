'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as
      | 'light'
      | 'dark'
      | null;
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.cookie = `sage_theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-text transition-colors hover:bg-bg-subtle focus-ring',
        className
      )}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-text-muted hover:text-text" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500 hover:text-amber-400" />
      )}
    </button>
  );
}
