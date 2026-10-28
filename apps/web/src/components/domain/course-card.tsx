import * as React from 'react';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/ui/rating-stars';
import { Illustration, type IllustrationName } from '@/components/illustrations/illustration';
import { BookOpen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CourseCardProps {
  title: string;
  instructor: string;
  rating: number;
  reviewCount: number;
  price: string;
  level: string;
  lessonsCount: number;
  duration: string;
  categoryIcon?: IllustrationName;
  languageChip?: string;
  href?: string;
  className?: string;
}

export function CourseCard({
  title,
  instructor,
  rating,
  reviewCount,
  price,
  level,
  lessonsCount,
  duration,
  categoryIcon = 'category-code',
  languageChip = 'العربية / EN',
  href,
  className,
}: CourseCardProps) {
  const content = (
    <Card
      elevation="flat"
      className={cn(
        'group flex flex-col overflow-hidden text-start transition-all duration-200 hover:border-primary/40 hover:shadow-e1',
        className
      )}
    >
      {/* Cover / Category Illustration Fallback */}
      <div className="relative flex h-44 w-full items-center justify-center border-b border-border bg-paper-200/60 p-4 transition-colors group-hover:bg-paper-200/90 dark:bg-bg-subtle">
        <Illustration
          name={categoryIcon}
          size={84}
          wash="amber"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute end-3 top-3 flex gap-1.5">
          <Badge variant="secondary">{level}</Badge>
          <Badge variant="default">{languageChip}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-headline text-lg font-semibold tracking-tight text-text line-clamp-2 transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="mt-1 text-xs text-text-muted">{instructor}</p>

        {/* Rating */}
        <div className="mt-3">
          <RatingStars rating={rating} count={reviewCount} showNumber size="sm" />
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex items-center gap-4 text-xs text-text-muted border-t border-border/60 pt-3">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {lessonsCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {duration}
          </span>
          <span className="ms-auto font-headline text-base font-bold text-primary">
            {price}
          </span>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="focus-ring rounded-lg block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
