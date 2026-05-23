'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Package, RefreshCw } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildCountryPath } from '@/config/countries';
import { fetchMyOrders } from '@/lib/api/orders';
import type {
  OrderHistoryPagination,
  OrderHistoryRow,
  OrderItem,
  OrderSellerBreakdown,
} from '@/types/order';

// Match the products / cart image-resolution conventions, with safe fallbacks:
//   - bare filenames (e.g. "1774217621199-ubuji.jpg")  →  prefixed with the CDN base
//   - full http(s) URLs (e.g. R2 CDN)                  →  passed through untouched
//   - missing/empty values                             →  remote placeholder
const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

const IMAGE_PLACEHOLDER = 'https://placehold.co/64x64?text=No+Image';

function resolveImageUrl(input?: string | null): string {
  if (!input) return IMAGE_PLACEHOLDER;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  return `${IMAGE_CDN_URL}/${input}`;
}

function centsToAmount(cents: number): number {
  return cents / 100;
}

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: (currency || 'USD').toUpperCase(),
  }).format(amount);
}

function formatDateTime(value: string, locale: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

const ORDER_STATUS_KEY: Record<number, string> = {
  1: 'pending',
  2: 'processing',
  3: 'shipped',
  4: 'delivered',
  5: 'cancelled',
  6: 'returned',
};

const PAGE_SIZE = 20;

export function OrdersContent() {
  const t = useTranslations('Account');
  const tCheckout = useTranslations('Checkout');
  const tCart = useTranslations('Cart');
  const locale = useLocale();

  const [orders, setOrders] = useState<OrderHistoryRow[]>([]);
  const [pagination, setPagination] = useState<OrderHistoryPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyOrders({ page: targetPage, limit: PAGE_SIZE });
      setOrders(data.orders ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildCountryPath(locale, '/account') },
          { label: t('orders') },
        ]}
      />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">{t('orders')}</h1>
        <button
          type="button"
          onClick={() => void load(page)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">{t('noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              locale={locale}
              tCart={tCart}
              tCheckout={tCheckout}
              tAccount={t}
            />
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                ←
              </button>
              <span className="text-sm text-slate-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || loading}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

interface OrderCardProps {
  order: OrderHistoryRow;
  locale: string;
  tCart: (key: string) => string;
  tCheckout: (key: string) => string;
  tAccount: (key: string) => string;
}

function OrderCard({ order, locale, tCart, tCheckout, tAccount }: OrderCardProps) {
  const statusKey = order.orderStatusId ? ORDER_STATUS_KEY[order.orderStatusId] : undefined;
  const statusLabel = statusKey ? tAccount(`orderStatus.${statusKey}`) : undefined;
  const sellerGroups =
    order.sellerBreakdown && order.sellerBreakdown.length > 0 ? order.sellerBreakdown : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <Link
            href={buildCountryPath(locale, `/order-confirmation/${order.orderNumber}`)}
            className="text-sm font-semibold text-slate-900 hover:underline"
          >
            {order.orderNumber}
          </Link>
          <p className="text-xs text-slate-500">{formatDateTime(order.orderDate, locale)}</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-slate-900">
            {formatCurrency(centsToAmount(order.totalAmount), order.currency, locale)}
          </p>
          <div className="mt-1 flex items-center justify-end gap-2 text-xs">
            {statusLabel && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                {statusLabel}
              </span>
            )}
            {order.paymentStatus && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                {order.paymentStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {sellerGroups ? (
          sellerGroups.map((seller) => (
            <SellerBlock
              key={seller.sellerId}
              seller={seller}
              flatItems={order.items}
              currency={order.currency}
              locale={locale}
              tCart={tCart}
              tCheckout={tCheckout}
            />
          ))
        ) : (
          <div className="p-4 space-y-3">
            {order.items.map((item) => (
              <ItemRow key={item.productId} item={item} locale={locale} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <span>
          {order.itemCount} {order.itemCount === 1 ? tCart('item') : tCheckout('items')}
        </span>
        <Link
          href={buildCountryPath(locale, `/order-confirmation/${order.orderNumber}`)}
          className="font-medium text-blue-600 hover:underline"
        >
          {tAccount('viewDetails')}
        </Link>
      </div>
    </div>
  );
}

interface SellerBlockProps {
  seller: OrderSellerBreakdown;
  flatItems: OrderItem[];
  currency: string;
  locale: string;
  tCart: (key: string) => string;
  tCheckout: (key: string) => string;
}

function SellerBlock({ seller, flatItems, currency, locale, tCart, tCheckout }: SellerBlockProps) {
  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {tCheckout('soldBy')}{' '}
          <span className="ml-1 normal-case tracking-normal text-slate-900">
            {seller.sellerName ?? `Seller #${seller.sellerId}`}
          </span>
        </p>
        <p className="text-xs text-slate-500">
          {seller.itemCount} {seller.itemCount === 1 ? tCart('item') : tCheckout('items')}
        </p>
      </div>

      <div className="space-y-3">
        {(seller.items ?? []).map((item) => {
          const flat = flatItems.find((i) => i.productId === item.productId);
          const merged: OrderItem = { ...flat, ...item };
          return <ItemRow key={`${seller.sellerId}-${merged.productId}`} item={merged} locale={locale} />;
        })}
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-x-6 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
        <span>
          {tCheckout('subtotal')}:{' '}
          <span className="font-medium text-slate-800">
            {formatCurrency(centsToAmount(seller.subtotal), currency, locale)}
          </span>
        </span>
        <span>
          {tCart('tax')}:{' '}
          <span className="font-medium text-slate-800">
            {formatCurrency(centsToAmount(seller.taxAmount), currency, locale)}
          </span>
        </span>
        <span>
          {tCheckout('totalPaid')}:{' '}
          <span className="font-semibold text-emerald-700">
            {formatCurrency(centsToAmount(seller.total), currency, locale)}
          </span>
        </span>
      </div>
    </div>
  );
}

function ItemRow({ item, locale }: { item: OrderItem; locale: string }) {
  const lineTotal = typeof item.finalPrice === 'number' ? item.finalPrice : item.totalPrice;
  const [imgSrc, setImgSrc] = useState(resolveImageUrl(item.imageUrl));
  return (
    <div className="flex gap-3">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
        <Image
          src={imgSrc}
          alt={item.productName}
          fill
          className="object-cover"
          sizes="64px"
          unoptimized
          onError={() => setImgSrc(IMAGE_PLACEHOLDER)}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 line-clamp-2">{item.productName}</p>
        <p className="text-xs text-slate-500">
          Qty: {item.quantity}
          {item.variantInfo ? ` · ${item.variantInfo}` : ''}
        </p>
      </div>
      <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
        {formatCurrency(centsToAmount(lineTotal), item.currencyCode, locale)}
      </p>
    </div>
  );
}

