import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'accent' | 'sage' | 'warning' | 'danger';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide transition-colors';

  const variantStyles = {
    default: 'bg-primary-tint text-primary border border-primary/20',
    secondary: 'bg-bg-subtle text-text-muted border border-border',
    accent: 'bg-amber-100 text-amber-500 border border-amber-500/30 dark:bg-accent/20 dark:text-accent',
    sage: 'bg-sage-300/30 text-sage-700 dark:text-sage-300 border border-sage-700/20',
    warning: 'bg-amber-100 text-warning border border-warning/20',
    danger: 'bg-red-100 text-danger border border-danger/20 dark:bg-danger/20',
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
}
