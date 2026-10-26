import * as React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const variantIcons = {
    info: <Info className="h-5 w-5 shrink-0 text-blue-700 dark:text-primary" />,
    success: <CheckCircle2 className="h-5 w-5 shrink-0 text-sage-700 dark:text-sage-300" />,
    warning: <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />,
    danger: <XCircle className="h-5 w-5 shrink-0 text-danger" />,
  };

  const variantStyles = {
    info: 'border-blue-700/20 bg-blue-100/40 text-ink-900 dark:bg-primary-tint/30 dark:text-text',
    success: 'border-sage-700/20 bg-sage-300/20 text-ink-900 dark:bg-sage-700/20 dark:text-text',
    warning: 'border-warning/20 bg-amber-100/50 text-ink-900 dark:bg-amber-500/10 dark:text-text',
    danger: 'border-danger/20 bg-red-100/40 text-ink-900 dark:bg-danger/10 dark:text-text',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 text-start transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variantIcons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-semibold text-sm leading-none mb-1">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
