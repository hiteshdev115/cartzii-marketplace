'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { buildCountryPath, getCountryConfig } from '@/config/countries';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { PaymentForm, type PaymentSubmitResult } from '@/components/checkout/PaymentForm';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { WalletPayButton } from '@/components/checkout/WalletPayButton';
import { SavedPaymentMethods } from '@/components/checkout/SavedPaymentMethods';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { placeOrder } from '@/lib/api/orders';
import { ApiError } from '@/lib/api/client';
import type { ShippingFormData } from '@/lib/validators';
import { useMemo } from 'react';
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

  // Derive total from live cart — same formula as OrderSummary
  const cartItems = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0)
  );
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  // Stripe expects amount in the smallest currency unit (cents)
  const orderAmountCents = Math.round(total * 100);

  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [editingShipping, setEditingShipping] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string; orderId: number } | null>(null);

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
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          unitPrice: Math.round(price * 100),
          totalPrice: Math.round(price * item.quantity * 100),
          currencyCode: currency.toUpperCase(),
        };
      });

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
          {t('title')}
        </h1>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* ---- Left column ---- */}
          <div className="md:col-span-2 space-y-4 order-2 md:order-1">
            <section className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">{t('shippingAddress')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('continueToPayment')}</p>
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

            {/* Saved cards */}
            <section className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                {t('savedPaymentMethods')}
              </h2>
              <SavedPaymentMethods
                selectedId={selectedMethodId}
                onSelect={setSelectedMethodId}
              />
            </section>

            {/* Wallet: Google Pay / Apple Pay — only renders if available */}
            {shippingData && !editingShipping && (
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
            {shippingData && !editingShipping && !paymentComplete ? (
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
            ) : (
              <section className="bg-white rounded-xl shadow-md p-4 sm:p-5">
                <p className="text-sm text-slate-500">{t('continueToPayment')}</p>
              </section>
            )}
          </div>

          {/* ---- Right column — Order summary ---- */}
          <div className="md:col-span-1 order-1 md:order-2">
            <OrderSummary />
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
