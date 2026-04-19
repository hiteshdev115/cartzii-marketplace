'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import { Product } from '@/types';
import { useHydrated } from '@/hooks/useHydration';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(Number(product.id)));
  const addToCart = useCartStore((s) => s.addItem);
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const openLoginModal = useLoginModalStore((s) => s.open);
  const hydrated = useHydrated();
  const wishlisted = hydrated && isInWishlist;

  const handleWishlistToggle = () => {
    if (!isAuthenticated || !userId) {
      openLoginModal();
      return;
    }
    toggleWishlist(userId, Number(product.id));
  };

  return (
    <article
      className="card-interactive group"
      aria-label={`${product.name} - ${formatPrice(product.salePrice || product.price, locale)}`}
    >
      <Link href={buildCountryPath(locale, `/products/${product.slug}`)}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.images[0]}
            alt={`${product.name} - front view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.onSale && product.discount && (
            <span className="badge-sale absolute top-3 left-3">-{product.discount}%</span>
          )}

        </div>
      </Link>

      <button
        onClick={handleWishlistToggle}
        className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-sm"
        aria-label={`${wishlisted ? 'Remove from' : 'Add to'} wishlist: ${product.name}`}
      >
        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
      </button>

      <div className="p-4">
        <p className="text-xs text-slate-500 mb-1">{product.brand}</p>
        <Link href={buildCountryPath(locale, `/products/${product.slug}`)}>
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <StarRating value={product.rating} size="sm" reviewCount={product.reviewCount} />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.salePrice || product.price, locale)}
          </span>
          {product.onSale && product.salePrice && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.price, locale)}
            </span>
          )}
        </div>
        <button
          onClick={() => addToCart(product)}
          className="mt-3 w-full btn-primary text-xs py-2"
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
