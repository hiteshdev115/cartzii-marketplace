'use client';

import { useEffect, useState } from 'react';
import {
  Elements,
  PaymentRequestButtonElement,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  CanMakePaymentResult,
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
  Stripe,
  StripeElementsOptions,
} from '@stripe/stripe-js';
import { getStripe } from '@/lib/stripe';
import { usePaymentStore } from '@/stores/paymentStore';

// ---- Props ----------------------------------------------------------------

interface WalletPayButtonProps {
  amount: number;
  currency?: string;
  label?: string;
  onSuccess: (paymentIntentId: string) => void;
}

// ---- Inner button (must live inside <Elements>) ---------------------------

function WalletButtonInner({
  amount,
  currency = 'usd',
  label = 'Total',
  onSuccess,
}: WalletPayButtonProps) {
  const stripe = useStripe();
  const { clientSecret, paymentIntentId, setPaymentStatus } = usePaymentStore();

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canPay, setCanPay] = useState<boolean>(false);

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: currency.toLowerCase(),
      total: { label, amount },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result: CanMakePaymentResult | null) => {
      if (result) {
        setCanPay(true);
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (event: PaymentRequestPaymentMethodEvent) => {
      if (!clientSecret) {
        event.complete('fail');
        return;
      }

      setPaymentStatus('processing');

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: event.paymentMethod.id },
        { handleActions: false },
      );

      if (error) {
        event.complete('fail');
        setPaymentStatus('failed');
      } else {
        event.complete('success');

        // If extra 3DS action is required, let Stripe handle it
        if (paymentIntent?.status === 'requires_action') {
          const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
          if (actionError) {
            setPaymentStatus('failed');
            return;
          }
        }

        setPaymentStatus('succeeded');
        onSuccess(paymentIntentId ?? paymentIntent?.id ?? '');
      }
    });

    // Cleanup listener on unmount / dep change
    return () => {
      pr.off('paymentmethod');
    };
  }, [stripe, clientSecret, amount, currency, label]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!canPay || !paymentRequest) return null;

  return (
    <>
      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <span className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400 whitespace-nowrap">or pay with</span>
        <span className="flex-1 border-t border-gray-200" />
      </div>

      {/* Google Pay / Apple Pay button */}
      <PaymentRequestButtonElement
        options={{ paymentRequest }}
        className="w-full"
      />
    </>
  );
}

// ---- Outer wrapper (provides <Elements> context) -------------------------

export function WalletPayButton(props: WalletPayButtonProps) {
  const { clientSecret, publishableKey } = usePaymentStore();

  // Initialise Stripe immediately with the env-var key (same pattern as PaymentForm)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(
    () => getStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  );

  useEffect(() => {
    if (publishableKey && publishableKey !== process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripePromise(getStripe(publishableKey));
    }
  }, [publishableKey]);

  if (!clientSecret || !stripePromise) return null;

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <WalletButtonInner {...props} />
    </Elements>
  );
}
