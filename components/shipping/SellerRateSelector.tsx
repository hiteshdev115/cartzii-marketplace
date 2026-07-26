'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Truck, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { getCarrierDisplay } from '@/lib/shippingConstants';
import { SHIPPING_ERROR_CODES } from '@/lib/shippingConstants';
import type { SellerRateQuote, ShippingRate } from '@/lib/shippingApi';
import type { CartItem } from '@/types';

interface SellerRateSelectorProps {
  quote: SellerRateQuote;
  sellerName?: string;
  selectedRateId: string | null;
  onSelectRate: (rate: ShippingRate) => void;
  /** Cart items belonging to this seller */
  items?: CartItem[];
}

/**
 * Compute the estimated delivery date string from estDeliveryDays.
 * Returns something like "Wed, Jul 23" or null if no data.
 */
function getDeliveryDateStr(estDeliveryDays: number | null | undefined): string | null {
  if (estDeliveryDays == null) return null;
  const date = new Date();
  date.setDate(date.getDate() + estDeliveryDays);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Pick the two best rates: cheapest and fastest.
 * If they are the same rate, return only that one.
 */
function pickCheapestAndFastest(rates: ShippingRate[]): ShippingRate[] {
  if (rates.length <= 2) return rates;

  // Cheapest = lowest rate
  const cheapest = [...rates].sort((a, b) => a.rate - b.rate)[0];

  // Fastest = lowest estDeliveryDays (only consider rates with that field)
  const withDays = rates.filter((r) => r.estDeliveryDays != null);
  const fastest = withDays.length > 0
    ? withDays.sort((a, b) => (a.estDeliveryDays ?? 999) - (b.estDeliveryDays ?? 999))[0]
    : null;

  // If fastest is same as cheapest or unavailable, try to find a different fast option
  if (!fastest || fastest.rateId === cheapest.rateId) {
    // Return cheapest + next cheapest if only one unique option
    const secondCheapest = [...rates].sort((a, b) => a.rate - b.rate)[1];
    if (secondCheapest && secondCheapest.rateId !== cheapest.rateId) {
      return [cheapest, secondCheapest];
    }
    return [cheapest];
  }

  return [cheapest, fastest];
}

export function SellerRateSelector({
  quote,
  sellerName,
  selectedRateId,
  onSelectRate,
  items,
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

  // ---- Pick cheapest & fastest rates --------------------------------------
  const displayRates = pickCheapestAndFastest(quote.rates);
  const isFreeShipping = quote.freeShippingApplied === true;

  // Determine which is cheapest and which is fastest for labeling
  const cheapestRate = [...quote.rates].sort((a, b) => a.rate - b.rate)[0];
  const withDays = quote.rates.filter((r) => r.estDeliveryDays != null);
  const fastestRate = withDays.length > 0
    ? withDays.sort((a, b) => (a.estDeliveryDays ?? 999) - (b.estDeliveryDays ?? 999))[0]
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* ---- Seller Items Preview ---- */}
      {items && items.length > 0 && (
        <div className="p-3 border-b border-slate-100 space-y-2">
          {items.map((item) => {
            const unitPrice = item.product.salePrice || item.product.price;
            return (
              <div key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 bg-slate-100">
                  <Image
                    src={item.product.images[0] || '/assets/placeholder.png'}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{item.product.name}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-900 shrink-0">
                  {formatPrice(unitPrice * item.quantity, locale)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Shipping Rate Options ---- */}
      <div className="p-3 space-y-2">
        {isFreeShipping && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 border border-green-200 text-green-900 text-sm mb-2"
            role="status"
          >
            <span aria-hidden="true">🎉</span>
            <span>{t('freeShippingApplied')}</span>
          </div>
        )}
        {displayRates.map((rate) => {
          const isSelected = rate.rateId === selectedRateId;
          const isFree = rate.rate === 0;
          const deliveryDate = getDeliveryDateStr(rate.estDeliveryDays);
          const isCheapest = rate.rateId === cheapestRate?.rateId;
          const isFastest = fastestRate && rate.rateId === fastestRate.rateId && rate.rateId !== cheapestRate?.rateId;

          return (
            <label
              key={rate.rateId}
              className={cn(
                'flex cursor-pointer items-start gap-2 sm:gap-3 rounded-xl border-2 p-2.5 sm:p-3 transition-colors',
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
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {isFastest ? (
                      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <Truck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {getCarrierDisplay(rate.carrier)} · {rate.service}
                        </p>
                        {isCheapest && displayRates.length > 1 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase whitespace-nowrap">
                            Cheapest
                          </span>
                        )}
                        {isFastest && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold uppercase whitespace-nowrap">
                            Fastest
                          </span>
                        )}
                      </div>
                      {rate.estDeliveryDays != null && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <p className="text-xs text-slate-500">
                            {deliveryDate
                              ? `Est. ${deliveryDate} (${rate.estDeliveryDays} ${rate.estDeliveryDays === 1 ? 'day' : 'days'})`
                              : t('estDelivery', { days: rate.estDeliveryDays })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {isFreeShipping ? (
                    <span
                      className="shrink-0 text-sm font-semibold ml-6 sm:ml-0"
                      aria-label={t('freeShippingAriaLabel', {
                        originalPrice: formatPrice(rate.rate, locale),
                      })}
                    >
                      <s className="text-gray-400 mr-2">{formatPrice(rate.rate, locale)}</s>
                      <span className="text-green-700">{t('free')}</span>
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'shrink-0 text-sm font-semibold ml-6 sm:ml-0',
                        isFree ? 'text-emerald-600' : 'text-slate-900',
                      )}
                    >
                      {isFree ? t('freeShipping') : formatPrice(rate.rate, locale)}
                    </span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
