'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TaxEstimate } from '@/types/order';

export type TaxState =
  | { status: 'pending' }
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | { status: 'ready'; estimate: TaxEstimate };

interface OrderSummaryProps {
  /** Tax estimate state from the checkout page (driven by the address + cart). */
  taxState?: TaxState;
}

function formatRatePercent(rate: number, fractionDigits = 2): string {
  return (rate * 100).toFixed(fractionDigits).replace(/\.?0+$/, '');
}

export function OrderSummary({ taxState = { status: 'pending' } }: OrderSummaryProps) {
  const t = useTranslations('Cart');
  const tCheckout = useTranslations('Checkout');
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) =>
    s.items.reduce(
      (sum, item) =>
        sum + (item.product.salePrice || item.product.price) * item.quantity,
      0,
    ),
  );

  // Shipping is server-determined at order time; surface as FREE here until the
  // backend exposes a shipping quote endpoint.
  const shipping = 0;

  const taxAmount =
    taxState.status === 'ready' ? taxState.estimate.taxAmountCents / 100 : 0;
  const total = subtotal + shipping + taxAmount;

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const renderTaxValue = () => {
    switch (taxState.status) {
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {tCheckout('taxCalculating')}
          </span>
        );
      case 'error':
        return (
          <span className="text-red-600 text-xs font-medium">
            {tCheckout('taxEstimateError')}
          </span>
        );
      case 'ready': {
        const { estimate } = taxState;
        if (!estimate.taxApplicable) {
          return <span className="font-medium text-emerald-700">{tCheckout('taxFree')}</span>;
        }
        return <span className="font-medium">{formatPrice(taxAmount, locale)}</span>;
      }
      case 'pending':
      default:
        return (
          <span className="text-xs text-slate-500">{tCheckout('taxAtCheckout')}</span>
        );
    }
  };

  const taxLabel =
    taxState.status === 'ready' && taxState.estimate.taxApplicable
      ? `${t('tax')} · ${taxState.estimate.taxName} (${formatRatePercent(taxState.estimate.taxRate)}%)`
      : t('tax');

  return (
    <div className="bg-slate-50 rounded-2xl md:sticky md:top-24">
      {/* Mobile: collapsible toggle row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 md:hidden"
        aria-expanded={expanded}
      >
        <span className="text-sm font-semibold text-slate-800">
          {t('orderSummary')}
          <span className="ml-1.5 text-slate-500 font-normal">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">{formatPrice(total, locale)}</span>
          <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform duration-200', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Content: always visible on md+, collapsible on mobile */}
      <div className={cn('md:block', expanded ? 'block' : 'hidden')}>
        <div className="p-4 pt-0 md:p-6">
          {/* Desktop heading */}
          <h2 className="hidden md:block text-lg font-semibold mb-4">{t('orderSummary')}</h2>

          <ul className="space-y-3 mb-4">
            {items.map((item) => (
              <li key={item.cartId ?? `${item.product.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-3 items-center">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0">
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold shrink-0 whitespace-nowrap">{formatPrice((item.product.salePrice || item.product.price) * item.quantity, locale)}</p>
              </li>
            ))}
          </ul>

          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between"><span className="text-slate-600">{t('subtotal')}</span><span className="font-medium">{formatPrice(subtotal, locale)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">{t('shipping')}</span><span className="font-medium">{shipping === 0 ? t('free') : formatPrice(shipping, locale)}</span></div>
            <div className="flex justify-between items-start gap-3">
              <span className="text-slate-600">{taxLabel}</span>
              {renderTaxValue()}
            </div>

            {taxState.status === 'ready' && taxState.estimate.taxApplicable && taxState.estimate.components.length > 1 && (
              <ul className="pl-3 text-xs text-slate-500 space-y-0.5">
                {taxState.estimate.components.map((c) => (
                  <li key={c.name} className="flex justify-between">
                    <span>{c.label ?? c.name} ({formatRatePercent(c.rate, 3)}%)</span>
                    <span>{formatPrice(subtotal * c.rate, locale)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-between border-t pt-2 font-bold text-base">
              <span>{t('total')}</span>
              <span className="text-primary">{formatPrice(total, locale)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
