import { create } from 'zustand';
import {
  fetchWishlistItems,
  addToWishlistAPI,
  removeFromWishlistAPI,
} from '@/lib/api/wishlist';
import type { WishlistAPIItem } from '@/lib/api/wishlist';

interface WishlistStore {
  items: WishlistAPIItem[];
  loading: boolean;
  /** Fetch wishlist from API for the logged-in user */
  fetchItems: (userId: string) => Promise<void>;
  /** Add a product (by numeric id) to wishlist via API */
  addItem: (userId: string, productId: number) => Promise<boolean>;
  /** Remove a product (by numeric id) from wishlist via API */
  removeItem: (userId: string, productId: number) => Promise<boolean>;
  /** Toggle add/remove */
  toggleItem: (userId: string, productId: number) => Promise<boolean>;
  /** Check if a product is in the wishlist (by numeric id) */
  isInWishlist: (productId: number) => boolean;
  /** Get count */
  getItemCount: () => number;
  /** Clear local state (on logout) */
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],
  loading: false,

  fetchItems: async (userId) => {
    set({ loading: true });
    try {
      const items = await fetchWishlistItems(userId);
      set({ items });
    } catch (err) {
      // Re-throw auth errors so callers (e.g. Header) can clear the session
      if (err instanceof Error && err.message === 'Invalid auth token') throw err;
      // keep existing items on other network errors
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (userId, productId) => {
    try {
      const res = await addToWishlistAPI(userId, productId);
      if (res.success) {
        // Refresh the full list to get accurate data from server
        await get().fetchItems(userId);
        return true;
      }
    } catch {
      // silent failure
    }
    return false;
  },

  removeItem: async (userId, productId) => {
    // Optimistic removal
    const prev = get().items;
    set({ items: prev.filter((i) => i.product.productid !== productId) });
    try {
      const ok = await removeFromWishlistAPI(userId, productId);
      if (!ok) {
        // revert on failure
        set({ items: prev });
        return false;
      }
      return true;
    } catch {
      set({ items: prev });
      return false;
    }
  },

  toggleItem: async (userId, productId) => {
    if (get().isInWishlist(productId)) {
      return get().removeItem(userId, productId);
    }
    return get().addItem(userId, productId);
  },

  isInWishlist: (productId) =>
    get().items.some((i) => i.product.productid === productId),

  getItemCount: () => get().items.length,

  clear: () => set({ items: [], loading: false }),
}));
