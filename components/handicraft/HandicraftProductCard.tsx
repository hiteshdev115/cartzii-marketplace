'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { buildPath } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { HandicraftBadges, CraftOrigin } from './HandicraftBadges';
import type { Product } from '@/types';

/**
 * A handicraft tile.
 *
 * Its own component rather than a mode on ProductCard: what a buyer needs to
 * see here is the maker, the origin and the lead time, none of which the
 * regular card has a place for. Price, sale price and stock behave identically,
 * because the underlying product is the same.
 */
export function HandicraftProductCard({ product }: { product: Product }) {
  const handicraft = product.handicraft;
  const image = product.images[0] || '/assets/placeholder-product.png';
  const price = product.salePrice ?? product.price;
  const onSale = product.salePrice !== undefined && product.salePrice < product.price;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow duration-300 hover:shadow-lg">
      <Link
        href={buildPath(`/products/${product.slug}`)}
        className="relative block aspect-square overflow-hidden bg-slate-50"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75">
            <span className="text-sm font-bold uppercase tracking-wide text-slate-700">Sold out</span>
          </div>
        )}
        {onSale && product.discount ? (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
            -{product.discount}%
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        {handicraft && (
          <HandicraftBadges handicraft={handicraft} seller={product.sellerBadges} className="mb-2" />
        )}

        <Link
          href={buildPath(`/products/${product.slug}`)}
          className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-slate-800 transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        {/* The maker's name, not the store's — it is the reason this listing
            is worth more than the machine-made equivalent. */}
        {handicraft?.artisan_name && (
          <p className="mt-1 truncate text-xs font-medium text-slate-600">
            by {handicraft.artisan_name}
          </p>
        )}

        {handicraft && <CraftOrigin handicraft={handicraft} className="mt-0.5 truncate" />}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-slate-900">
            {formatPrice(price, product.currency)}
          </span>
          {onSale && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(product.price, product.currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
