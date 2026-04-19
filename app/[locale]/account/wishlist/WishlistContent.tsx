'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildCountryPath } from '@/config/countries';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/utils';
import { buildWishlistImageUrl } from '@/lib/api/wishlist';
import { useHydrated } from '@/hooks/useHydration';

export function WishlistContent() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useWishlistStore((s) => s.items);
  const loading = useWishlistStore((s) => s.loading);
  const fetchItems = useWishlistStore((s) => s.fetchItems);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (hydrated && !token) {
      router.push(buildCountryPath(locale, '/auth/login'));
    }
  }, [hydrated, token, locale, router]);

  // Fetch wishlist on mount
  useEffect(() => {
    if (hydrated && token && userId) {
      fetchItems(userId);
    }
  }, [hydrated, token, userId, fetchItems]);

  const handleRemove = (productId: number) => {
    if (userId) {
      removeItem(userId, productId);
    }
  };

  if (!hydrated || (!token && !loading)) return null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildCountryPath(locale, '/account') },
          { label: t('wishlist') },
        ]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('wishlist')}</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-16 h-16" />}
          title={t('emptyWishlist')}
          message={t('emptyWishlistMessage')}
          actionLabel={t('startShopping')}
          actionHref="/products"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => {
            const p = item.product;
            const primaryImage = p.images?.find((img) => img.isprimary) || p.images?.[0];
            return (
              <div
                key={item.wishlistid}
                className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <button
                  onClick={() => handleRemove(p.productid)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-red-50 shadow-sm"
                  aria-label={`Remove ${p.productname} from wishlist`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                <Link href={buildCountryPath(locale, `/products/${p.slug}`)}>
                  <div className="aspect-square bg-slate-50 overflow-hidden">
                    <Image
                      src={buildWishlistImageUrl(primaryImage?.imageurl)}
                      alt={primaryImage?.imagealttext || p.productname}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-500 mb-1">{p.category?.categoryname}</p>
                    <h3 className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">
                      {p.productname}
                    </h3>
                    {p.pricing ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-primary">
                          {formatPrice(
                            parseFloat(p.pricing.discountprice || p.pricing.price),
                            locale,
                          )}
                        </span>
                        {p.pricing.discountprice && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatPrice(parseFloat(p.pricing.price), locale)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Price unavailable</span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
