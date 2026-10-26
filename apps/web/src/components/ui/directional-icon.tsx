import * as React from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DirectionalIconProps extends React.SVGAttributes<SVGSVGElement> {
  className?: string;
}

/**
 * Arrow that points toward the inline-end (forward in reading direction: right in LTR, left in RTL).
 */
export function ArrowEnd({ className, ...props }: DirectionalIconProps) {
  return (
    <ArrowRight
      className={cn('inline-block shrink-0 rtl:-scale-x-100 transition-transform', className)}
      {...props}
    />
  );
}

/**
 * Arrow that points toward the inline-start (backward in reading direction: left in LTR, right in RTL).
 */
export function ArrowStart({ className, ...props }: DirectionalIconProps) {
  return (
    <ArrowLeft
      className={cn('inline-block shrink-0 rtl:-scale-x-100 transition-transform', className)}
      {...props}
    />
  );
}

/**
 * Chevron pointing toward inline-end.
 */
export function ChevronEnd({ className, ...props }: DirectionalIconProps) {
  return (
    <ChevronRight
      className={cn('inline-block shrink-0 rtl:-scale-x-100 transition-transform', className)}
      {...props}
    />
  );
}

/**
 * Chevron pointing toward inline-start.
 */
export function ChevronStart({ className, ...props }: DirectionalIconProps) {
  return (
    <ChevronLeft
      className={cn('inline-block shrink-0 rtl:-scale-x-100 transition-transform', className)}
      {...props}
    />
  );
}
