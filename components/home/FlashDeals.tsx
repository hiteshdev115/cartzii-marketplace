'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { buildPath, getCountryFromLocale } from '@/config/countries';
import { fetchAllProducts } from '@/lib/api/products';
import { discountPercent } from '@/lib/filters/productFilters';
import { SPECIAL_DISCOUNT_MIN, isDealActive } from '@/lib/deals';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/types';

/**
 * Minimum saving to qualify. Re-exported from lib/deals so the section and the
 * card cannot disagree — a product listed here whose own card declined to
 * highlight it would look broken.
 */
export const FLASH_DEAL_MIN_DISCOUNT = SPECIAL_DISCOUNT_MIN;

const MAX_DEALS = 4;

/**
 * The products discounted by at least the threshold, deepest saving first.
 *
 * Measured from the prices rather than from the `discount` column the seller
 * typed. The two disagree in live data — one product stores `discount = 10`
 * while its prices run 139.98 down to 104.98, a real 25% — and it is the
 * struck-through price a shopper compares against, so that is the number this
 * section has to honour.
 */
export function selectFlashDeals(products: Product[]): Product[] {
  return products
    .map((product) => ({ product, percent: discountPercent(product) }))
    .filter(({ percent }) => percent >= FLASH_DEAL_MIN_DISCOUNT)
    // A live flash deal outranks an equally-deep standing markdown: it is the
    // one with a clock on it, and the section is called Flash Deals. Checked
    // against the window rather than the field's presence — a product fetched
    // mid-promotion still carries `deal` after its window has closed.
    .sort(
      (a, b) =>
        Number(isDealActive(b.product)) - Number(isDealActive(a.product)) ||
        b.percent - a.percent ||
        a.product.name.localeCompare(b.product.name),
    )
    .map(({ product }) => product);
}

export function FlashDeals() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Was lib/mockData's `allDeals` — invented products with invented
    // discounts, so nothing here reflected the catalogue's real prices.
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

  const deals = useMemo(() => selectFlashDeals(products).slice(0, MAX_DEALS), [products]);

  // Nothing discounted deeply enough — drop the section rather than leaving a
  // heading over an empty grid.
  if (!loading && deals.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">⚡ {t('flashDeals')}</h2>
            <p className="mt-2 text-slate-500">
              {t('flashDealsMinDiscount', { percent: FLASH_DEAL_MIN_DISCOUNT })}
            </p>
          </div>
          <Link
            href={buildPath('/deals')}
            className="hidden sm:inline-flex btn-ghost text-primary font-semibold"
          >
            View All →
          </Link>
        </div>

        {/* Same grid and same card as every other product listing. The bespoke
            card this replaced had its own image ratio, its own price markup and
            no add-to-cart or wishlist — a deal is a product, not a different
            kind of thing. */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: MAX_DEALS }).map((_, i) => <ProductCardSkeleton key={i} />)
            : deals.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}
