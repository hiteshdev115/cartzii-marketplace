// ---------------------------------------------------------------------------
// Guest Cart Utilities
// ---------------------------------------------------------------------------
// Manages cart state for unauthenticated users via localStorage.
// The Zustand cartStore (cartzii-cart) is the authoritative cart for logged-in
// users; this module uses a separate key ("guest_cart") so the two stores
// never conflict and guest data can be cleanly merged on login.
// ---------------------------------------------------------------------------

const GUEST_CART_KEY = 'guest_cart';

export interface GuestCartItem {
  productId: string;
  /**
   * Required. Identifies the exact variant (color, size, etc.) selected by the
   * user. Two items with the same productId but different variantIds are
   * completely separate line items and must NOT be merged.
   * Use an empty string "" only for products that have no variants at all.
   */
  variantId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  /**
   * All variant attribute values visible to the user (e.g. { color: "grey", size: "M" }).
   * Stored so the cart UI can display them and the merge API can match correctly.
   */
  selectedAttributes: Record<string, string>;
}

/**
 * Returns every item currently in the guest cart, or an empty array when
 * localStorage is unavailable (e.g. SSR) or the key doesn't exist yet.
 */
export function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Adds `item` to the guest cart.
 *
 * Duplicate detection uses BOTH `productId` AND `variantId`:
 * - Same productId + same variantId  → increment quantity (same product+variant).
 * - Same productId + different variantId → separate line item (different variant,
 *   e.g. same glove in Grey vs Black must never be collapsed into one entry).
 *
 * Returns the updated cart.
 */
export function addToGuestCart(item: GuestCartItem): GuestCartItem[] {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(
    (i) => i.productId === item.productId && i.variantId === item.variantId,
  );

  if (existingIndex !== -1) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      quantity: cart[existingIndex].quantity + item.quantity,
    };
  } else {
    cart.push(item);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    } catch {
      // Storage quota exceeded — silently ignore; in-memory result is still returned.
    }
  }

  return cart;
}

/**
 * Removes all items from the guest cart and deletes the localStorage key.
 * Call this after successfully syncing guest items to the server on login.
 */
export function clearGuestCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}

/**
 * Debugging helper — call from the browser console before checkout to verify
 * that every guest cart item has a variantId and correct selectedAttributes.
 *
 * Usage in browser console:
 *   import('@/lib/guestCart').then(m => m.debugGuestCart())
 *   // or if already bundled on the page:
 *   window.__debugGuestCart?.()
 */
export function debugGuestCart(): void {
  if (typeof window === 'undefined') {
    console.warn('[debugGuestCart] Not available in a server context.');
    return;
  }

  const raw = localStorage.getItem(GUEST_CART_KEY);
  const parsed: GuestCartItem[] = raw ? JSON.parse(raw) : [];

  console.log('=== GUEST CART IN LOCALSTORAGE ===');
  console.log(`Total items: ${parsed.length}`);

  if (parsed.length === 0) {
    console.log('(cart is empty)');
    return;
  }

  parsed.forEach((item, index) => {
    console.log(`Item ${index + 1}:`, {
      productId: item.productId,
      variantId: item.variantId,
      color: item.selectedAttributes?.color,
      size: item.selectedAttributes?.size,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
    });
    if (!item.variantId) {
      console.warn(`⚠️ Item ${index + 1} (${item.name ?? item.productId}) is MISSING variantId!`);
    }
    if (!item.selectedAttributes || Object.keys(item.selectedAttributes).length === 0) {
      console.warn(`⚠️ Item ${index + 1} (${item.name ?? item.productId}) has no selectedAttributes — variant display will be wrong after merge.`);
    }
  });
}
