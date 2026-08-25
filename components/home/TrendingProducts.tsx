'use client';

import { useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { getBestSellers } from '@/lib/mockData';
import { ProductCard } from '@/components/products/ProductCard';
import Link from 'next/link';

export function TrendingProducts() {
  const t = useTranslations('Home');
  const products = getBestSellers().slice(0, 8);

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
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
