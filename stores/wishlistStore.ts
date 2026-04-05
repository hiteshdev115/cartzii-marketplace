import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, WishlistItem } from '@/types';

interface WishlistStore {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => void;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        if (get().isInWishlist(product.id)) return;
        set((state) => ({
          items: [...state.items, { product, addedAt: new Date().toISOString() }],
        }));
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },
      isInWishlist: (productId) => get().items.some((item) => item.product.id === productId),
      toggleItem: (product) => {
        if (get().isInWishlist(product.id)) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },
      getItemCount: () => get().items.length,
    }),
    {
      name: 'cartzii-wishlist',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { items: WishlistItem[] };
        if (version === 0 && state?.items) {
          state.items = state.items.map((item) => ({
            ...item,
            product: {
              ...item.product,
              images: item.product.images.map((url) =>
                url.replace(/via\.placeholder\.com\/([^?]+)\?/, 'placehold.co/$1.png?')
              ),
            },
          }));
        }
        return state;
      },
    }
  )
);
