'use client';

import { useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/cartStore';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ShoppingBag } from 'lucide-react';

export function CartPageContent() {
  const t = useTranslations('Cart');
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('title') }]} />
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('title')}</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-16 h-16" />}
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          actionLabel={t('continueShopping')}
          actionHref="/products"
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
              <button onClick={clearCart} className="text-sm text-red-500 hover:underline">
                {t('clearCart')}
              </button>
            </div>
            <div className="bg-white rounded-2xl border">
              {items.map((item) => (
                <CartItem key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} item={item} />
              ))}
            </div>
          </div>
          <CartSummary />
        </div>
      )}
    </main>
  );
}
