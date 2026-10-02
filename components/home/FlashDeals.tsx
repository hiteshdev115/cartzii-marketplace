'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { buildPath, getCountryFromLocale } from '@/config/countries';
import { fetchAllProducts } from '@/lib/api/products';
import { discountPercent } from '@/lib/filters/productFilters';
import { SPECIAL_DISCOUNT_MIN, isDealActive } from '@/lib/deals';
import { ProductSlider } from './ProductSlider';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/types';

/**
 * Minimum saving to qualify. Re-exported from lib/deals so the section and the
 * card cannot disagree — a product listed here whose own card declined to
 * highlight it would look broken.
 */
export const FLASH_DEAL_MIN_DISCOUNT = SPECIAL_DISCOUNT_MIN;

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

  const deals = useMemo(() => selectFlashDeals(products), [products]);

  // Nothing discounted deeply enough — drop the section rather than leaving a
  // heading over an empty grid.
  if (!loading && deals.length === 0) return null;

  return (
    <section className="py-8 bg-white">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">⚡ {t('flashDeals')}</h2>
            <p className="mt-2 text-slate-500">
              {t('flashDealsMinDiscount', { percent: FLASH_DEAL_MIN_DISCOUNT })}
            </p>
          </div>
          <Link
            href={buildPath('/deals')}
            className="inline-flex btn-ghost text-primary font-semibold"
          >
            View All →
          </Link>
        </div>

        <ProductSlider products={deals} loading={loading} label={t('flashDeals')} />
      </div>
    </section>
  );
}
