'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { useThresholdsStore } from '@/stores/thresholdsStore';
import { getRatesForCart } from '@/lib/shippingApi';
import { SHIPPING_ERROR_CODES } from '@/lib/shippingConstants';
import { formatPrice } from '@/lib/utils';
import { SellerRateSelector } from './SellerRateSelector';
import type { ShippingFormData } from '@/lib/validators';
import type { RatesCartItem, SellerRateQuote, ShippingRate } from '@/lib/shippingApi';

interface RateSelectorPanelProps {
  shippingAddress: ShippingFormData;
  /**
   * Called whenever the "proceed to payment" eligibility changes.
   * - `true`  = all rate selections made, no blocking errors → payment can proceed
   * - `false` = waiting for selection or a blocking error exists
   */
  onEligibilityChange?: (canProceed: boolean) => void;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string; errorCode?: number }
  | { status: 'done'; quotes: SellerRateQuote[] };

const BLOCKING_ERROR_CODES: ReadonlySet<number> = new Set([
  SHIPPING_ERROR_CODES.NOT_CONFIGURED,
  SHIPPING_ERROR_CODES.NO_ORIGIN,
]);

export function RateSelectorPanel({
  shippingAddress,
  onEligibilityChange,
}: RateSelectorPanelProps) {
  const t = useTranslations('Shipping');
  const locale = useLocale();
  const cartItems = useCartStore((s) => s.items);
  const { setSellerRateQuotes, setSelectedRate, selectedRates, sellerRateQuotes } =
    useCheckoutStore();
  const { thresholds, fetchThresholds } = useThresholdsStore();

  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sellerCarts = useMemo(() => {
    const groups = new Map<
      number,
      { sellerId: number; subtotalCents: number; items: RatesCartItem[] }
    >();

    for (const ci of cartItems) {
      const sellerId = Number(ci.product.sellerId);
      if (!Number.isFinite(sellerId) || sellerId < 1) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[RateSelectorPanel] skipping cart item with invalid sellerId (must be >= 1):',
            ci,
          );
        }
        continue;
      }

      const unitPrice = ci.product.salePrice ?? ci.product.price;
      const priceCents = Math.round(unitPrice * 100);
      const itemCents = priceCents * ci.quantity;

      let group = groups.get(sellerId);
      if (!group) {
        group = { sellerId, subtotalCents: 0, items: [] };
        groups.set(sellerId, group);
      }
      group.subtotalCents += itemCents;
      group.items.push({
        productId: Number(ci.product.id),
        variantId: ci.variantId ?? null,
        quantity: ci.quantity,
      });
    }

    return Array.from(groups.values());
  }, [cartItems]);

  // Fetch free-shipping thresholds for all sellers in the cart
  const sellerIds = useMemo(() => sellerCarts.map((s) => s.sellerId), [sellerCarts]);
  useEffect(() => {
    if (sellerIds.length > 0) {
      void fetchThresholds(sellerIds);
    }
  }, [sellerIds, fetchThresholds]);

  const doFetch = useCallback(async () => {
    if (sellerCarts.length === 0) return;

    setFetchState({ status: 'loading' });

    const result = await getRatesForCart({
      destination: {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
        street1: shippingAddress.address,
        street2: shippingAddress.addressLine2 || undefined,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zipCode,
        country: shippingAddress.country,
      },
      currency:
        shippingAddress.country === 'CA' ? 'CAD' : 'USD',
      sellerCarts,
    });

    if (!result.ok) {
      setFetchState({
        status: 'error',
        message: result.message,
        errorCode: result.errorCode,
      });
      onEligibilityChange?.(false);
      return;
    }

    const { sellerQuotes } = result.data;
    setSellerRateQuotes(sellerQuotes);
    setFetchState({ status: 'done', quotes: sellerQuotes });

    // Eligibility: all sellers must either have a selected rate or have a
    // non-blocking error (e.g. RATE_FETCH_ERROR is blocking until retried,
    // but the user can still proceed if it clears).
    const hasBlockingError = sellerQuotes.some(
      (q) => q.error && BLOCKING_ERROR_CODES.has(q.error.code),
    );
    const allSelected = sellerQuotes.every(
      (q) => !!q.error || (q.rates && q.rates.length > 0),
    );
    onEligibilityChange?.(!hasBlockingError && allSelected);
  }, [sellerCarts, shippingAddress, setSellerRateQuotes, onEligibilityChange]);

  // Debounced re-fetch when address changes (300 ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void doFetch();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [doFetch]);

  // Update eligibility whenever selectedRates changes
  useEffect(() => {
    if (fetchState.status !== 'done') return;
    const { quotes } = fetchState;
    const hasBlockingError = quotes.some(
      (q) => q.error && BLOCKING_ERROR_CODES.has(q.error.code),
    );
    const allChosen = quotes.every(
      (q) => !!q.error || !!selectedRates[q.sellerId],
    );
    onEligibilityChange?.(!hasBlockingError && allChosen);
  }, [selectedRates, fetchState, onEligibilityChange]);

  // Group cart items by sellerId for displaying in each seller section
  const itemsBySeller = useMemo(() => {
    const groups = new Map<number, typeof cartItems>();
    for (const ci of cartItems) {
      const sellerId = Number(ci.product.sellerId);
      if (!Number.isFinite(sellerId) || sellerId < 1) continue;
      const group = groups.get(sellerId) || [];
      group.push(ci);
      groups.set(sellerId, group);
    }
    return groups;
  }, [cartItems]);

  // ---- Render -------------------------------------------------------------

  if (fetchState.status === 'idle' || fetchState.status === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        {t('loadingRates')}
      </div>
    );
  }

  if (fetchState.status === 'error') {
    // Unsupported destination country → hide the rate list entirely.
    if (fetchState.errorCode === SHIPPING_ERROR_CODES.UNSUPPORTED_COUNTRY) {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{t('unsupportedCountryTitle')}</p>
            <p className="mt-0.5">{t('unsupportedCountryMessage')}</p>
          </div>
        </div>
      );
    }

    // Global NOT_CONFIGURED banner (legacy top-level error)
    if (fetchState.errorCode === SHIPPING_ERROR_CODES.NOT_CONFIGURED) {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{t('notConfiguredTitle')}</p>
            <p className="mt-0.5">{t('notConfiguredMessage')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">{t('ratesErrorTitle')}</p>
        <p className="mt-0.5">{fetchState.message}</p>
        <button
          type="button"
          onClick={() => void doFetch()}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('retry')}
        </button>
      </div>
    );
  }

  // status === 'done'
  const quotes = sellerRateQuotes.length > 0 ? sellerRateQuotes : fetchState.quotes;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">{t('shippingMethod')}</h3>
      {quotes.map((quote) => {
        // Compute free-shipping progress for this seller
        const sellerCart = sellerCarts.find((s) => s.sellerId === quote.sellerId);
        const threshold = thresholds.get(quote.sellerId);
        const thresholdCents = threshold?.freeShippingThresholdCents ?? null;
        const subtotalCents = sellerCart?.subtotalCents ?? 0;
        const storeName = threshold?.storeName || t('sellerLabel', { id: quote.sellerId });

        const showProgressBanner =
          !quote.freeShippingApplied &&
          thresholdCents !== null &&
          thresholdCents > 0 &&
          subtotalCents < thresholdCents;

        const remainingCents = showProgressBanner ? thresholdCents - subtotalCents : 0;
        const sellerItems = itemsBySeller.get(quote.sellerId) || [];

        return (
          <div key={quote.sellerId}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {storeName}
            </p>
            {showProgressBanner && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-2"
                role="status"
              >
                <span aria-hidden="true">⚡</span>
                <span>
                  {t('freeShippingProgress', {
                    amount: formatPrice(remainingCents / 100, locale),
                    storeName,
                  })}
                </span>
              </div>
            )}
            <SellerRateSelector
              quote={quote}
              sellerName={storeName}
              selectedRateId={selectedRates[quote.sellerId]?.rateId ?? null}
              onSelectRate={(rate: ShippingRate) => setSelectedRate(quote.sellerId, rate)}
              items={sellerItems}
            />
          </div>
        );
      })}
    </div>
  );
}
