'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { getRatesForCart } from '@/lib/shippingApi';
import { SHIPPING_ERROR_CODES } from '@/lib/shippingConstants';
import { SellerRateSelector } from './SellerRateSelector';
import type { ShippingFormData } from '@/lib/validators';
import type { SellerRateQuote, ShippingRate } from '@/lib/shippingApi';

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

// Temporary fallback: treat the whole cart as a single seller until the cart
// API exposes sellerId on cart items (see TODO: multi-seller in doFetch).
const DEFAULT_SELLER_ID = 1;

export function RateSelectorPanel({
  shippingAddress,
  onEligibilityChange,
}: RateSelectorPanelProps) {
  const t = useTranslations('Shipping');
  const cartItems = useCartStore((s) => s.items);
  const { setSellerRateQuotes, setSelectedRate, selectedRates, sellerRateQuotes } =
    useCheckoutStore();

  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doFetch = useCallback(async () => {
    if (cartItems.length === 0) return;

    setFetchState({ status: 'loading' });

    // TODO: multi-seller — the Product type currently has no sellerId.
    // Treat the entire cart as a single seller until the API exposes sellerId
    // on cart items.
    const sellerCarts = [
      {
        sellerId: DEFAULT_SELLER_ID,
        items: cartItems.map((ci) => ({
          productId: Number(ci.product.id),
          variantId: ci.variantId ?? null,
          quantity: ci.quantity,
        })),
      },
    ];

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
  }, [cartItems, shippingAddress, setSellerRateQuotes, onEligibilityChange]);

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
      {quotes.map((quote) => (
        <div key={quote.sellerId}>
          {quotes.length > 1 && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {t('sellerLabel', { id: quote.sellerId })}
            </p>
          )}
          <SellerRateSelector
            quote={quote}
            selectedRateId={selectedRates[quote.sellerId]?.rateId ?? null}
            onSelectRate={(rate: ShippingRate) => setSelectedRate(quote.sellerId, rate)}
          />
        </div>
      ))}
    </div>
  );
}
