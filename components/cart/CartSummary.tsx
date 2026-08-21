'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { buildCountryPath } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GuestCheckoutModal } from '@/components/checkout/GuestCheckoutModal';

export function CartSummary() {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0)
  );
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  // Tax is calculated server-side at checkout based on the shipping address.
  const total = subtotal;

  return (
    <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 sticky top-20 md:top-24">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('orderSummary')}</h2>

      {/* Promo code */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all bg-white overflow-hidden">
          <Tag className="shrink-0 ml-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('promoPlaceholder')}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 px-2 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none bg-transparent"
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
          <span className="text-xs text-slate-500">{t('shippingCalculated')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t('tax')}</span>
          <span className="text-xs text-slate-500">{t('shippingCalculated')}</span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="font-semibold text-slate-900">{t('total')}</span>
          <span className="text-xl font-bold text-primary">{formatPrice(total, locale)}</span>
        </div>
      </div>

      {/* Per-seller free-shipping banners — shown when threshold data is available */}

      <button
        onClick={() => {
          if (token) {
            router.push(buildCountryPath(locale, '/checkout'));
          } else {
            setShowCheckoutModal(true);
          }
        }}
        className="mt-6 btn-primary w-full flex items-center justify-center gap-2"
      >
        {t('proceedToCheckout')} <ArrowRight className="w-4 h-4" />
      </button>

      <GuestCheckoutModal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} />

      <Link
        href={buildCountryPath(locale, '/products')}
        className="mt-2 block text-center text-sm text-primary hover:underline"
      >
        {t('continueShopping')}
      </Link>
    </div>
  );
}
