'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useEffect, useMemo, useState } from 'react';
import { fetchAllProducts } from '@/lib/api/products';
import { getCountryFromLocale } from '@/config/countries';
import { discountPercent } from '@/lib/filters/productFilters';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Badge } from '@/components/ui/Badge';
import { buildPath } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { Flame, ArrowRight } from 'lucide-react';

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((product) => (
          <Link
            key={product.id}
            href={buildPath(`/products/${product.slug}`)}
            className="group card-interactive overflow-hidden"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="sale">-{discountPercent(product)}%</Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors mb-2">
                {product.name}
              </h3>
              <p className="text-sm text-slate-500 mb-3">{product.shortDescription}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(product.salePrice ?? product.price, locale)}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  {formatPrice(product.price, locale)}
                </span>
              </div>
              {/* A real end time now — the seller's own window, not a
                  fabricated one. */}
              <CountdownTimer endDate={product.deal!.endsAt} />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-500">{t('flashDeal')}</span>
                <span className="text-sm text-primary font-medium flex items-center gap-1">
                  {t('shopNow')} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
    </main>
  );
}
