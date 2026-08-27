/**
 * What "out of stock" means, in one place.
 *
 * Five surfaces let a shopper add to cart — the product card, the product page,
 * quick view, the category grid and search — and each had its own idea of
 * whether stock mattered. Mostly they had none at all: the buttons were always
 * live, so a sold-out product could be added, checked out and paid for before
 * anything noticed. Sharing the rule is what stops them drifting again.
 */
import type { Product } from '@/types';

/**
 * True when nothing can be bought.
 *
 * `stockCount` leads and `inStock` is the fallback. They can disagree — the
 * flag is derived at map time while the count comes from the row — and a
 * product with zero units is unbuyable whatever the flag says.
 */
export function isOutOfStock(product: Pick<Product, 'inStock' | 'stockCount'>): boolean {
  if (typeof product.stockCount === 'number') return product.stockCount <= 0;
  return product.inStock === false;
}

/** Below this, the remaining units are worth showing to nudge a decision. */
export const LOW_STOCK_THRESHOLD = 5;

export function isLowStock(product: Pick<Product, 'inStock' | 'stockCount'>): boolean {
  return (
    !isOutOfStock(product) &&
    typeof product.stockCount === 'number' &&
    product.stockCount > 0 &&
    product.stockCount <= LOW_STOCK_THRESHOLD
  );
}

/**
 * The most a shopper may put in the cart.
 *
 * Caps the quantity selector at what actually exists, so the cart cannot be
 * built into an order the checkout will then reject for stock.
 */
export function maxPurchasable(product: Pick<Product, 'inStock' | 'stockCount'>): number {
  if (isOutOfStock(product)) return 0;
  return typeof product.stockCount === 'number' && product.stockCount > 0
    ? product.stockCount
    : 1;
}
