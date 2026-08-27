'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { buildPath, getCountryFromLocale } from '@/config/countries';
import { fetchAllProducts } from '@/lib/api/products';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/types';

const MAX_TRENDING = 8;

/**
 * Ranks the reviewed products, most-reviewed first.
 *
 * Review count leads and average rating only breaks ties: ranking by average
 * alone would put a single five-star review above fifty four-star ones, which
 * is the opposite of what "trending" should mean.
 */
export function sortByReviews(products: Product[]): Product[] {
  return products
    .filter((p) => p.reviewCount > 0)
    .sort(
      (a, b) =>
        b.reviewCount - a.reviewCount ||
        b.rating - a.rating ||
        a.name.localeCompare(b.name),
    );
}

export function TrendingProducts() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Previously this rendered lib/mockData, so the row showed invented
    // products with invented review counts — nothing in it could reflect what
    // shoppers had actually reviewed.
    fetchAllProducts(getCountryFromLocale(locale))
      .then((all) => {
        if (!cancelled) setProducts(all);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const trending = useMemo(() => sortByReviews(products).slice(0, MAX_TRENDING), [products]);

  // Nothing reviewed yet — drop the section rather than leaving a heading over
  // an empty grid, which reads as a broken page rather than an empty one.
  if (!loading && trending.length === 0) return null;

  return (
    <section className="py-16 bg-surface-secondary">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t('trending')}</h2>
            <p className="mt-2 text-slate-500">{t('trendingSubtitle')}</p>
          </div>
          <Link
            href={buildPath('/products')}
            className="hidden sm:inline-flex btn-ghost text-primary font-semibold"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : trending.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}
