import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  asChild?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  asChild = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus-ring disabled:pointer-events-none disabled:opacity-50 select-none';

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-none',
    secondary: 'border border-border bg-card text-text hover:bg-bg-subtle',
    ghost: 'text-text hover:bg-bg-subtle',
    accent: 'bg-accent text-accent-foreground hover:opacity-95 font-semibold',
    destructive: 'bg-danger text-white hover:opacity-90',
  };

  const sizeStyles = {
    sm: 'h-8 rounded-sm px-3 text-xs gap-1.5',
    md: 'h-10 rounded-md px-4 text-sm gap-2',
    lg: 'h-12 rounded-lg px-6 text-base gap-2.5',
    icon: 'h-10 w-10 rounded-md p-0',
  };

  const combinedClass = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  if (asChild) {
    return (
      <Slot className={combinedClass} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={combinedClass}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
      {children}
    </button>
  );
}
