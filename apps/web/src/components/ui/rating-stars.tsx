import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number; // e.g., 4.5
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  count?: number;
  className?: string;
}

export function RatingStars({
  rating,
  max = 5,
  size = 'md',
  showNumber = false,
  count,
  className,
}: RatingStarsProps) {
  const sizeStyles = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const stars = Array.from({ length: max }, (_, i) => {
    const starValue = i + 1;
    const isFilled = rating >= starValue;
    const isHalf = !isFilled && rating >= starValue - 0.5;

    return (
      <span key={i} className="relative inline-block">
        <Star
          className={cn(
            sizeStyles[size],
            'stroke-amber-500 transition-colors',
            isFilled
              ? 'fill-amber-500 text-amber-500'
              : 'fill-transparent text-amber-500/40'
          )}
        />
        {isHalf && (
          <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className={cn(sizeStyles[size], 'fill-amber-500 text-amber-500')} />
          </span>
        )}
      </span>
    );
  });

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Rating: ${rating} out of ${max}`}
    >
      <div className="flex items-center gap-0.5" dir="ltr">
        {stars}
      </div>
      {showNumber && (
        <span className="font-sans text-xs font-semibold text-text">
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-text-muted">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
