'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCountryFromLocale } from '@/config/countries';
import { fetchAllProducts } from '@/lib/api/products';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ActiveFilterChips } from '@/components/products/ActiveFilterChips';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFilterStore } from '@/stores/filterStore';
import { applyFilters, deriveFacets } from '@/lib/filters/productFilters';
import type { Product, SortOption } from '@/types';

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'relevance', labelKey: 'sortRelevance' },
  { value: 'newest', labelKey: 'sortNewest' },
  { value: 'price-low', labelKey: 'sortPriceLow' },
  { value: 'price-high', labelKey: 'sortPriceHigh' },
  { value: 'top-rated', labelKey: 'sortTopRated' },
];

export function ProductListingClient() {
  const locale = useLocale();
  const t = useTranslations('Products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useFilterStore();
  const resetFilters = useFilterStore((s) => s.resetFilters);

  useEffect(() => {
    const country = getCountryFromLocale(locale);
    fetchAllProducts(country)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [locale]);

  // The store outlives the page, so a filter left set on a category page would
  // otherwise still be applied on arriving here — with no visible cause.
  useEffect(() => resetFilters, [resetFilters]);

  // Facets come from the whole catalogue, not the filtered result: narrowing
  // them as the shopper selects would make the options they just used vanish.
  const facets = useMemo(() => deriveFacets(products), [products]);
  const visible = useMemo(() => applyFilters(products, filters), [products, filters]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <ProductFilters facets={facets} />
        <div className="flex items-center gap-3">
          {!loading && (
            <p className="text-sm text-slate-600">
              {t('productsFound', { count: visible.length })}
            </p>
          )}
          <select
            className="input w-auto text-sm py-2"
            aria-label={t('sortBy')}
            value={filters.sortBy}
            onChange={(e) => filters.setSortBy(e.target.value as SortOption)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ActiveFilterChips facets={facets} />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <p className="text-lg font-semibold text-slate-700">{t('noResultsTitle')}</p>
          <p className="text-sm text-slate-500">{t('noResultsBody')}</p>
          <button onClick={resetFilters} className="btn-secondary mt-2">
            {t('clearFilters')}
          </button>
        </div>
      ) : (
        <ProductGrid products={visible} />
      )}
    </>
  );
}
