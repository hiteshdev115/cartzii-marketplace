'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCountryFromLocale } from '@/config/countries';
import { fetchAllProducts } from '@/lib/api/products';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ActiveFilterChips } from '@/components/products/ActiveFilterChips';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types';

export function ProductListingClient() {
  const locale = useLocale();
  const t = useTranslations('Products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const country = getCountryFromLocale(locale);
    fetchAllProducts(country)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [locale]);

  return (
    <>
      {/* Filter bar + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <ProductFilters />
        <div className="flex items-center gap-3">
          {!loading && (
            <p className="text-sm text-slate-600">
              {t('productsFound', { count: products.length })}
            </p>
          )}
          <select className="input w-auto text-sm py-2" aria-label={t('sortBy')}>
            <option value="featured">{t('sortFeatured')}</option>
            <option value="newest">{t('sortNewest')}</option>
            <option value="price-asc">{t('sortPriceLow')}</option>
            <option value="price-desc">{t('sortPriceHigh')}</option>
            <option value="rating">{t('sortRating')}</option>
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips />

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </>
  );
}
