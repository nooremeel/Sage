import * as React from 'react';
import { cn } from '@/lib/utils';

export type IllustrationName =
  | 'logo-leaf'
  | 'hero-study'
  | 'empty-courses'
  | 'empty-enrollments'
  | 'empty-notifications'
  | 'empty-qa'
  | 'empty-search'
  | 'empty-404'
  | 'category-code'
  | 'category-design'
  | 'category-business'
  | 'category-language'
  | 'upload-quill'
  | 'upload-leaf'
  | 'flourish-squiggle'
  | 'certificate-border';

export interface IllustrationProps extends React.SVGAttributes<SVGSVGElement> {
  name: IllustrationName;
  wash?: 'amber' | 'sage';
  size?: number | string;
  title?: string;
  decorative?: boolean;
}

export function Illustration({
  name,
  wash = 'amber',
  size = 120,
  title,
  decorative = true,
  className,
  ...props
}: IllustrationProps) {
  const washFill = wash === 'amber' ? 'var(--amber-500)' : 'var(--sage-300)';

  const renderContent = () => {
    switch (name) {
      case 'logo-leaf':
        return (
          <>
            {/* Misregistered offset wash */}
            <path
              d="M32 44C30 30 42 16 54 14C56 26 48 40 38 46Z"
              fill={washFill}
              fillOpacity="0.45"
              transform="translate(4, -3)"
            />
            {/* Hand-drawn ink line work */}
            <path
              d="M28 50C28 35 40 18 54 16C54 32 44 48 30 52C26 53 28 50 28 50Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Central vein with hatching */}
            <path
              d="M30 48C36 38 44 28 52 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M35 41L39 43M40 34L45 37M45 27L49 30"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </>
        );

      case 'hero-study':
        return (
          <>
            {/* Wash under books and desk */}
            <rect
              x="25"
              y="55"
              width="150"
              height="35"
              rx="4"
              fill={washFill}
              fillOpacity="0.35"
              transform="rotate(-1 100 70)"
            />
            {/* Desk line */}
            <path
              d="M15 88C60 87 140 88 185 87"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Stack of scholarly books */}
            <path
              d="M40 86L95 84C98 84 99 76 96 76L42 78C38 78 37 86 40 86Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M45 76L92 74C95 74 96 66 93 66L47 68C43 68 42 76 45 76Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Open book on reading stand */}
            <path
              d="M110 86L135 60C145 64 155 64 165 60L168 84C158 88 145 88 135 84L110 86Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M148 62V86"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Subtle hatching */}
            <path
              d="M138 68L145 67M138 74L145 73M152 67L160 68M152 73L160 74"
              stroke="currentColor"
              strokeWidth="1"
            />
          </>
        );

      case 'empty-courses':
        return (
          <>
            <circle cx="50" cy="50" r="32" fill={washFill} fillOpacity="0.3" transform="translate(6, 4)" />
            {/* Open parchment */}
            <path
              d="M24 35C38 31 62 31 76 35V65C62 61 38 61 24 65Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M50 33V63" stroke="currentColor" strokeWidth="1.6" />
            <path d="M30 42H44M30 48H42M56 42H70M56 48H66" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        );

      case 'empty-enrollments':
        return (
          <>
            <rect x="28" y="24" width="40" height="52" rx="4" fill={washFill} fillOpacity="0.35" transform="rotate(4 48 50)" />
            <rect x="26" y="22" width="44" height="56" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
            {/* Ribbon bookmark */}
            <path d="M42 22V46L48 40L54 46V22" fill={washFill} fillOpacity="0.7" stroke="currentColor" strokeWidth="1.5" />
          </>
        );

      case 'empty-notifications':
        return (
          <>
            <circle cx="52" cy="46" r="24" fill={washFill} fillOpacity="0.35" />
            <path
              d="M50 20C40 20 34 28 34 42C30 46 26 50 26 56H74C74 50 70 46 66 42C66 28 60 20 50 20Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M44 58C44 62 46 66 50 66C54 66 56 62 56 58" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="16" r="2" fill="currentColor" />
          </>
        );

      case 'empty-qa':
        return (
          <>
            <ellipse cx="44" cy="40" rx="26" ry="18" fill={washFill} fillOpacity="0.35" transform="translate(4, -2)" />
            <path
              d="M20 40C20 28 32 20 48 20C64 20 76 28 76 40C76 50 66 58 52 59L40 68V58C28 56 20 49 20 40Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="36" cy="38" r="2" fill="currentColor" />
            <circle cx="48" cy="38" r="2" fill="currentColor" />
            <circle cx="60" cy="38" r="2" fill="currentColor" />
          </>
        );

      case 'empty-search':
        return (
          <>
            <circle cx="44" cy="42" r="20" fill={washFill} fillOpacity="0.35" transform="translate(3, 3)" />
            <circle cx="42" cy="40" r="18" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="M56 54L72 70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M34 36L44 32" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        );

      case 'empty-404':
        return (
          <>
            <circle cx="50" cy="50" r="28" fill={washFill} fillOpacity="0.3" />
            <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M50 28L54 48L68 50L54 52L50 72L46 52L32 50L46 48Z" fill={washFill} fillOpacity="0.6" stroke="currentColor" strokeWidth="1.6" />
          </>
        );

      case 'category-code':
        return (
          <>
            <rect x="18" y="24" width="64" height="48" rx="6" fill={washFill} fillOpacity="0.3" transform="translate(3, -2)" />
            <rect x="16" y="22" width="68" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M32 42L26 48L32 54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M46 42L52 48L46 54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M41 38L37 58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </>
        );

      case 'category-design':
        return (
          <>
            <path
              d="M30 64C22 56 22 40 32 30C42 20 58 20 68 28C76 36 74 52 64 62C56 70 42 72 30 64Z"
              fill={washFill}
              fillOpacity="0.35"
              transform="translate(4, -3)"
            />
            <path
              d="M28 62C20 54 20 38 30 28C40 18 56 18 66 26C74 34 72 50 62 60C54 68 40 70 28 62Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="40" cy="34" r="3" fill="currentColor" />
            <circle cx="56" cy="34" r="3" fill="currentColor" />
            <circle cx="62" cy="48" r="3" fill="currentColor" />
            <circle cx="42" cy="56" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </>
        );

      case 'category-business':
        return (
          <>
            <polygon points="26,68 44,52 60,60 76,40 76,70 26,70" fill={washFill} fillOpacity="0.35" />
            <path d="M24 70H78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M26 68L44 50L58 58L76 38" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M68 38H76V46" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'category-language':
        return (
          <>
            <rect x="22" y="24" width="34" height="48" rx="3" fill={washFill} fillOpacity="0.35" transform="rotate(-6 39 48)" />
            <rect x="42" y="26" width="34" height="48" rx="3" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(6 59 50)" />
            <path d="M30 40H40M30 48H38M50 42H60M50 50H58" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </>
        );

      case 'upload-quill':
        return (
          <>
            <path d="M68 20C50 30 36 48 30 70L40 72C48 54 62 38 72 24Z" fill={washFill} fillOpacity="0.4" />
            <path d="M72 18C48 26 34 46 26 72L34 70C42 50 58 34 76 20Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M26 72L22 76L30 74" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M42 46L54 48M36 58L46 60" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        );

      case 'upload-leaf':
        return (
          <>
            <circle cx="50" cy="50" r="28" fill={washFill} fillOpacity="0.35" />
            <path
              d="M35 65C30 45 42 28 65 25C65 48 52 68 35 65Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path d="M35 65C45 52 55 40 65 25" stroke="currentColor" strokeWidth="1.8" />
          </>
        );

      case 'flourish-squiggle':
        return (
          <>
            <path
              d="M10 25C25 15 35 35 50 25C65 15 75 35 90 25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="50" cy="25" r="4" fill={washFill} fillOpacity="0.8" />
          </>
        );

      case 'certificate-border':
        return (
          <>
            <path d="M10 40V14C14 14 20 10 24 6H50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="20" r="8" fill={washFill} fillOpacity="0.45" />
            <circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </>
        );

      default:
        return null;
    }
  };

  const viewBox =
    name === 'hero-study'
      ? '0 0 200 110'
      : name === 'flourish-squiggle'
      ? '0 0 100 50'
      : '0 0 100 100';

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={cn('inline-block shrink-0 transition-colors', className)}
      aria-hidden={decorative && !title}
      role={decorative && !title ? 'presentation' : 'img'}
      {...props}
    >
      {title && <title>{title}</title>}
      {renderContent()}
    </svg>
  );
}
