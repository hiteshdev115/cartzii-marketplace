'use client';

import { useTranslations } from 'next-intl';
import { PackageX } from 'lucide-react';

/**
 * Stands in for "Add to cart" wherever a product cannot be bought.
 *
 * Rendered instead of the real button rather than a disabled copy of it: a
 * greyed-out button reads as "something is broken", while a labelled panel
 * says the product exists and will return. It carries the same sizing props
 * each surface already uses, so the grid does not reflow when a product sells
 * out.
 */
export function OutOfStockButton({ className = '' }: { className?: string }) {
  const t = useTranslations('Products');

  return (
    <div
      role="status"
      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed ${className}`}
    >
      <PackageX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {t('backInStockSoon')}
    </div>
  );
}
