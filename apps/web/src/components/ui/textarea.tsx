import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ className, hasError, disabled, ...props }: TextareaProps) {
  return (
    <textarea
      disabled={disabled}
      className={cn(
        'flex min-h-[96px] w-full rounded-md border bg-card px-3 py-2 text-sm text-text transition-colors',
        'placeholder:text-text-muted/60',
        'focus-ring',
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
