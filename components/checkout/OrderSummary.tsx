'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';

export function OrderSummary() {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-slate-50 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">{t('orderSummary')}</h2>

      <ul className="space-y-3 mb-4">
        {items.map((item) => (
          <li key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-3">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="56px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.product.name}</p>
              <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold">{formatPrice((item.product.salePrice || item.product.price) * item.quantity, locale)}</p>
          </li>
        ))}
      </ul>

      <div className="space-y-2 text-sm border-t pt-4">
        <div className="flex justify-between"><span className="text-slate-600">{t('subtotal')}</span><span>{formatPrice(subtotal, locale)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">{t('shipping')}</span><span>{shipping === 0 ? t('free') : formatPrice(shipping, locale)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">{t('tax')}</span><span>{formatPrice(tax, locale)}</span></div>
        <div className="flex justify-between border-t pt-2 font-semibold text-lg">
          <span>{t('total')}</span>
          <span className="text-primary">{formatPrice(total, locale)}</span>
        </div>
      </div>
    </div>
  );
}
