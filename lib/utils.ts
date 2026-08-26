import { getCountryConfig, currentCurrency } from '@/config/countries';
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(amount: number, locale: string = 'en-US'): string {
  const config = getCountryConfig(locale);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
}

export function formatDate(date: string | Date, locale: string = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function calculateDiscount(originalPrice: number, salePrice: number): number {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

export function getTimeRemaining(endDate: string) {
  const total = new Date(endDate).getTime() - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CZ-${timestamp}-${random}`;
}

/**
 * Coerces an API-supplied currency into something `Intl.NumberFormat` accepts.
 *
 * ISO 4217 codes are exactly three letters. Product pricing rows have been seen
 * carrying a two-letter COUNTRY code ('CA' instead of 'CAD'), and passing one to
 * NumberFormat throws `RangeError: Invalid currency code` — which, in a client
 * component, takes down the whole page rather than one price label. A money
 * string is never worth a white screen, so anything malformed falls back.
 */
export function safeCurrencyCode(
  currency: string | null | undefined,
  // This deployment's currency, not USD. On cartzii.ca a malformed code
  // used to render Canadian money with a US symbol, which is worse than
  // the RangeError this guard exists to prevent.
  fallback = currentCurrency,
): string {
  const code = String(currency ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : fallback;
}
