'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { CartItem as CartItemType } from '@/types';
import { formatPrice } from '@/lib/utils';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useCartStore } from '@/stores/cartStore';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const locale = useLocale();
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const unitPrice = item.product.salePrice || item.product.price;

  return (
    <div className="flex gap-4 p-4 border-b border-gray-100">
      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shrink-0">
        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="128px" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900">{item.product.name}</h3>
        <p className="text-sm text-slate-500">{item.product.brand}</p>
        {item.variantAttributes && item.variantAttributes.length > 0 ? (
          <p className="text-xs text-slate-500 mt-1">
            {item.variantAttributes.map((a) => `${a.name}: ${a.value}`).join(' · ')}
          </p>
        ) : (item.selectedColor || item.selectedSize) ? (
          <p className="text-xs text-slate-500 mt-1">
            {item.selectedColor && `Color: ${item.selectedColor}`}
            {item.selectedColor && item.selectedSize && ' · '}
            {item.selectedSize && `Size: ${item.selectedSize}`}
          </p>
        ) : null}
        <div className="flex items-center justify-between mt-3">
          <QuantitySelector value={item.quantity} onChange={(q) => updateQuantity(item.product.id, q, item.selectedColor, item.selectedSize)} max={99} />
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{formatPrice(unitPrice * item.quantity, locale)}</p>
            {item.quantity > 1 && (
              <p className="text-xs text-slate-500">{formatPrice(unitPrice, locale)} each</p>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => removeItem(item.product.id, item.selectedColor, item.selectedSize)}
        className="self-start p-2 text-slate-400 hover:text-red-500 transition-colors"
        aria-label={`Remove ${item.product.name}`}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
