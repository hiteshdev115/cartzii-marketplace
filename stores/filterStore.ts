import { create } from 'zustand';
import { FilterState, SortOption } from '@/types';
// Bounds live with the predicate that reads them — two copies of "80" is how a
// slider ends up excluding the very products it is meant to surface.
import { DISCOUNT_MIN, DISCOUNT_MAX } from '@/lib/filters/productFilters';

interface FilterStore extends FilterState {
  setCategories: (categories: string[]) => void;
  setPriceRange: (range: [number | null, number | null]) => void;
  setBrands: (brands: string[]) => void;
  setRatings: (ratings: number[]) => void;
  setColors: (colors: string[]) => void;
  setSizes: (sizes: string[]) => void;
  setAvailability: (availability: FilterState['availability']) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSearchQuery: (query: string) => void;
  setOnSaleOnly: (onSale: boolean) => void;
  setDiscountRange: (range: [number, number]) => void;
  /** Replaces the selected values for one attribute; [] clears it. */
  setAttribute: (name: string, values: string[]) => void;
  toggleAttribute: (name: string, value: string) => void;
  clearAttributes: () => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  categories: [],
  priceRange: [null, null],
  brands: [],
  ratings: [],
  colors: [],
  sizes: [],
  availability: 'all',
  sortBy: 'relevance',
  searchQuery: '',
  onSaleOnly: false,
  discountRange: [DISCOUNT_MIN, DISCOUNT_MAX],
  attributes: {},
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,
  setCategories: (categories) => set({ categories }),
  setPriceRange: (priceRange) => set({ priceRange }),
  setBrands: (brands) => set({ brands }),
  setRatings: (ratings) => set({ ratings }),
  setColors: (colors) => set({ colors }),
  setSizes: (sizes) => set({ sizes }),
  setAvailability: (availability) => set({ availability }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setOnSaleOnly: (onSaleOnly) => set({ onSaleOnly }),
  setDiscountRange: (discountRange) => set({ discountRange }),

  setAttribute: (name, values) =>
    set((state) => {
      const next = { ...state.attributes };
      if (values.length === 0) delete next[name];
      else next[name] = values;
      return { attributes: next };
    }),

  toggleAttribute: (name, value) =>
    set((state) => {
      const current = state.attributes[name] ?? [];
      const values = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const next = { ...state.attributes };
      if (values.length === 0) delete next[name];
      else next[name] = values;
      return { attributes: next };
    }),

  clearAttributes: () => set({ attributes: {} }),

  // Spread a fresh copy of the nested values: reusing `initialState` directly
  // would hand every reset the same `attributes` object to mutate.
  resetFilters: () =>
    set({
      ...initialState,
      priceRange: [null, null],
      categories: [],
      brands: [],
      ratings: [],
      colors: [],
      sizes: [],
      discountRange: [DISCOUNT_MIN, DISCOUNT_MAX],
      attributes: {},
    }),
}));
