'use client';

import { useMemo, useState } from 'react';
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { AlertCircle, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getStripe } from '@/lib/stripe';
import { createPaymentIntent } from '@/lib/api/payment';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

// ---- Props ----------------------------------------------------------------

export interface PaymentSubmitResult {
  paymentIntentId: string;
  amount: number;
  currency: string;
}

interface PaymentFormProps {
  amount: number;
  currency: string;
  country: string;
  onSubmit: (paymentResult: PaymentSubmitResult) => Promise<void> | void;
}

// ---- Inner form (must live inside <Elements>) -----------------------------

function CheckoutForm({
  amount,
  currency,
  country,
  onSubmit,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations('Checkout');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardOptions = {
    hidePostalCode: true,
    style: {
      base: {
        color: '#0f172a',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#94a3b8',
        },
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
  };

  const getFriendlyError = (cause: unknown): string => {
    if (cause instanceof ApiError) {
      const body = cause.body as { message?: string; error?: string } | null;
      return body?.message || body?.error || t('paymentInitializationFailed');
    }
    if (cause instanceof Error && cause.message) {
      return cause.message;
    }
    return t('paymentFailed');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { clientSecret } = await createPaymentIntent({
        amount,
        currency,
        country,
      });

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error(t('cardElementUnavailable'));
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        },
      );

      if (confirmError) {
        throw new Error(confirmError.message || t('paymentFailed'));
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error(t('paymentFailed'));
      }

      await onSubmit({
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount ?? amount,
        currency: paymentIntent.currency ?? currency,
      });
    } catch (cause) {
      setError(getFriendlyError(cause));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <CardElement options={cardOptions} />
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
        isLoading={isProcessing}
      >
        {isProcessing ? t('processingPayment') : t('payNow')}
      </Button>
    </form>
  );
}

// ---- Outer wrapper (initialises payment intent + Stripe) -----------------

export function PaymentForm({
  amount,
  currency,
  country,
  onSubmit,
}: PaymentFormProps) {
  const t = useTranslations('Checkout');

  // Derive stripePromise from publishableKey without any setState-in-effect.
  // Uses the API key when available, falls back to the env-var.
  const stripePromise = useMemo(
    () => getStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    [],
  );

  const elementsOptions: StripeElementsOptions = {
    appearance: { theme: 'stripe' },
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 space-y-4 sm:space-y-5">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('paymentDetails')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('securePayment')}</p>
      </div>

      <Elements stripe={stripePromise} options={elementsOptions}>
        <CheckoutForm amount={amount} currency={currency} country={country} onSubmit={onSubmit} />
      </Elements>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-100">
        <Shield className="w-3.5 h-3.5" />
        <span>{t('securePayment')}</span>
      </div>
    </div>
  );
}

