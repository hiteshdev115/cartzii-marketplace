import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShippingFormData } from '@/lib/validators';
import type { SellerRateQuote, ShippingRate } from '@/lib/shippingApi';

export type { SellerRateQuote, ShippingRate };

interface CheckoutState {
  /** Locked shipping address (set after the shipping form is submitted). */
  shippingAddress: ShippingFormData | null;

  /** Rate quotes fetched for each seller in the cart. */
  sellerRateQuotes: SellerRateQuote[];

  /** Map of sellerId → the rate the buyer has chosen. */
  selectedRates: Record<number, ShippingRate>;

  // ---- Actions -----------------------------------------------------------

  setShippingAddress: (address: ShippingFormData | null) => void;
  setSellerRateQuotes: (quotes: SellerRateQuote[]) => void;
  setSelectedRate: (sellerId: number, rate: ShippingRate) => void;
  clearRates: () => void;
  clearCheckout: () => void;

  // ---- Computed helpers --------------------------------------------------

  /** Total shipping cost in cents across all selected rates. */
  getTotalShippingCents: () => number;

  /**
   * True when every seller that returned valid rates has a selected rate.
   * Sellers with unresolvable errors (NO_ORIGIN, NOT_CONFIGURED) are excluded
   * from this check (they block checkout via a different path).
   */
  allRatesSelected: () => boolean;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      shippingAddress: null,
      sellerRateQuotes: [],
      selectedRates: {},

      setShippingAddress: (address) => set({ shippingAddress: address }),

      setSellerRateQuotes: (quotes) => {
        // Auto-select the cheapest rate for each seller that has rates.
        const autoSelected: Record<number, ShippingRate> = {};
        for (const quote of quotes) {
          if (quote.rates && quote.rates.length > 0) {
            const cheapest = [...quote.rates].sort((a, b) => a.rate - b.rate)[0];
            autoSelected[quote.sellerId] = cheapest;
          }
        }
        set({ sellerRateQuotes: quotes, selectedRates: autoSelected });
      },

      setSelectedRate: (sellerId, rate) =>
        set((s) => ({
          selectedRates: { ...s.selectedRates, [sellerId]: rate },
        })),

      clearRates: () => set({ sellerRateQuotes: [], selectedRates: {} }),

      clearCheckout: () =>
        set({ shippingAddress: null, sellerRateQuotes: [], selectedRates: {} }),

      getTotalShippingCents: () => {
        const state = get();
        return Object.entries(state.selectedRates).reduce((sum, [sellerIdStr, r]) => {
          if (!r) return sum;
          const sellerId = Number(sellerIdStr);
          const quote = state.sellerRateQuotes.find((q) => q.sellerId === sellerId);
          if (quote?.freeShippingApplied) return sum; // zero out for free-shipping sellers
          return sum + Math.round(r.rate * 100);
        }, 0);
      },

      allRatesSelected: () => {
        const { sellerRateQuotes, selectedRates } = get();
        if (sellerRateQuotes.length === 0) return false;
        for (const quote of sellerRateQuotes) {
          if (quote.error) continue; // seller with error blocks via separate flag
          if (quote.rates && quote.rates.length > 0 && !selectedRates[quote.sellerId]) {
            return false;
          }
        }
        return true;
      },
    }),
    {
      name: 'cartzii-checkout',
      partialize: (s) => ({
        shippingAddress: s.shippingAddress,
        sellerRateQuotes: s.sellerRateQuotes,
        selectedRates: s.selectedRates,
      }),
    },
  ),
);
