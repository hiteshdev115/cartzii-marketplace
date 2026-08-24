import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';
import { getCountryConfig } from '@/config/countries';
import { addToGuestCart } from '@/lib/guestCart';
import {
  addCartItemAPI,
  fetchCartItemsAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI,
  buildCartImageUrl,
  type CartAPIItem,
} from '@/lib/api/cart';

/**
 * Fills in a variant selection the caller did not make.
 *
 * The product grid, search results, category pages and Quick View all add to
 * cart from a tile that has no colour or size picker on it. They passed
 * `undefined` for both, so a shirt that exists only as Purple/M, Purple/L,
 * Teal/M … landed in the cart as a bare product: no colour or size shown to the
 * customer, and no `variantid` sent to the API — which leaves the warehouse
 * with nothing to pick and the line priced off the parent product rather than
 * the variant.
 *
 * The rule matches what the product detail page already does — first colour,
 * first size — with one addition: a variant that is actually in stock beats one
 * that is not. Defaulting into a sold-out size is a checkout failure waiting to
 * happen, and the tile gives the customer no way to see it coming.
 *
 * A caller that DID choose is never overridden, and a product with no variants
 * stays undefined, which is correct: there is nothing to choose.
 */
function resolveDefaultSelection(
  product: Product,
  color?: string,
  size?: string,
): { color?: string; size?: string } {
  if (color && size) return { color, size };

  const variants = product.detailVariants ?? [];
  if (variants.length > 0) {
    // Honour a partial choice: given a colour, the default size is one that
    // actually exists in that colour rather than the product's first size.
    const candidates = variants.filter(
      (v) => (!color || v.color === color) && (!size || v.size === size),
    );
    const chosen = candidates.find((v) => v.inStock) ?? candidates[0];
    if (chosen) {
      return { color: color ?? chosen.color, size: size ?? chosen.size };
    }
  }

  // No variant rows — fall back to the same first-option rule the detail page
  // uses, so the two entry points can never disagree about what "default" means.
  return {
    color: color ?? product.colors?.[0]?.value,
    size: size ?? product.sizes?.[0],
  };
}

// ---- Map API cart item → local CartItem -----------------------------------

function mapAPIItemToCartItem(item: CartAPIItem): CartItem {
  const price = parseFloat(item.price) || 0;

  const color = item.variant?.attributes.find(
    (a) => a.attributename.toLowerCase() === 'color',
  )?.valuename;
  const size = item.variant?.attributes.find(
    (a) => a.attributename.toLowerCase() === 'size',
  )?.valuename;

  const variantAttributes = item.variant?.attributes.map((a) => ({
    name: a.attributename,
    value: a.valuename,
  }));

  // product.image already reflects variant image (server priority: variant → product → null)
  const imageUrl = buildCartImageUrl(item.product.image);

  const product: Product = {
    id: String(item.productid),
    name: item.product.productname,
    slug: item.product.slug,
    description: item.product.shortdescription || '',
    shortDescription: item.product.shortdescription || '',
    price,
    currency: item.currencycode || 'USD',
    images: [imageUrl],
    category: item.product.category?.categoryname || '',
    categorySlug: item.product.category?.categoryslug || '',
    brand: '',
    rating: 0,
    reviewCount: 0,
    sku: item.variant?.sku || item.product.sku || '',
    inStock: (item.variant?.stockquantity ?? item.product.stockquantity) > 0,
    stockCount: item.variant?.stockquantity ?? item.product.stockquantity,
    tags: [],
    isNew: false,
    onSale: false,
    isFeatured: false,
    isBestSeller: false,
    specifications: {},
    createdAt: item.addedat,
    // Seller info — required for multi-seller shipping-rate grouping.
    // Prefer the value on the product object; fall back to the item-level
    // field if the server surfaces it there instead.
    sellerId: item.product.sellerid ?? item.sellerid,
    sellerName: item.product.sellername,
  };

  return {
    product,
    quantity: item.quantity,
    selectedColor: color,
    selectedSize: size,
    variantAttributes: variantAttributes?.length ? variantAttributes : undefined,
    cartId: item.cartid,
    variantId: item.variantid ?? undefined,
    price: item.price,
    countryCode: item.countrycode ?? undefined,
    currencyCode: item.currencycode ?? undefined,
  };
}

// ---- BackendCartItem: raw shape returned by GET /api/v1/cart/:userid ------
// (A lighter alternative to CartAPIItem — no pre-resolved variant attributes)

export interface BackendCartItem {
  cartid: number;
  productid: number;
  variantid: number | null;
  quantity: number;
  price: string;
  countrycode?: string | null;
  currencycode?: string | null;
  /** Optional seller id surfaced at the cart-item level. */
  sellerid?: number;
  product: {
    productid: number;
    productname: string;
    slug?: string;
    sku?: string;
    shortdescription?: string;
    stockquantity?: number;
    /** Seller who owns this product. Required for multi-seller shipping. */
    sellerid?: number;
    sellername?: string;
    productimages?: Array<{ imageurl: string; isprimary: boolean }>;
  };
  /**
   * Variant attribute values as stored by the guest cart / merge endpoint.
   * e.g. { color: "grey", size: "M" }.
   * These are the user's actual selections and must be used for display — never
   * fall back to a product default.
   */
  selectedAttributes?: Record<string, string>;
}

// Map BackendCartItem → local CartItem
function mapBackendItemToCartItem(item: BackendCartItem): CartItem {
  const price = parseFloat(item.price) || 0;

  // Prefer the primary image; fall back to first image; then placeholder
  const primaryImage =
    item.product.productimages?.find((img) => img.isprimary)?.imageurl ??
    item.product.productimages?.[0]?.imageurl ??
    null;
  const imageUrl = buildCartImageUrl(primaryImage);

  // Derive variant display fields from selectedAttributes — these are the
  // user's actual selections stored by the guest cart / merge endpoint.
  // Never fall back to a product-level default.
  const attrs = item.selectedAttributes ?? {};
  const selectedColor = attrs['color'] ?? attrs['Color'] ?? undefined;
  const selectedSize = attrs['size'] ?? attrs['Size'] ?? undefined;

  // Build the full variantAttributes array for the cart UI to render
  const variantAttributes = Object.entries(attrs).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const product: Product = {
    id: String(item.productid),
    name: item.product.productname,
    slug: item.product.slug ?? '',
    description: item.product.shortdescription ?? '',
    shortDescription: item.product.shortdescription ?? '',
    price,
    currency: item.currencycode ?? 'USD',
    // Use the resolved image directly — do NOT re-fetch or fall back to a
    // product-level default image.
    images: [imageUrl],
    category: '',
    categorySlug: '',
    brand: '',
    rating: 0,
    reviewCount: 0,
    sku: item.product.sku ?? '',
    inStock: (item.product.stockquantity ?? 1) > 0,
    stockCount: item.product.stockquantity ?? 0,
    tags: [],
    isNew: false,
    onSale: false,
    isFeatured: false,
    isBestSeller: false,
    specifications: {},
    createdAt: new Date().toISOString(),
    sellerId: item.product.sellerid ?? item.sellerid,
    sellerName: item.product.sellername,
  };

  return {
    product,
    quantity: item.quantity,
    selectedColor,
    selectedSize,
    variantAttributes: variantAttributes.length > 0 ? variantAttributes : undefined,
    cartId: item.cartid,
    variantId: item.variantid ?? undefined,
    price: item.price,
    countryCode: item.countrycode ?? undefined,
    currencyCode: item.currencycode ?? undefined,
  };
}

// ---- Read current auth userId from localStorage ---------------------------

function getAuthUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cartzii-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.userId ?? null;
  } catch {
    return null;
  }
}

// ---- Store interface ------------------------------------------------------

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addItem: (
    product: Product,
    quantity?: number,
    color?: string,
    size?: string,
    locale?: string,
  ) => Promise<void>;
  removeItem: (
    productId: string,
    selectedColor?: string,
    selectedSize?: string,
  ) => Promise<void>;
  updateQuantity: (
    productId: string,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string,
  ) => Promise<void>;
  clearCart: (userId?: string) => Promise<void>;
  /** Fetch server cart and replace local items (for authenticated users). */
  loadCart: (userId: string) => Promise<void>;
  /** After login: push guest cart items to server, then load merged cart. */
  syncGuestCart: (userId: string, locale?: string) => Promise<void>;
  /**
   * Merge raw server items into local cart without making any API calls.
   * Merge strategy: for items that exist locally (matched by productid + variantid),
   * keep whichever quantity is higher — so the user never sees their cart shrink.
   * New server items are appended. Duplicates are deduplicated by productid:variantid key.
   */
  hydrateFromServer: (serverItems: BackendCartItem[]) => void;
  /**
   * Replace the entire cart with the server response as the single source of truth.
   * Use this after a merge/sync operation where the server has already reconciled
   * all conflicts — no local patching or quantity comparison is performed.
   */
  replaceCart: (serverItems: BackendCartItem[]) => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

// ---- Store ----------------------------------------------------------------

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      addItem: async (product, quantity = 1, requestedColor, requestedSize, locale) => {
        // Resolved once, up front: every branch below (guest state, guest cart
        // persistence, optimistic update, API call) keys off this pair, and
        // they must all agree or the same product lands in the cart twice.
        const { color, size } = resolveDefaultSelection(product, requestedColor, requestedSize);

        const onCartPage =
          typeof window !== 'undefined' &&
          (window.location.pathname.includes('/cart') || window.location.pathname.includes('/checkout'));
        if (!onCartPage) set({ isDrawerOpen: true });
        const userId = getAuthUserId();

        if (!userId) {
          // Guest: update Zustand local state
          set((state) => {
            const existing = state.items.find(
              (item) =>
                item.product.id === product.id &&
                item.selectedColor === color &&
                item.selectedSize === size,
            );
            if (existing) {
              return {
                items: state.items.map((item) =>
                  item.product.id === product.id &&
                  item.selectedColor === color &&
                  item.selectedSize === size
                    ? { ...item, quantity: item.quantity + quantity }
                    : item,
                ),
              };
            }
            return {
              items: [
                ...state.items,
                { product, quantity, selectedColor: color, selectedSize: size },
              ],
            };
          });

          // Also persist to guest_cart so mergeCartOnLogin can pick up variantId
          const guestVariant = product.detailVariants?.find(
            (v) => (!color || v.color === color) && (!size || v.size === size),
          ) ?? (color ? product.detailVariants?.find((v) => v.color === color) : undefined);
          addToGuestCart({
            productId: product.id,
            variantId: guestVariant?.variantId ?? '',
            name: product.name,
            image: product.images?.[0] ?? '',
            price: product.salePrice ?? product.price,
            quantity,
            selectedAttributes: {
              ...(color ? { color } : {}),
              ...(size ? { size } : {}),
            },
          });
          return;
        }

        // Authenticated: optimistic update then API call
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.product.id === product.id &&
              item.selectedColor === color &&
              item.selectedSize === size,
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id &&
                item.selectedColor === color &&
                item.selectedSize === size
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { product, quantity, selectedColor: color, selectedSize: size },
            ],
          };
        });

        try {
          // Resolve variant from detailVariants using the user's current selection
          const matchedVariant = product.detailVariants?.find(
            (v) => (!color || v.color === color) && (!size || v.size === size),
          ) ?? (color ? product.detailVariants?.find((v) => v.color === color) : undefined);
          const variantId = matchedVariant?.variantId
            ? parseInt(matchedVariant.variantId, 10)
            : undefined;

          const countryConfig = locale ? getCountryConfig(locale) : null;
          const priceNum = matchedVariant?.salePrice ?? matchedVariant?.price ?? product.salePrice ?? product.price;

          await addCartItemAPI({
            userid: parseInt(userId, 10),
            productid: parseInt(product.id, 10),
            variantid: variantId,
            quantity,
            price: String(priceNum),
            countrycode: countryConfig?.code.toUpperCase(),
            currencycode: countryConfig?.currency,
            selectedAttributes: {
              ...(color ? { color } : {}),
              ...(size ? { size } : {}),
            },
            name: product.name,
            image: matchedVariant?.images?.[0] ?? product.images?.[0],
          });

          // Refresh from server to get accurate cartId and merged quantities
          await get().loadCart(userId);
        } catch {
          // Refresh to stay in sync with server on error
          await get().loadCart(userId);
        }
      },

      removeItem: async (productId, selectedColor, selectedSize) => {
        const userId = getAuthUserId();

        const item = get().items.find(
          (i) =>
            i.product.id === productId &&
            (selectedColor === undefined || i.selectedColor === selectedColor) &&
            (selectedSize === undefined || i.selectedSize === selectedSize),
        );
        if (!item) return;

        // Optimistic removal
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.product.id === productId &&
                (selectedColor === undefined || i.selectedColor === selectedColor) &&
                (selectedSize === undefined || i.selectedSize === selectedSize)
              ),
          ),
        }));

        if (!userId || !item.cartId) return;

        try {
          await removeCartItemAPI(item.cartId, userId);
        } catch {
          // Revert on failure
          set((state) => ({ items: [...state.items, item] }));
        }
      },

      updateQuantity: async (productId, quantity, selectedColor, selectedSize) => {
        if (quantity < 1) return;

        const userId = getAuthUserId();

        const item = get().items.find(
          (i) =>
            i.product.id === productId &&
            (selectedColor === undefined || i.selectedColor === selectedColor) &&
            (selectedSize === undefined || i.selectedSize === selectedSize),
        );
        if (!item) return;

        const prevQuantity = item.quantity;

        // Optimistic update
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId &&
            (selectedColor === undefined || i.selectedColor === selectedColor) &&
            (selectedSize === undefined || i.selectedSize === selectedSize)
              ? { ...i, quantity }
              : i,
          ),
        }));

        if (!userId || !item.cartId) return;

        try {
          await updateCartItemAPI({
            cartid: item.cartId,
            quantity,
            price: item.price,
          });
        } catch {
          // Revert on failure
          set((state) => ({
            items: state.items.map((i) =>
              i.product.id === productId &&
              (selectedColor === undefined || i.selectedColor === selectedColor) &&
              (selectedSize === undefined || i.selectedSize === selectedSize)
                ? { ...i, quantity: prevQuantity }
                : i,
            ),
          }));
        }
      },

      clearCart: async (userId) => {
        const uid = userId ?? getAuthUserId() ?? undefined;
        set({ items: [] });
        if (!uid) return;
        try {
          await clearCartAPI(uid);
        } catch {
          // Already cleared locally; ignore API failure
        }
      },

      loadCart: async (userId) => {
        set({ isLoading: true });
        try {
          const result = await fetchCartItemsAPI(userId);
          set({ items: result.cart.map(mapAPIItemToCartItem) });
        } catch {
          // Network error — clear local cart so stale data isn't shown
          set({ items: [] });
        } finally {
          set({ isLoading: false });
        }
      },

      syncGuestCart: async (userId, locale) => {
        const guestItems = [...get().items];

        if (guestItems.length > 0) {
          const userIdNum = parseInt(userId, 10);
          const countryConfig = locale ? getCountryConfig(locale) : null;

          // Push each guest item to server; errors are silently swallowed
          await Promise.allSettled(
            guestItems.map((item) =>
              addCartItemAPI({
                userid: userIdNum,
                productid: parseInt(item.product.id, 10),
                variantid: item.variantId,
                quantity: item.quantity,
                price: item.price ?? String(item.product.salePrice ?? item.product.price),
                countrycode: countryConfig?.code.toUpperCase() ?? item.countryCode,
                currencycode: countryConfig?.currency ?? item.currencyCode,
              }),
            ),
          );
        }

        // Replace local items with merged server cart
        await get().loadCart(userId);
      },

      replaceCart: (serverItems) => {
        set({ items: serverItems.map(mapBackendItemToCartItem) });
      },

      hydrateFromServer: (serverItems) => {
        const local = get().items;

        // ---- DEBUG: log inputs and match results ---------------------------
        console.log('=== CART MERGE DEBUG (hydrateFromServer) ===')
        console.log('User (local) cart items:', JSON.stringify(
          local.map((i) => ({
            productId: i.product.id,
            variantId: i.variantId,
            color: i.selectedColor,
            size: i.selectedSize,
            quantity: i.quantity,
          })),
          null, 2,
        ))
        console.log('Server cart items:', JSON.stringify(
          serverItems.map((i) => ({
            productId: i.productid,
            variantId: i.variantid,
            color: i.selectedAttributes?.color,
            size: i.selectedAttributes?.size,
            quantity: i.quantity,
          })),
          null, 2,
        ))
        serverItems.forEach((serverItem) => {
          const match = local.find(
            (item) =>
              item.product.id === String(serverItem.productid) &&
              (item.variantId ?? null) === (serverItem.variantid ?? null),
          )
          console.log(
            `Server item [productId: ${serverItem.productid} | variantId: ${serverItem.variantid}] → Local match found: ${!!match}`,
            match ? `(local qty: ${match.quantity}, server qty: ${serverItem.quantity})` : '',
          )
        })
        // ---- END DEBUG -----------------------------------------------------

        // Index local items by "productid:variantid" for O(1) lookup
        const localIndex = new Map(
          local.map((item) => [
            `${item.product.id}:${item.variantId ?? 'null'}`,
            item,
          ]),
        );

        // Build merged list starting from server items (authoritative source)
        const merged: CartItem[] = serverItems.map((serverItem) => {
          const key = `${serverItem.productid}:${serverItem.variantid ?? 'null'}`;
          const localItem = localIndex.get(key);

          const mapped = mapBackendItemToCartItem(serverItem);

          if (localItem) {
            // Keep the higher quantity so the user's intent is never silently reduced
            return { ...mapped, quantity: Math.max(localItem.quantity, mapped.quantity) };
          }
          return mapped;
        });

        // Append any local-only items (guest items not yet synced to server)
        const serverKeys = new Set(
          serverItems.map((i) => `${i.productid}:${i.variantid ?? 'null'}`),
        );
        for (const localItem of local) {
          const key = `${localItem.product.id}:${localItem.variantId ?? 'null'}`;
          if (!serverKeys.has(key)) {
            merged.push(localItem);
          }
        }

        set({ items: merged });
      },

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) =>
            sum + (item.product.salePrice ?? item.product.price) * item.quantity,
          0,
        ),
    }),
    {
      name: 'cartzii-cart',
      version: 1,
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { items: CartItem[] };
        if (version === 0 && state?.items) {
          state.items = state.items.map((item) => ({
            ...item,
            product: {
              ...item.product,
              images: item.product.images.map((url) =>
                url.replace(/via\.placeholder\.com\/([^?]+)\?/, 'placehold.co/$1.png?'),
              ),
            },
          }));
        }
        return state;
      },
    },
  ),
);
