'use client';

import { Gift } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/**
 * The gift-wrap add-on at checkout.
 *
 * Rendered only when the platform has a price set AND the cart contains
 * something it is offered on — the API refuses (and refunds) an order that
 * paid for wrapping it was not eligible for, so offering it speculatively
 * would turn a client bug into a refunded customer.
 */
export function GiftWrapOption({
  priceCents,
  currency,
  selected,
  message,
  onToggle,
  onMessageChange,
}: {
  priceCents: number;
  currency: string;
  selected: boolean;
  message: string;
  onToggle: (value: boolean) => void;
  onMessageChange: (value: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-700 focus:ring-amber-600"
        />
        <span className="flex-1">
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            <Gift className="h-4 w-4 text-amber-700" aria-hidden="true" />
            Gift wrapping
            <span className="ml-auto font-bold text-slate-900">
              {formatPrice(priceCents / 100, currency)}
            </span>
          </span>
          <span className="mt-0.5 block text-sm text-slate-600">
            Wrapped by hand before it ships, with a note if you want one.
          </span>
        </span>
      </label>

      {selected && (
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Gift message <span className="text-slate-400">(optional)</span>
          </span>
          <textarea
            rows={2}
            value={message}
            maxLength={500}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Happy birthday…"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
          <span className="mt-1 block text-xs text-slate-400">
            {message.length}/500
          </span>
        </label>
      )}
    </section>
  );
}
