'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { getCarrierDisplay } from '@/lib/shippingConstants';
import { SHIPPING_ERROR_CODES } from '@/lib/shippingConstants';
import type { SellerRateQuote, ShippingRate } from '@/lib/shippingApi';

interface SellerRateSelectorProps {
  quote: SellerRateQuote;
  sellerName?: string;
  selectedRateId: string | null;
  onSelectRate: (rate: ShippingRate) => void;
}

export function SellerRateSelector({
  quote,
  sellerName,
  selectedRateId,
  onSelectRate,
}: SellerRateSelectorProps) {
  const t = useTranslations('Shipping');
  const locale = useLocale();

  // ---- Error states -------------------------------------------------------
  if (quote.error) {
    const { code, message } = quote.error;

    if (code === SHIPPING_ERROR_CODES.NO_ORIGIN) {
      return (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          <p className="font-semibold">
            {sellerName ? `Seller "${sellerName}"` : t('sellerFallback')}
          </p>
          <p className="mt-1">{t('noOriginError')}</p>
          <p className="mt-1 text-xs text-orange-600">{message}</p>
        </div>
      );
    }

    if (code === SHIPPING_ERROR_CODES.RATE_FETCH_ERROR) {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">
            {sellerName ?? t('sellerFallback')}
          </p>
          <p className="mt-1 text-red-600">{t('rateFetchError')}</p>
          <p className="text-xs text-slate-500">{message}</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold">{sellerName ?? t('sellerFallback')}</p>
        <p className="mt-1 text-red-600">{message}</p>
      </div>
    );
  }

  // ---- No rates (empty array) ---------------------------------------------
  if (!quote.rates || quote.rates.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {t('noRatesAvailable')}
      </div>
    );
  }

  // ---- Sorted rates (cheapest first) --------------------------------------
  const sorted = [...quote.rates].sort((a, b) => a.rate - b.rate);

  return (
    <div className="space-y-2">
      {sorted.map((rate) => {
        const isSelected = rate.rateId === selectedRateId;
        const isFree = rate.rate === 0;

        return (
          <label
            key={rate.rateId}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <input
              type="radio"
              name={`seller-rate-${quote.sellerId}`}
              value={rate.rateId}
              checked={isSelected}
              onChange={() => onSelectRate(rate)}
              className="mt-0.5 accent-primary"
            />
            <div className="flex flex-1 items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {getCarrierDisplay(rate.carrier)} · {rate.service}
                  </p>
                  {rate.estDeliveryDays != null && (
                    <p className="text-xs text-slate-500">
                      {t('estDelivery', { days: rate.estDeliveryDays })}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 text-sm font-semibold',
                  isFree ? 'text-emerald-600' : 'text-slate-900',
                )}
              >
                {isFree ? t('freeShipping') : formatPrice(rate.rate, locale)}
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
