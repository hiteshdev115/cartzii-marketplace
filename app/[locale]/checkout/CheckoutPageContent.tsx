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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ---- Left column ---- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Saved cards */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">
                Pay with saved card
              </h2>
              <SavedPaymentMethods
                selectedId={selectedMethodId}
                onSelect={setSelectedMethodId}
              />
            </section>

            <hr className="border-gray-200" />

            {/* Wallet: Google Pay / Apple Pay */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">Wallet</h2>
              <WalletPayButton
                amount={ORDER_AMOUNT}
                onSuccess={handleSuccess}
              />
            </section>

            <hr className="border-gray-200" />

            {/* Stripe card form */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">
                Pay with card
              </h2>
              <PaymentForm
                amount={ORDER_AMOUNT}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </section>
          </div>

          {/* ---- Right column — Order summary ---- */}
          <div className="lg:col-span-1">
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
