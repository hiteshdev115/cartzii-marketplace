'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Heart, Clock, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import { Product } from '@/types';
import { useHydrated } from '@/hooks/useHydration';
import { isOutOfStock } from '@/lib/stock';
import { OutOfStockButton } from './OutOfStockButton';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { useDealActive } from '@/hooks/useDealActive';
import { SPECIAL_DISCOUNT_MIN } from '@/lib/deals';
import { discountPercent } from '@/lib/filters/productFilters';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const outOfStock = isOutOfStock(product);
  const locale = useLocale();
  const t = useTranslations('Home');
  const tProducts = useTranslations('Products');
  // Recomputed when the window closes, so the card swaps itself over live.
  const dealActive = useDealActive(product.deal?.endsAt);
  const specialDiscount = !dealActive && discountPercent(product) >= SPECIAL_DISCOUNT_MIN;
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
      <Link href={buildPath(`/products/${product.slug}`)}>
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
          {product.isFreeDelivery && (
            <span
              className="absolute bottom-3 left-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow"
              aria-label="Free delivery"
            >
              Free Delivery
            </span>
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
        <Link href={buildPath(`/products/${product.slug}`)}>
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
        {/* While a flash deal runs, a countdown. Once its window closes — which
            can happen with the card on screen — the countdown goes and the
            saving is highlighted instead, for as long as it stays worth
            highlighting. The old behaviour left "Expired" sitting on the card,
            which reads as the product being over rather than the promotion. */}
        {dealActive && product.deal ? (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t('endsIn')}</span>
            <CountdownTimer endDate={product.deal.endsAt} compact tone="mono" />
          </div>
        ) : specialDiscount ? (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold text-amber-800">
              {tProducts('specialOffer', { percent: discountPercent(product) })}
            </span>
          </div>
        ) : null}
        {outOfStock ? (
          <OutOfStockButton className="mt-3 text-xs py-2" />
        ) : (
          <button
            onClick={() => addToCart(product, 1, undefined, undefined, locale)}
            className="mt-3 w-full btn-primary text-xs py-2"
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}
