'use client';

import { useMemo, useState } from 'react';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  StripeElementsOptions,
  StripeCardNumberElementOptions,
  StripeCardExpiryElementOptions,
  StripeCardCvcElementOptions,
} from '@stripe/stripe-js';
import { AlertCircle, CreditCard, Lock, Shield } from 'lucide-react';
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

// ---- Accepted card brand chips -------------------------------------------

/**
 * Which card networks Stripe processes for this platform. Shown up top so
 * the buyer knows at a glance what plastic to reach for. Kept as simple
 * wordmarks in brand colours rather than raster logos — no external asset
 * requests, no legal-usage grey area on official trademarks, resizes
 * cleanly at every DPI.
 */
const ACCEPTED_BRANDS: Array<{
  name: string;
  bg:   string;
  fg:   string;
  outline?: string;
}> = [
  { name: 'VISA',       bg: '#1a1f71', fg: '#ffffff' },
  { name: 'Mastercard', bg: '#eb001b', fg: '#ffffff' },
  { name: 'AMEX',       bg: '#006fcf', fg: '#ffffff' },
  { name: 'Discover',   bg: '#ff6000', fg: '#ffffff' },
  { name: 'Diners',     bg: '#0079be', fg: '#ffffff' },
  { name: 'JCB',        bg: '#0e4c96', fg: '#ffffff' },
];

function AcceptedCardBadges() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ACCEPTED_BRANDS.map((brand) => (
        <span
          key={brand.name}
          className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
          style={{
            backgroundColor: brand.bg,
            color:           brand.fg,
            fontFamily:      'system-ui, sans-serif',
            letterSpacing:   '0.03em',
          }}
        >
          {brand.name}
        </span>
      ))}
    </div>
  );
}

// ---- Stripe element shared style -----------------------------------------

const stripeElementStyle = {
  base: {
    color:         '#0f172a',
    fontFamily:    'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize:      '15px',
    lineHeight:    '20px',
    '::placeholder': { color: '#94a3b8' },
  },
  invalid: {
    color:     '#dc2626',
    iconColor: '#dc2626',
  },
};

const numberOptions: StripeCardNumberElementOptions = {
  showIcon: true,          // Stripe renders the detected brand icon inline
  placeholder: '1234 1234 1234 1234',
  style: stripeElementStyle,
};
const expiryOptions: StripeCardExpiryElementOptions = {
  placeholder: 'MM / YY',
  style: stripeElementStyle,
};
const cvcOptions: StripeCardCvcElementOptions = {
  placeholder: 'CVC',
  style: stripeElementStyle,
};

// ---- Reusable field wrapper ----------------------------------------------

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      <div className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40">
        {children}
      </div>
      {hint && (
        <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>
      )}
    </label>
  );
}

// ---- Inner form (must live inside <Elements>) -----------------------------

function CheckoutForm({
  amount,
  currency,
  country,
  onSubmit,
}: PaymentFormProps) {
  const stripe   = useStripe();
  const elements = useElements();
  const t        = useTranslations('Checkout');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');

  const getFriendlyError = (cause: unknown): string => {
    if (cause instanceof ApiError) {
      const body = cause.body as { message?: string; error?: string } | null;
      return body?.message || body?.error || t('paymentInitializationFailed');
    }
    if (cause instanceof Error && cause.message) return cause.message;
    return t('paymentFailed');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const { clientSecret } = await createPaymentIntent({ amount, currency, country });

      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) throw new Error(t('cardElementUnavailable'));

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardNumber,
            // Attach the cardholder name to billing_details — banks and
            // fraud checks weight it when scoring the transaction.
            billing_details: cardholderName ? { name: cardholderName } : undefined,
          },
        },
      );

      if (confirmError) throw new Error(confirmError.message || t('paymentFailed'));
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error(t('paymentFailed'));
      }

      await onSubmit({
        paymentIntentId: paymentIntent.id,
        amount:          paymentIntent.amount   ?? amount,
        currency:        paymentIntent.currency ?? currency,
      });
    } catch (cause) {
      setError(getFriendlyError(cause));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder name — banked separately from Stripe elements so the
          seller can autofill from browser autocomplete. */}
      <FieldShell label="Cardholder name">
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Name as it appears on the card"
          autoComplete="cc-name"
          className="w-full border-none bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        />
      </FieldShell>

      {/* Card number — Stripe injects the live brand icon on the right. */}
      <FieldShell label="Card number" hint="16-digit number on the front of the card.">
        <CardNumberElement options={numberOptions} />
      </FieldShell>

      {/* Two columns for expiry + CVC — matches every checkout the buyer
          has seen elsewhere, so the pattern is instantly familiar. */}
      <div className="grid grid-cols-2 gap-3">
        <FieldShell label="Expiry" hint="MM / YY on the front of the card.">
          <CardExpiryElement options={expiryOptions} />
        </FieldShell>
        <FieldShell label="Security code (CVC)" hint="3 digits on the back, 4 for Amex on the front.">
          <CardCvcElement options={cvcOptions} />
        </FieldShell>
      </div>

      {error && (
        <p
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
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
        <span className="inline-flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" />
          {isProcessing ? t('processingPayment') : t('payNow')}
        </span>
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

  const stripePromise = useMemo(
    () => getStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    [],
  );

  const elementsOptions: StripeElementsOptions = {
    appearance: { theme: 'stripe' },
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 space-y-5">
      {/* Header — title, subtitle, accepted-card badges */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {t('paymentDetails')}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">{t('securePayment')}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            We accept
          </p>
          <AcceptedCardBadges />
        </div>
      </div>

      <Elements stripe={stripePromise} options={elementsOptions}>
        <CheckoutForm amount={amount} currency={currency} country={country} onSubmit={onSubmit} />
      </Elements>

      {/* Footer trust bar */}
      <div className="flex items-center justify-center gap-1.5 pt-3 text-xs text-slate-500 border-t border-slate-100">
        <Shield className="h-3.5 w-3.5 text-emerald-600" />
        <span>Payments are encrypted end-to-end and processed by Stripe.</span>
      </div>
    </div>
  );
}
