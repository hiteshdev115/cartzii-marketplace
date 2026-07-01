// ---------------------------------------------------------------------------
// mergeCartOnLogin
// ---------------------------------------------------------------------------
// After a successful login, reads the lightweight "guest_cart" from
// localStorage and pushes each item to the server via POST /api/v1/cart/add.
// This guarantees both NEW products (not yet in the server cart) and existing
// products (quantity top-up) are handled — the merge endpoint only updates
// quantities for already-existing cart rows and cannot insert new items.
// ---------------------------------------------------------------------------

import { addCartItemAPI } from '@/lib/api/cart';
import { getGuestCart, clearGuestCart, GuestCartItem } from '@/lib/guestCart';
import { useCartStore } from '@/stores/cartStore';

/**
 * Pushes every guest cart item to the authenticated user's server cart.
 *
 * Steps:
 *   1. Read "guest_cart" from localStorage.
 *   2. If empty, bail out (nothing to do).
 *   3. For each valid item, call POST /api/v1/cart/add (handles both insert
 *      and quantity-update / upsert server-side).
 *   4. On completion: clear guest_cart and reload the cart from the server.
 *      guest_cart is NOT cleared if all adds fail so items aren't lost.
 *
 * @param accessToken  The bearer token — already stored in localStorage by
 *                     setTokens() so addCartItemAPI picks it up automatically.
 * @param userId       The authenticated user's numeric ID string.
 */
export async function mergeCartOnLogin(accessToken: string, userId: string): Promise<void> {
  // accessToken is kept in the signature for API compatibility; the api client
  // reads it from localStorage (set by authStore.setTokens before this call).
  void accessToken;

  const guestItems: GuestCartItem[] = getGuestCart();

  if (guestItems.length === 0) return;

  const validItems = guestItems.filter((item) => {
    // variantId is '' for products that have no variants — that is valid and
    // must be allowed through. Only skip items where variantId is literally
    // undefined or null (meaning the variant was never captured at all).
    if (item.variantId === undefined || item.variantId === null) {
      console.warn(
        '[mergeCartOnLogin] Skipping guest cart item with missing variantId:',
        { productId: item.productId, name: item.name },
      );
      return false;
    }
    return true;
  });

  if (validItems.length === 0) return;

  // ---- DEBUG ---------------------------------------------------------------
  console.log('=== CART MERGE DEBUG ===');
  console.log('Guest items being added to server cart:', JSON.stringify(
    validItems.map((i) => ({
      productid: i.productId,
      variantid: i.variantId,
      color: i.selectedAttributes?.color,
      size: i.selectedAttributes?.size,
      quantity: i.quantity,
      price: String(i.price),
    })),
    null, 2,
  ));
  // ---- END DEBUG -----------------------------------------------------------

  const userIdNum = parseInt(userId, 10);

  // Push every guest item individually. Promise.allSettled ensures a failure
  // on one item doesn't block the others.
  const results = await Promise.allSettled(
    validItems.map((item) => {
      // variantId === '' means the product has no variants — send undefined
      // so the server treats it as a no-variant add (variantid is optional).
      const variantid = item.variantId ? parseInt(item.variantId, 10) : undefined;
      return addCartItemAPI({
        userid: userIdNum,
        productid: parseInt(item.productId, 10),
        variantid,
        quantity: item.quantity,
        price: String(item.price),
        ...(Object.keys(item.selectedAttributes ?? {}).length > 0
          ? { selectedAttributes: item.selectedAttributes }
          : {}),
      });
    }),
  );

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`[mergeCartOnLogin] ${failures.length}/${validItems.length} item(s) failed to add.`);
  }

  // Only clear guest_cart if at least one item was successfully added so
  // items aren't silently lost on a complete network failure.
  const anySucceeded = results.some((r) => r.status === 'fulfilled');
  if (anySucceeded || failures.length === 0) {
    clearGuestCart();
  }

  // Reload the full cart from the server — single source of truth.
  await useCartStore.getState().loadCart(userId);
}

