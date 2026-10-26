import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, type = 'text', hasError, disabled, ...props }: InputProps) {
  return (
    <input
      type={type}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full rounded-md border bg-card px-3 py-2 text-sm text-text transition-colors',
        'placeholder:text-text-muted/60',
        'focus-ring file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:cursor-not-allowed disabled:opacity-50',
        hasError
          ? 'border-danger focus-visible:outline-danger'
          : 'border-border hover:border-text-muted/40',
        className
      )}
      {...props}
    />
  );
}
