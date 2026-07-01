import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a singleton Stripe.js instance.
 * Accepts an optional publishableKey (e.g. returned from the create-intent API)
 * which takes precedence over the env-var fallback.
 * Pass a new key to force re-initialisation (stripePromise is reset).
 */
export function getStripe(publishableKey?: string): Promise<Stripe | null> {
  const key = publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

  if (!stripePromise || publishableKey) {
    stripePromise = loadStripe(key);
  }

  return stripePromise;
}
