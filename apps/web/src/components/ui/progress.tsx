import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  'aria-label'?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  'aria-label': ariaLabel = 'Progress',
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-paper-200 dark:bg-bg-subtle', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-sage-700 transition-all duration-300 dark:bg-sage-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-label'?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  className,
  'aria-label': ariaLabel = 'Progress ring',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative inline-flex items-center justify-center', className)}
    >
      <svg width={size} height={size} className="-rotate-90 transform" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-paper-200 dark:text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-sage-700 transition-all duration-300 dark:text-sage-300"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
          {children}
        </div>
      )}
    </div>
  );
}
