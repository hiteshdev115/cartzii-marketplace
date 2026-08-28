'use client';

import { X, ShoppingCart, Heart } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import { buildPath } from '@/config/countries';
import { Link } from '@/i18n/navigation';
import { isOutOfStock } from '@/lib/stock';
import { OutOfStockButton } from './OutOfStockButton';
interface QuickViewProps {
  product: Product;
  onClose: () => void;
}

export function QuickView({ product, onClose }: QuickViewProps) {
  const locale = useLocale();
  const t = useTranslations('Products');
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(Number(product.id)));
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const openLoginModal = useLoginModalStore((s) => s.open);

  const handleWishlistToggle = () => {
    if (!isAuthenticated || !userId) {
      openLoginModal();
      return;
    }
    toggleWishlist(userId, Number(product.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto z-10"
        role="dialog"
        aria-labelledby="quick-view-title"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-slate-100"
          aria-label="Close quick view"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{product.brand}</p>
            <h2 id="quick-view-title" className="text-xl font-bold text-slate-900">{product.name}</h2>
            <StarRating value={product.rating} size="sm" showValue />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{formatPrice(product.salePrice || product.price, locale)}</span>
              {product.onSale && product.salePrice && (
                <span className="text-slate-400 line-through">{formatPrice(product.price, locale)}</span>
              )}
            </div>
            <p className="text-sm text-slate-600">{product.shortDescription}</p>
            <div className="flex gap-3 pt-4">
              {isOutOfStock(product) ? (
                <OutOfStockButton className="flex-1 py-2.5 text-sm" />
              ) : (
              <button onClick={() => { addToCart(product, 1, undefined, undefined, locale); onClose(); }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" /> {t('addToCart')}
              </button>
              )}
              <button
                onClick={handleWishlistToggle}
                className="p-3 border rounded-xl hover:bg-slate-50"
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
              </button>
            </div>
            <Link
              href={buildPath(`/products/${product.slug}`)}
              className="block text-center text-sm text-primary font-medium hover:underline"
              onClick={onClose}
            >
              View Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
