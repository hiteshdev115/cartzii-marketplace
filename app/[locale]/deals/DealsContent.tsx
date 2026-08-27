'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useEffect, useMemo, useState } from 'react';
import { fetchAllProducts } from '@/lib/api/products';
import { getCountryFromLocale } from '@/config/countries';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildPath } from '@/config/countries';
import { Flame } from 'lucide-react';

export function DealsContent() {
  const t = useTranslations('Deals');
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Was lib/mockData's `allDeals` — invented products with invented
    // countdowns. Deals are real now: the API discounts the price row while a
    // seller's window is open and attaches the window to it.
    fetchAllProducts(getCountryFromLocale(locale))
      .then((all) => { if (!cancelled) setProducts(all); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [locale]);

  // Only products actually on a flash deal — a `deal` is attached solely while
  // its window is open, so this needs no date arithmetic of its own.
  const deals = useMemo(
    () =>
      products
        .filter((p) => !!p.deal)
        .sort((a, b) => (b.deal!.discountPercent - a.deal!.discountPercent)),
    [products],
  );

  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('title') }]} />

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-primary mb-2">
          <Flame className="w-6 h-6" />
          <span className="font-semibold uppercase tracking-wider text-sm">{t('hotDeals')}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{t('title')}</h1>
        <p className="text-slate-600">{t('subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <p className="text-lg font-semibold text-slate-700">{t('noDealsTitle')}</p>
          <p className="text-sm text-slate-500">{t('noDealsBody')}</p>
          <Link href={buildPath('/products')} className="btn-secondary mt-2">
            {t('browseAll')}
          </Link>
        </div>
      ) : (
      // The same card and grid as /products. The bespoke deal card this
      // replaced used a 4:3 image, its own price markup and had neither
      // add-to-cart nor wishlist — so a shopper browsing deals could not do
      // the one thing the page exists for.
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {deals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      )}
    </main>
  );
}
