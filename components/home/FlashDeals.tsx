'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { buildPath, getCountryFromLocale } from '@/config/countries';
import { fetchAllProducts } from '@/lib/api/products';
import { discountPercent } from '@/lib/filters/productFilters';
import { PriceTag } from '@/components/ui/PriceTag';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Badge } from '@/components/ui/Badge';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/types';

/** Minimum saving to qualify as a flash deal. */
export const FLASH_DEAL_MIN_DISCOUNT = 20;

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
    // one with a clock on it, and the section is called Flash Deals.
    .sort(
      (a, b) =>
        Number(!!b.product.deal) - Number(!!a.product.deal) ||
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: MAX_DEALS }).map((_, i) => <ProductCardSkeleton key={i} />)
            : deals.map((product) => (
                <Link
                  key={product.id}
                  href={buildPath(`/products/${product.slug}`)}
                  className="card-interactive group"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* The saving the prices below actually show. Using the
                        stored percentage would badge one product -10% inside a
                        section that promises 20% or more. */}
                    <Badge variant="sale" className="absolute top-3 left-3">
                      -{discountPercent(product)}%
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <PriceTag price={product.price} salePrice={product.salePrice} size="sm" />
                    {/* Only for products actually on a timed deal. The section
                        also carries deeply-discounted products with no window,
                        and a countdown on those would be inventing an end time
                        that does not exist. */}
                    {product.deal && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-1">{t('endsIn')}</p>
                        <CountdownTimer endDate={product.deal.endsAt} compact />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
