'use client';

import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onChange?: (value: number) => void;
  showValue?: boolean;
  reviewCount?: number;
}

const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };

export function StarRating({ value, max = 5, size = 'md', readonly = true, onChange, showValue, reviewCount }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rating: ${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(value);
        const half = !filled && i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(i + 1)}
            className={cn('transition-colors relative', readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110')}
            aria-label={`${i + 1} star${i + 1 !== 1 ? 's' : ''}`}
            tabIndex={readonly ? -1 : 0}
          >
            {half ? (
              <span className="relative inline-block">
                <Star className={cn(sizeMap[size], 'text-slate-300')} />
                <StarHalf className={cn(sizeMap[size], 'fill-amber-400 text-amber-400 absolute inset-0')} />
              </span>
            ) : (
              <Star
                className={cn(
                  sizeMap[size],
                  filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                )}
              />
            )}
          </button>
        );
      })}
      {showValue && <span className="ml-1 text-sm text-slate-600">{value.toFixed(1)}</span>}
      {reviewCount !== undefined && (
        <span className="ml-1 text-xs text-slate-400">({reviewCount})</span>
      )}
    </div>
  );
}
