import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';
import { getCountryConfig } from '@/config/countries';
import {
  addCartItemAPI,
  fetchCartItemsAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI,
  buildCartImageUrl,
  type CartAPIItem,
} from '@/lib/api/cart';

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
  getItemCount: () => number;
  getSubtotal: () => number;
}

// ---- Store ----------------------------------------------------------------

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: async (product, quantity = 1, color, size, locale) => {
        const userId = getAuthUserId();

        if (!userId) {
          // Guest: local state only
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
          // Resolve variant ID from detailVariants when color/size is selected
          const matchedVariant = product.detailVariants?.find(
            (v) => (!color || v.color === color) && (!size || v.size === size),
          ) ?? product.detailVariants?.find(
            (v) => !color || v.color === color,
          );
          const variantId = matchedVariant?.variantId
            ? parseInt(matchedVariant.variantId, 10)
            : undefined;

          const countryConfig = locale ? getCountryConfig(locale) : null;
          const priceNum = product.salePrice ?? product.price;

          await addCartItemAPI({
            userid: parseInt(userId, 10),
            productid: parseInt(product.id, 10),
            variantid: variantId,
            quantity,
            price: String(priceNum),
            countrycode: countryConfig?.code.toUpperCase(),
            currencycode: countryConfig?.currency,
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
