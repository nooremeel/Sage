import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  description,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('p-5 text-start', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-200 text-primary dark:bg-bg-subtle">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-headline text-3xl font-semibold tracking-tight text-text">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold',
              trend.isPositive ? 'text-sage-700 dark:text-sage-300' : 'text-danger'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
    </Card>
  );
}
