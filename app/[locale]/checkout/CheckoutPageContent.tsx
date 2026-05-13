'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { WalletPayButton } from '@/components/checkout/WalletPayButton';
import { SavedPaymentMethods } from '@/components/checkout/SavedPaymentMethods';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Toast, type ToastType } from '@/components/ui/Toast';

// TODO: replace with real cart total in cents once cart API is wired up ($49.99)
const ORDER_AMOUNT = 4999;

export function CheckoutPageContent() {
  const router = useRouter();
  const locale = useLocale();

  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleSuccess = (paymentIntentId: string) => {
    router.push(
      buildCountryPath(
        locale,
        `/checkout/success?payment_intent=${encodeURIComponent(paymentIntentId)}`,
      ),
    );
  };

  const handleError = (error: string) => {
    setToast({ message: error, type: 'error' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* ---- Left column ---- */}
          <div className="md:col-span-2 space-y-4 order-2 md:order-1">
            {/* Saved cards */}
            <section className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Pay with saved card
              </h2>
              <SavedPaymentMethods
                selectedId={selectedMethodId}
                onSelect={setSelectedMethodId}
              />
            </section>

            {/* Wallet: Google Pay / Apple Pay — only renders if available */}
            <WalletPayButton
              amount={ORDER_AMOUNT}
              onSuccess={handleSuccess}
            />

            {/* Stripe card form */}
            <PaymentForm
              amount={ORDER_AMOUNT}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          {/* ---- Right column — Order summary ---- */}
          <div className="md:col-span-1 order-1 md:order-2">
            <OrderSummary />
          </div>
        </div>
      </div>

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
