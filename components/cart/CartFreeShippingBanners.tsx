'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/cartStore';
import { useThresholdsStore } from '@/stores/thresholdsStore';

export function CartFreeShippingBanners() {
  const cartItems = useCartStore((s) => s.items);
  const { thresholds, fetchThresholds } = useThresholdsStore();
  const t = useTranslations('Cart');

  // Group cart items by sellerId and compute per-seller subtotal in cents.
  // Uses the same unit-price logic as RateSelectorPanel: salePrice ?? price.
  const perSeller = useMemo(() => {
    const map = new Map<
      number,
      { sellerId: number; sellerName?: string; subtotalCents: number }
    >();

    for (const ci of cartItems) {
      const sellerId = Number(ci.product.sellerId);
      if (!Number.isFinite(sellerId) || sellerId < 1) continue;

      const unitPrice = ci.product.salePrice ?? ci.product.price;
      const cents = Math.round(unitPrice * 100) * ci.quantity;

      const existing = map.get(sellerId);
      if (existing) {
        existing.subtotalCents += cents;
      } else {
        map.set(sellerId, {
          sellerId,
          sellerName: ci.product.sellerName ?? undefined,
          subtotalCents: cents,
        });
      }
    }

    return Array.from(map.values());
  }, [cartItems]);

  const sellerIds = useMemo(() => perSeller.map((s) => s.sellerId), [perSeller]);

  useEffect(() => {
    if (sellerIds.length > 0) {
      void fetchThresholds(sellerIds);
    }
  }, [sellerIds, fetchThresholds]);

  type UnlockedBanner = { sellerId: number; kind: 'unlocked'; storeName: string };
  type ProgressBanner = {
    sellerId: number;
    kind: 'progress';
    storeName: string;
    remainingCents: number;
  };

  const banners = perSeller
    .map((seller): UnlockedBanner | ProgressBanner | null => {
      const threshold = thresholds.get(seller.sellerId);
      if (!threshold || threshold.freeShippingThresholdCents === null) return null;

      const thresholdCents = threshold.freeShippingThresholdCents;
      const storeName =
        threshold.storeName || seller.sellerName || `Seller ${seller.sellerId}`;

      if (thresholdCents === 0 || seller.subtotalCents >= thresholdCents) {
        return { sellerId: seller.sellerId, kind: 'unlocked', storeName };
      }

      const remainingCents = thresholdCents - seller.subtotalCents;
      return { sellerId: seller.sellerId, kind: 'progress', storeName, remainingCents };
    })
    .filter((b): b is UnlockedBanner | ProgressBanner => b !== null);

  if (banners.length === 0) return null;

  return (
    <div className="space-y-2 my-4">
      {banners.map((b) =>
        b.kind === 'unlocked' ? (
          <div
            key={b.sellerId}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-50 border border-green-200 text-green-900 text-sm"
            role="status"
          >
            <span aria-hidden="true">🎉</span>
            <span>{t('freeShippingUnlocked', { storeName: b.storeName })}</span>
          </div>
        ) : (
          <div
            key={b.sellerId}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-sm"
            role="status"
          >
            <span aria-hidden="true">⚡</span>
            <span>
              {t('freeShippingProgress', {
                amount: `$${(b.remainingCents / 100).toFixed(2)}`,
                storeName: b.storeName,
              })}
            </span>
          </div>
        ),
      )}
    </div>
  );
}
