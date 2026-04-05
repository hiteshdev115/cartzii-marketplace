import { create } from 'zustand';
import { FilterState, SortOption } from '@/types';

interface FilterStore extends FilterState {
  setCategories: (categories: string[]) => void;
  setPriceRange: (range: [number, number]) => void;
  setBrands: (brands: string[]) => void;
  setRatings: (ratings: number[]) => void;
  setColors: (colors: string[]) => void;
  setSizes: (sizes: string[]) => void;
  setAvailability: (availability: FilterState['availability']) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  categories: [],
  priceRange: [0, 500],
  brands: [],
  ratings: [],
  colors: [],
  sizes: [],
  availability: 'all',
  sortBy: 'relevance',
  searchQuery: '',
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
  resetFilters: () => set(initialState),
}));
