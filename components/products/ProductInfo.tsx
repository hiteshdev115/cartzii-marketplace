'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Heart, ShoppingCart, Truck, RotateCcw, Shield } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydration';

interface ProductInfoProps {
  product: Product;
  onVariantChange?: (images: string[], price: number, salePrice?: number, discount?: number) => void;
}

export function ProductInfo({ product, onVariantChange }: ProductInfoProps) {
  const t = useTranslations('ProductDetail');
  const locale = useLocale();
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(Number(product.id)));
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

  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.value);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]);
  const [quantity, setQuantity] = useState(1);

  const findMatchingVariant = useCallback((color?: string, size?: string) => {
    if (!product.detailVariants?.length) return undefined;
    // Try exact match (color + size)
    let match = product.detailVariants.find(
      (v) => (!color || v.color === color) && (!size || v.size === size),
    );
    // Fallback: match by color only
    if (!match && color) {
      match = product.detailVariants.find((v) => v.color === color);
    }
    return match;
  }, [product.detailVariants]);

  // Notify parent when variant selection changes
  useEffect(() => {
    const variant = findMatchingVariant(selectedColor, selectedSize);
    if (variant && onVariantChange) {
      onVariantChange(variant.images, variant.price, variant.salePrice, variant.discount);
    }
  }, [selectedColor, selectedSize, findMatchingVariant, onVariantChange]);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor, selectedSize);
  };

  return (
    <div className="space-y-6">
      {/* Brand & Badges */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">{product.brand}</span>
        {product.onSale && <Badge variant="sale">SALE</Badge>}
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{product.name}</h1>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <StarRating value={product.rating} size="md" showValue />
        <span className="text-sm text-slate-500">({product.reviewCount} reviews)</span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-primary">
          {formatPrice(product.salePrice || product.price, locale)}
        </span>
        {product.onSale && product.salePrice && (
          <>
            <span className="text-lg text-slate-400 line-through">{formatPrice(product.price, locale)}</span>
            <Badge variant="sale">-{product.discount}%</Badge>
          </>
        )}
      </div>

      {/* Short description */}
      <p className="text-slate-600">{product.shortDescription}</p>

      {/* Color selector */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('selectColor')}</h3>
          <div className="flex gap-2">
            {product.colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={cn(
                  'w-10 h-10 rounded-full border-2 transition-all',
                  selectedColor === color.value ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-400'
                )}
                style={{ backgroundColor: color.hex }}
                aria-label={color.name}
                aria-pressed={selectedColor === color.value}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('selectSize')}</h3>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                  selectedSize === size
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 text-slate-700 hover:border-primary'
                )}
                aria-pressed={selectedSize === size}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity & Add to cart */}
      <div className="flex items-center gap-4">
        <QuantitySelector value={quantity} onChange={setQuantity} max={product.stockCount} />
        <button onClick={handleAddToCart} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          {t('addToCart')}
        </button>
        <button
          onClick={handleWishlistToggle}
          className={cn('p-3 rounded-xl border transition-colors', wishlisted ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-red-200')}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={cn('w-5 h-5', wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400')} />
        </button>
      </div>

      {/* Stock status */}
      <div>
        {product.inStock ? (
          <Badge variant="stock">✓ {product.stockCount} in stock</Badge>
        ) : (
          <span className="text-red-600 text-sm font-semibold">Out of Stock</span>
        )}
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t">
        <div className="flex flex-col items-center text-center gap-1">
          <Truck className="w-5 h-5 text-primary" />
          <span className="text-xs text-slate-600">{t('freeShipping')}</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <RotateCcw className="w-5 h-5 text-primary" />
          <span className="text-xs text-slate-600">{t('easyReturns')}</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-xs text-slate-600">{t('secureCheckout')}</span>
        </div>
      </div>

      {/* SKU */}
      <p className="text-xs text-slate-400">{t('sku')}: {product.sku}</p>
    </div>
  );
}
