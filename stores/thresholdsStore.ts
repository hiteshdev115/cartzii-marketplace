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

  /**
   * Fetch thresholds for the given seller IDs.
   * Only makes a network request when the sorted set of IDs differs from the
   * last fetched set. Silently ignores failures (empty map = no banners shown).
   */
  fetchThresholds: (sellerIds: number[]) => Promise<void>;
}

export const useThresholdsStore = create<ThresholdsState>()((set, get) => ({
  thresholds: new Map(),
  lastFetchedKey: '',

  fetchThresholds: async (sellerIds: number[]) => {
    if (sellerIds.length === 0) return;

    const key = sellerIds
      .slice()
      .sort((a, b) => a - b)
      .join(',');

    if (key === get().lastFetchedKey) return;

    const result = await getSellerShippingThresholds(sellerIds);

    set({ thresholds: result, lastFetchedKey: key });
  },
}));
