/**
 * What counts as a deal, and what counts as still-a-bargain once it ends.
 *
 * A flash deal has a window. The API attaches `deal` only while that window is
 * open, so a freshly-fetched product is already correct — but a card sitting on
 * screen was fetched at some earlier moment, and its window can close while the
 * shopper is looking at it. That in-between state is what this file exists for.
 */
import type { Product } from '@/types';
import { discountPercent } from '@/lib/filters/productFilters';

/**
 * The saving at which a product is worth featuring, deal or not.
 *
 * One constant: the Flash Deals section uses it to decide what to show, and the
 * card uses it to decide whether to keep highlighting a product after its
 * countdown runs out. Two numbers would eventually disagree and a product would
 * be listed in a section whose own card refused to call it a deal.
 */
export const SPECIAL_DISCOUNT_MIN = 20;

/** True while the deal's window is still open. */
export function isDealActive(product: Product, now: number = Date.now()): boolean {
  if (!product.deal) return false;
  const ends = new Date(product.deal.endsAt).getTime();
  return Number.isFinite(ends) && ends > now;
}

/**
 * True when the product is worth highlighting without a live deal.
 *
 * Covers two cases that look identical to a shopper: a product whose flash deal
 * just ended, and one that never had a deal but carries a deep standing
 * markdown. Both get the same badge — nobody browsing cares which mechanism
 * produced the saving.
 *
 * ProductCard does not call this: it needs the answer to change the instant a
 * window closes on screen, which a pure function cannot signal. It composes
 * the same two conditions from useDealActive instead.
 */
export function hasSpecialDiscount(product: Product, now: number = Date.now()): boolean {
  return !isDealActive(product, now) && discountPercent(product) >= SPECIAL_DISCOUNT_MIN;
}
