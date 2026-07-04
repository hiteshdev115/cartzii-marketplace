import { create } from 'zustand';
import { getSellerShippingThresholds, type SellerThreshold } from '@/lib/thresholdsApi';

interface ThresholdsState {
  /** Map of sellerId → SellerThreshold fetched from the API. */
  thresholds: Map<number, SellerThreshold>;

  /**
   * Sorted, comma-joined string of the last fetched seller IDs.
   * Used to skip re-fetching when the set of sellers has not changed.
   */
  lastFetchedKey: string;

  /** Key of the fetch currently in-flight (if any), to prevent duplicate requests. */
  fetchingKey: string;

  /**
   * Fetch thresholds for the given seller IDs.
   * Only makes a network request when the sorted set of IDs differs from the
   * last fetched set and no fetch for that set is already in-flight.
   * Silently ignores failures (empty map = no banners shown).
   */
  fetchThresholds: (sellerIds: number[]) => Promise<void>;
}

export const useThresholdsStore = create<ThresholdsState>()((set, get) => ({
  thresholds: new Map(),
  lastFetchedKey: '',
  fetchingKey: '',

  fetchThresholds: async (sellerIds: number[]) => {
    if (sellerIds.length === 0) return;

    const key = sellerIds
      .slice()
      .sort((a, b) => a - b)
      .join(',');

    const state = get();
    if (key === state.lastFetchedKey || key === state.fetchingKey) return;

    set({ fetchingKey: key });

    const result = await getSellerShippingThresholds(sellerIds);

    set((s) => {
      // Only commit if this fetch is still the most recent one.
      if (s.fetchingKey !== key) return {};
      return { thresholds: result, lastFetchedKey: key, fetchingKey: '' };
    });
  },
}));
