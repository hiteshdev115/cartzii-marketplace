'use client';

import { X, ShoppingBag, ArrowRight, Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { buildCountryPath } from '@/config/countries';
import { formatPrice, cn } from '@/lib/utils';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GuestCheckoutModal } from '@/components/checkout/GuestCheckoutModal';

export function CartDrawer() {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0)
  );
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  return (
    <div
      className={cn('fixed inset-0 z-50', isOpen ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out z-10',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label={t('title')}
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
            <ShoppingBag className="w-4 h-4 text-primary" />
            {t('title')}
            {items.length > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </h2>
          <button
            onClick={closeDrawer}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">{t('emptyTitle')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('emptyMessage')}</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li
                  key={item.cartId ?? `${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-2.5 p-2.5 bg-slate-50 rounded-xl"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-900 truncate leading-snug">
                      {item.product.name}
                    </h3>
                    {item.variantAttributes && item.variantAttributes.length > 0 ? (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {item.variantAttributes.map((a) => `${a.name}: ${a.value}`).join(' · ')}
                      </p>
                    ) : (item.selectedColor || item.selectedSize) ? (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {[
                          item.selectedColor && `Color: ${item.selectedColor}`,
                          item.selectedSize && `Size: ${item.selectedSize}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    ) : null}
                    <p className="text-xs font-bold text-primary mt-1">
                      {formatPrice((item.product.salePrice || item.product.price) * item.quantity, locale)}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <QuantitySelector
                        value={item.quantity}
                        onChange={(q) =>
                          updateQuantity(item.product.id, q, item.selectedColor, item.selectedSize)
                        }
                        max={99}
                      />
                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.selectedColor, item.selectedSize)
                        }
                        className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="border-t border-gray-100 p-3 space-y-2.5 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{t('subtotal')}</span>
              <span className="text-sm font-bold text-slate-900">{formatPrice(subtotal, locale)}</span>
            </div>
            <p className="text-[10px] text-slate-400">{t('shippingNote')}</p>
            <Link
              href={buildCountryPath(locale, '/cart')}
              onClick={closeDrawer}
              className="btn-secondary w-full flex items-center justify-center text-sm py-2"
            >
              {t('viewCart')}
            </Link>
            <button
              onClick={() => {
                if (token) {
                  closeDrawer();
                  router.push(buildCountryPath(locale, '/checkout'));
                } else {
                  setShowCheckoutModal(true);
                }
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              {t('checkout')} <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <GuestCheckoutModal
              isOpen={showCheckoutModal}
              onClose={() => setShowCheckoutModal(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

