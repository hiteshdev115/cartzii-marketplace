'use client';

import { useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PriceTagProps {
  price: number;
  salePrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

export function PriceTag({ price, salePrice, size = 'md', className }: PriceTagProps) {
  const locale = useLocale();
  const displayPrice = salePrice || price;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('font-bold text-primary', sizeClasses[size])}>
        {formatPrice(displayPrice, locale)}
      </span>
      {salePrice && (
        <span className={cn('text-slate-400 line-through', size === 'lg' ? 'text-base' : 'text-sm')}>
          {formatPrice(price, locale)}
        </span>
      )}
    </div>
  );
}
