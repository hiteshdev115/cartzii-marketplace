'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/cartStore';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ShoppingBag, Loader2 } from 'lucide-react';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function CartPageContent() {
  const t = useTranslations('Cart');
  const items = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const clearCart = useCartStore((s) => s.clearCart);

  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    const token = getCookie('cartzii_access_token');

    const userId = (() => {
      const fromCookie = getCookie('cartzii_userid');
      if (fromCookie) return fromCookie;
      try {
        const raw = localStorage.getItem('cartzii_userid');
        if (raw) return raw;
        const auth = localStorage.getItem('cartzii-auth');
        if (!auth) return null;
        return (JSON.parse(auth) as { state?: { userId?: string } })?.state?.userId ?? null;
      } catch {
        return null;
      }
    })();

    if (!token || !userId) return;

    useCartStore.getState().loadCart(userId).catch(() => {
      // silently fall back to existing local cart
    });
  }, []);

  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('title') }]} />
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('title')}</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : items.length === 0 ? (
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
              <p className="text-sm text-slate-600">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
              <button onClick={() => clearCart()} className="text-sm text-red-500 hover:underline">
                {t('clearCart')}
              </button>
            </div>
            <div className="bg-white rounded-2xl border">
              {items.map((item) => (
                <CartItem key={item.cartId ?? `${item.product.id}-${item.selectedColor}-${item.selectedSize}`} item={item} />
              ))}
            </div>
          </div>
          <CartSummary />
        </div>
      )}
    </main>
  );
}
