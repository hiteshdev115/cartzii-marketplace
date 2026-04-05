'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useWishlistStore } from '@/stores/wishlistStore';
import { ProductCard } from '@/components/products/ProductCard';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildCountryPath } from '@/config/countries';
import { EmptyState } from '@/components/ui/EmptyState';
import { Heart } from 'lucide-react';

export function WishlistContent() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const items = useWishlistStore((s) => s.items);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildCountryPath(locale, '/account') },
          { label: t('wishlist') },
        ]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('wishlist')}</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-16 h-16" />}
          title={t('emptyWishlist')}
          message={t('emptyWishlistMessage')}
          actionLabel={t('startShopping')}
          actionHref="/products"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <ProductCard key={item.product.id} product={item.product} />
          ))}
        </div>
      )}
    </main>
  );
}
