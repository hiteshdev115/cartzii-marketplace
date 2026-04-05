'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { buildCountryPath } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

export function CartSummary() {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0)
  );
  const [promoCode, setPromoCode] = useState('');

  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 sticky top-20 md:top-24">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('orderSummary')}</h2>

      {/* Promo code */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('promoPlaceholder')}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="input pl-10 text-sm py-2"
          />
        </div>
        <button className="btn-secondary text-sm px-4">{t('apply')}</button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">{t('subtotal')}</span>
          <span className="font-medium">{formatPrice(subtotal, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t('shipping')}</span>
          <span className="font-medium">{shipping === 0 ? t('free') : formatPrice(shipping, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t('tax')}</span>
          <span className="font-medium">{formatPrice(tax, locale)}</span>
        </div>
        {subtotal < 50 && (
          <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">
            Add {formatPrice(50 - subtotal, locale)} more for free shipping!
          </p>
        )}
        <div className="border-t pt-3 flex justify-between">
          <span className="font-semibold text-slate-900">{t('total')}</span>
          <span className="text-xl font-bold text-primary">{formatPrice(total, locale)}</span>
        </div>
      </div>

      <Link
        href={buildCountryPath(locale, '/checkout')}
        className="mt-6 btn-primary w-full flex items-center justify-center gap-2"
      >
        {t('proceedToCheckout')} <ArrowRight className="w-4 h-4" />
      </Link>

      <Link
        href={buildCountryPath(locale, '/products')}
        className="mt-2 block text-center text-sm text-primary hover:underline"
      >
        {t('continueShopping')}
      </Link>
    </div>
  );
}
