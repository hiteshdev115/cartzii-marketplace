'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { buildPath, getCountryFromLocale } from '@/config/countries';
import { fetchAllProducts } from '@/lib/api/products';
import { ProductSlider } from './ProductSlider';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/types';

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

  const trending = useMemo(() => sortByReviews(products), [products]);

  // Nothing reviewed yet — drop the section rather than leaving a heading over
  // an empty grid, which reads as a broken page rather than an empty one.
  if (!loading && trending.length === 0) return null;

  return (
    <section className="py-8 bg-surface-secondary">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t('trending')}</h2>
            <p className="mt-2 text-slate-500">{t('trendingSubtitle')}</p>
          </div>
          <Link
            href={buildPath('/products')}
            className="inline-flex btn-ghost text-primary font-semibold"
          >
            View All →
          </Link>
        </div>

        <ProductSlider products={trending} loading={loading} label={t('trending')} />
      </div>
    </section>
  );
}
