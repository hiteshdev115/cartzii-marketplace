'use client';

import { useEffect, useMemo } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Shield } from 'lucide-react';
import { getStripe } from '@/lib/stripe';
import { usePaymentStore } from '@/stores/paymentStore';
import { Button } from '@/components/ui/Button';

// ---- Props ----------------------------------------------------------------

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

// ---- Inner form (must live inside <Elements>) -----------------------------

function CheckoutForm({
  onSuccess,
  onError,
}: Pick<PaymentFormProps, 'onSuccess' | 'onError'>) {
  const stripe = useStripe();
  const elements = useElements();
  const { paymentIntentId, paymentStatus, setPaymentStatus } = usePaymentStore();

  const isProcessing = paymentStatus === 'processing';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaymentStatus('processing');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPaymentStatus('failed');
      onError(error.message ?? 'Payment failed');
    } else {
      setPaymentStatus('succeeded');
      onSuccess(paymentIntentId ?? '');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
        isLoading={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
}

// ---- Outer wrapper (initialises payment intent + Stripe) -----------------

export function PaymentForm({
  amount,
  currency = 'usd',
  onSuccess,
  onError,
}: PaymentFormProps) {
  const { clientSecret, publishableKey, isLoading, error, initializePayment } =
    usePaymentStore();

  // Derive stripePromise from publishableKey without any setState-in-effect.
  // Uses the API key when available, falls back to the env-var.
  const stripePromise = useMemo(
    () => getStripe(publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    [publishableKey],
  );

  // Step 1: create payment intent on mount
  useEffect(() => {
    initializePayment({ amount, currency });
  }, [amount, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const elementsOptions: StripeElementsOptions = {
    clientSecret: clientSecret ?? undefined,
    appearance: { theme: 'stripe' },
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Payment details</h2>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        </div>
      )}

      {/* API / store error */}
      {error && !isLoading && (
        <div className="space-y-3">
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
          <button
            type="button"
            onClick={() => initializePayment({ amount, currency })}
            className="text-sm text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Not loading, no error, but no clientSecret yet — unexpected state */}
      {!isLoading && !error && !clientSecret && (
        <p className="text-sm text-slate-400 text-center py-4">Initialising payment…</p>
      )}

      {/* Stripe Elements */}
      {!isLoading && clientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={elementsOptions}>
          <CheckoutForm onSuccess={onSuccess} onError={onError} />
        </Elements>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-100">
        <Shield className="w-3.5 h-3.5" />
        <span>Secured by Stripe</span>
      </div>
    </div>
  );
}

