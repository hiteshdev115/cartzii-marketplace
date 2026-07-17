'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { buildCountryPath, getCountryConfig } from '@/config/countries';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { PaymentForm, type PaymentSubmitResult } from '@/components/checkout/PaymentForm';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { WalletPayButton } from '@/components/checkout/WalletPayButton';
import { SavedPaymentMethods } from '@/components/checkout/SavedPaymentMethods';
import { OrderSummary, type TaxState } from '@/components/checkout/OrderSummary';
import { RateSelectorPanel } from '@/components/shipping/RateSelectorPanel';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { getTaxEstimate, placeOrder } from '@/lib/api/orders';
import { ApiError } from '@/lib/api/client';
import { useCheckoutStore } from '@/stores/checkoutStore';
import type { ShippingFormData } from '@/lib/validators';
import { CheckCircle2 } from 'lucide-react';

/** Maps 2-letter ISO country code (as stored in ShippingFormData) to full country name */
const COUNTRY_FULL_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
};

export function CheckoutPageContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Checkout');
  const tCommon = useTranslations('Common');
  const { currency } = getCountryConfig(locale); // 'CAD' for /ca, 'USD' for /us

  // Derive subtotal from live cart
  const cartItems = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0)
  );
  const subtotalCents = Math.round(subtotal * 100);

  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [editingShipping, setEditingShipping] = useState(true);
  const [ratesEligible, setRatesEligible] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string; orderId: number } | null>(null);
  const [taxState, setTaxState] = useState<TaxState>({ status: 'pending' });

  // Pull selected shipping total from checkout store for Stripe amount calculation
  const getTotalShippingCents = useCheckoutStore((s) => s.getTotalShippingCents);
  // Rate quotes + per-seller selections captured by RateSelectorPanel.
  const sellerRateQuotes = useCheckoutStore((s) => s.sellerRateQuotes);
  const selectedRates = useCheckoutStore((s) => s.selectedRates);

  // Re-fetch the tax estimate whenever the locked shipping address or the cart
  // subtotal changes. Skipped while the shipping form is still being edited.
  useEffect(() => {
    if (!shippingData || editingShipping) {
      setTaxState({ status: 'pending' });
      return;
    }
    if (subtotalCents <= 0) {
      setTaxState({ status: 'pending' });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setTaxState({ status: 'loading' });

    (async () => {
      try {
        const estimate = await getTaxEstimate({
          countryCode: shippingData.country,
          stateCode: shippingData.state,
          subtotalCents,
        });
        if (!cancelled) {
          setTaxState({ status: 'ready', estimate });
        }
      } catch (cause) {
        if (cancelled) return;
        let message: string | undefined;
        if (cause instanceof ApiError) {
          const body = cause.body as { message?: string; error?: string } | null;
          message = body?.message || body?.error;
        } else if (cause instanceof Error) {
          message = cause.message;
        }
        setTaxState({ status: 'error', message });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [shippingData, editingShipping, subtotalCents]);

  // Stripe needs the grand total in the smallest currency unit. Until the tax
  // estimate resolves we fall back to subtotal-only so the form can mount.
  // Include selected shipping cost in the total charged to the card.
  const shippingCents = getTotalShippingCents();
  const orderAmountCents =
    taxState.status === 'ready'
      ? taxState.estimate.totalAmountCents + shippingCents
      : subtotalCents + shippingCents;
  const taxReady = taxState.status === 'ready';

  const shippingPreview = useMemo(() => {
    if (!shippingData) return null;
    return [
      `${shippingData.firstName} ${shippingData.lastName}`.trim(),
      shippingData.email,
      shippingData.phone,
      shippingData.address,
      shippingData.addressLine2,
      `${shippingData.city}, ${shippingData.state} ${shippingData.zipCode}`,
      shippingData.country,
    ].filter(Boolean) as string[];
  }, [shippingData]);

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setEditingShipping(false);
  };

  const handlePaymentSubmit = async (paymentResult: PaymentSubmitResult) => {
    if (!shippingData) {
      setToast({ message: t('shippingRequiredBeforePayment'), type: 'error' });
      return;
    }

    setIsPlacingOrder(true);
    setPaymentComplete(true);
    setToast(null);

    try {
      const isAuthenticated = useAuthStore.getState().isAuthenticated();
      // shippingData.country is a 2-letter ISO code ('US' | 'CA') from ShippingForm
      const countryISO = shippingData.country;

      const orderItems = cartItems.map((item) => {
        const price = item.product.salePrice || item.product.price;
        return {
          productId: Number(item.product.id),
          quantity: item.quantity,
          unitPrice: Math.round(price * 100),
          totalPrice: Math.round(price * item.quantity * 100),
          currencyCode: currency.toUpperCase(),
        };
      });

      // Build per-seller shipping selections from what the buyer picked in the
      // rate selector. We only send entries where we have both a provider
      // shipment id and a chosen rate — sellers with errors are skipped.
      const shippingSelections = sellerRateQuotes
        .map((quote) => {
          const rate = selectedRates[quote.sellerId];
          if (!rate || !quote.providerShipmentId) return null;
          return {
            sellerId: quote.sellerId,
            providerShipmentId: quote.providerShipmentId,
            rateId: rate.rateId,
          };
        })
        .filter((s): s is { sellerId: number; providerShipmentId: string; rateId: string } => s !== null);

      const order = await placeOrder({
        paymentIntentId: paymentResult.paymentIntentId,
        currency: currency.toUpperCase(),
        countryCode: countryISO,
        shippingAddress: {
          firstName: shippingData.firstName,
          lastName: shippingData.lastName,
          phone: shippingData.phone,
          street: shippingData.address,
          addressLine2: shippingData.addressLine2,
          city: shippingData.city,
          state: shippingData.state,
          postalCode: shippingData.zipCode,
          country: COUNTRY_FULL_NAMES[countryISO] ?? countryISO,
          countryCode: countryISO,
        },
        items: orderItems,
        ...(shippingSelections.length > 0 && { shippingSelections }),
        ...(!isAuthenticated && {
          guest: {
            email: shippingData.email,
            firstName: shippingData.firstName,
            lastName: shippingData.lastName,
            phone: shippingData.phone,
          },
        }),
      });

      setPlacedOrder(order);
      await useCartStore.getState().clearCart();
      router.push(buildCountryPath(locale, `/order-confirmation/${order.orderNumber}`));
    } catch (cause) {
      let message = t('orderPlacementFailed');
      if (cause instanceof ApiError) {
        const body = cause.body as { message?: string; error?: string } | null;
        message = body?.message || body?.error || message;
      } else if (cause instanceof Error && cause.message) {
        message = cause.message;
      }
      setToast({ message, type: 'error' });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-10"
      data-order-number={placedOrder?.orderNumber ?? ''}
      data-order-id={placedOrder?.orderId ?? ''}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-6 lg:mb-8">
          {t('title')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* ---- Left column ---- */}
          <div className="md:col-span-2 space-y-3 sm:space-y-4 order-2 md:order-1">
            <section className="bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-slate-200 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-800">{t('shippingAddress')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{t('continueToPayment')}</p>
                </div>
                {shippingData && !editingShipping && !paymentComplete && (
                  <button
                    type="button"
                    onClick={() => setEditingShipping(true)}
                    className="text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    {tCommon('edit')}
                  </button>
                )}
              </div>

              {editingShipping || !shippingData ? (
                <ShippingForm onSubmit={handleShippingSubmit} defaultValues={shippingData ?? undefined} />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-1.5">
                  {shippingPreview?.map((line) => <p key={line}>{line}</p>)}
                </div>
              )}
            </section>

            {/* Shipping rate selection — appears after address is locked */}
            {shippingData && !editingShipping && !paymentComplete && (
              <section className="bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-slate-200">
                <RateSelectorPanel
                  shippingAddress={shippingData}
                  onEligibilityChange={setRatesEligible}
                />
              </section>
            )}

            {/* Saved cards */}
            <section className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                {t('savedPaymentMethods')}
              </h2>
              <SavedPaymentMethods
                selectedId={selectedMethodId}
                onSelect={setSelectedMethodId}
              />
            </section>

            {/* Wallet: Google Pay / Apple Pay — only renders if available */}
            {shippingData && !editingShipping && taxReady && ratesEligible && (
              <WalletPayButton
                amount={orderAmountCents}
                currency={currency}
                onSuccess={(paymentIntentId) => {
                  router.push(
                    buildCountryPath(
                      locale,
                      `/checkout/success?payment_intent=${encodeURIComponent(paymentIntentId)}`,
                    ),
                  );
                }}
              />
            )}

            {/* Stripe card form */}
            {shippingData && !editingShipping && !paymentComplete && taxReady && ratesEligible ? (
              <PaymentForm
                amount={orderAmountCents}
                currency={currency}
                country={shippingData.country}
                onSubmit={handlePaymentSubmit}
              />
            ) : shippingData && !editingShipping && paymentComplete && !placedOrder ? (
              <section className="bg-white rounded-xl shadow-md border border-amber-200 p-4 sm:p-5">
                <p className="text-sm font-medium text-amber-700">{t('orderPlacementFailed')}</p>
              </section>
            ) : shippingData && !editingShipping && taxState.status === 'loading' ? (
              <section className="bg-white rounded-xl shadow-md p-4 sm:p-5">
                <p className="text-sm text-slate-500">{t('taxCalculating')}</p>
              </section>
            ) : shippingData && !editingShipping && taxState.status === 'error' ? (
              <section className="bg-white rounded-xl shadow-md border border-red-200 p-4 sm:p-5">
                <p className="text-sm font-medium text-red-700">
                  {taxState.message ?? t('taxEstimateError')}
                </p>
              </section>
            ) : (
              <section className="bg-white rounded-xl shadow-md p-4 sm:p-5">
                <p className="text-sm text-slate-500">{t('continueToPayment')}</p>
              </section>
            )}
          </div>

          {/* ---- Right column — Order summary ---- */}
          <div className="md:col-span-1 order-1 md:order-2">
            <OrderSummary taxState={taxState} />
          </div>
        </div>
      </div>

      {isPlacingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 className="h-7 w-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-900">{t('placingOrder')}</p>
              <p className="text-sm text-slate-500">{t('securePayment')}</p>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
