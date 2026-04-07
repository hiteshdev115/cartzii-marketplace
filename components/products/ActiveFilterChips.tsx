'use client';

import { useEffect, useState } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import { fetchRootCategories } from '@/lib/api';
import { Category } from '@/types';
import { X, Star } from 'lucide-react';

export function ActiveFilterChips() {
  const filters = useFilterStore();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchRootCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const hasPriceFilter = filters.priceRange[0] > 0 || filters.priceRange[1] < 500;
  const activeCount =
    filters.categories.length +
    filters.brands.length +
    filters.ratings.length +
    (hasPriceFilter ? 1 : 0);

  if (activeCount === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap py-3">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
        Active filters:
      </span>

      {/* Category chips */}
      {filters.categories.map((slug) => {
        const cat = categories.find((c) => c.slug === slug);
        return (
          <button
            key={`cat-${slug}`}
            onClick={() => filters.setCategories(filters.categories.filter((c) => c !== slug))}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full hover:bg-primary/20 transition-colors"
          >
            {cat?.name || slug}
            <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </button>
        );
      })}

      {/* Brand chips */}
      {filters.brands.map((brand) => (
        <button
          key={`brand-${brand}`}
          onClick={() => filters.setBrands(filters.brands.filter((b) => b !== brand))}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full hover:bg-blue-100 transition-colors"
        >
          {brand}
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      ))}

      {/* Rating chips */}
      {filters.ratings.map((rating) => (
        <button
          key={`rating-${rating}`}
          onClick={() => filters.setRatings(filters.ratings.filter((r) => r !== rating))}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-full hover:bg-amber-100 transition-colors"
        >
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {rating}+ Stars
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      ))}

      {/* Price range chip */}
      {hasPriceFilter && (
        <button
          onClick={() => filters.setPriceRange([0, 500])}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full hover:bg-green-100 transition-colors"
        >
          ${filters.priceRange[0]} – ${filters.priceRange[1]}
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      )}

      {/* Clear all */}
      {activeCount > 1 && (
        <button
          onClick={() => filters.resetFilters()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear all
        </button>
      )}
    </div>
  );
}
