'use client';

import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/cartStore';
import { buildCountryPath } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { QuantitySelector } from '@/components/ui/QuantitySelector';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-label={t('title')}
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {t('title')} ({items.length})
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Close cart">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-slate-400 mb-4" />
              <p className="text-slate-500 font-medium mb-2">{t('emptyTitle')}</p>
              <p className="text-sm text-slate-400 mb-4">{t('emptyMessage')}</p>
              <Link href={buildCountryPath(locale, '/products')} onClick={onClose} className="btn-primary text-sm">
                {t('continueShopping')}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{item.product.name}</h3>
                    {(item.selectedColor || item.selectedSize) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.selectedColor && `Color: ${item.selectedColor}`}
                        {item.selectedColor && item.selectedSize && ' · '}
                        {item.selectedSize && `Size: ${item.selectedSize}`}
                      </p>
                    )}
                    <p className="text-sm font-bold text-primary mt-1">
                      {formatPrice((item.product.salePrice || item.product.price) * item.quantity, locale)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <QuantitySelector
                        value={item.quantity}
                        onChange={(q) => updateQuantity(item.product.id, q)}
                        max={99}
                      />
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{t('subtotal')}</span>
              <span className="font-bold text-lg">{formatPrice(subtotal, locale)}</span>
            </div>
            <p className="text-xs text-slate-400">{t('shippingNote')}</p>
            <Link
              href={buildCountryPath(locale, '/cart')}
              className="btn-secondary w-full flex items-center justify-center"
              onClick={onClose}
            >
              {t('viewCart')}
            </Link>
            <Link
              href={buildCountryPath(locale, '/checkout')}
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={onClose}
            >
              {t('checkout')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
