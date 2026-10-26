import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FieldWrapperProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 text-start', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {required && <span className="ms-1 text-danger">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
