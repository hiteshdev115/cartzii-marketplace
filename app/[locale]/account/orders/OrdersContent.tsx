'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Package, RefreshCw, Truck } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildPath } from '@/config/countries';
import { fetchMyOrders, subscribeToOrderUpdates } from '@/lib/api/orders';
import { RequestReturnModal } from '@/components/returns/RequestReturnModal';
import { CancelOrderModal } from '@/components/orders/CancelOrderModal';
import {
  getOrderStatusBadge,
  getOrderDeliveryProgress,
  findItemShipment,
} from '@/lib/shippingConstants';
import { StatusBadge } from '@/components/shipping/StatusBadge';
import { getReturnStage } from '@/lib/returnConstants';
import type {
  OrderHistoryPagination,
  OrderHistoryRow,
  OrderItem,
  OrderSellerBreakdown,
  OrderShipmentSummary,
} from '@/types/order';
import { safeCurrencyCode } from '@/lib/utils';

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
    currency: safeCurrencyCode(currency),
  }).format(amount);
}

function formatDateTime(value: string, locale: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

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
  const [returnModalOrder, setReturnModalOrder] = useState<OrderHistoryRow | null>(null);
  const [cancelOrderNumber, setCancelOrderNumber] = useState<string | null>(null);

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

  // Live refresh — when a webhook pings that one of this customer's orders
  // changed, silently re-fetch the current page if that order is visible.
  // Refs (not state) so the SSE subscription — opened once — always sees
  // the latest orders/page without needing to be re-subscribed.
  const ordersRef = useRef<OrderHistoryRow[]>([]);
  const pageRef = useRef(1);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates((ping) => {
      if (ordersRef.current.some((o) => o.orderId === ping.orderId)) {
        void load(pageRef.current);
      }
    });
    return unsubscribe;
  }, [load]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildPath('/account') },
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
              onRequestReturn={setReturnModalOrder}
              onCancelOrder={setCancelOrderNumber}
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

      {/* One modal for the whole order — the customer picks the item inside it,
          rather than the order card sprouting a button per line. */}
      <RequestReturnModal
        isOpen={returnModalOrder != null}
        onClose={() => setReturnModalOrder(null)}
        onSuccess={() => {
          setReturnModalOrder(null);
          void load(page);
        }}
        orderNumber={returnModalOrder?.orderNumber}
        items={(returnModalOrder?.items ?? []).map((item) => ({
          orderItemId: item.orderItemId,
          productId: item.productId,
          productName: item.productName,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          returnEligible: item.returnEligible,
          returnWindowExpiresAt: item.returnWindowExpiresAt,
          existingReturnId: item.existingReturnId,
          existingReturnStatusId: item.existingReturnStatusId,
          shipmentStatus:
            findItemShipment(item, returnModalOrder?.shipments)?.currentStatus ?? null,
        }))}
      />

      <CancelOrderModal
        isOpen={cancelOrderNumber != null}
        onClose={() => setCancelOrderNumber(null)}
        onSuccess={() => {
          setCancelOrderNumber(null);
          void load(page);
        }}
        orderNumber={cancelOrderNumber ?? ''}
      />
    </main>
  );
}

interface OrderCardProps {
  order: OrderHistoryRow;
  locale: string;
  tCart: (key: string) => string;
  tCheckout: (key: string) => string;
  tAccount: (key: string) => string;
  onRequestReturn: (order: OrderHistoryRow) => void;
  onCancelOrder: (orderNumber: string) => void;
}

function OrderCard({ order, locale, tCart, tCheckout, tAccount, onRequestReturn, onCancelOrder }: OrderCardProps) {
  const tReturns = useTranslations('Returns');
  const tOrders = useTranslations('Orders');
  const sellerGroups =
    order.sellerBreakdown && order.sellerBreakdown.length > 0 ? order.sellerBreakdown : null;
  const activeReturnItems = order.items.filter(
    (item) => item.existingReturnId != null,
  );

  // ── One parcel per seller ──────────────────────────────────────────────────
  //
  // A seller can end up with more than one shipment row against the same order
  // (a duplicate label purchase — now blocked server-side, but historical rows
  // remain). Collapsed to one row per seller here, and everything on this card
  // — the badge, the delivered counter, the per-item statuses — is derived
  // from this same list. Deriving the badge from the raw rows and the counter
  // from the deduplicated ones let an order read "Partially Delivered (1/1)".
  //
  // `findItemShipment` picks the LEAST-progressed of a seller's rows, so a
  // stale duplicate can never make a parcel look delivered.
  const trackableShipments = useMemo(() => {
    const withCodes = (order.shipments ?? []).filter((s) => s.trackingCode);
    const sellerIds = [...new Set(withCodes.map((s) => String(s.sellerId ?? s.trackingCode)))];
    return sellerIds
      .map((key) => {
        const rows = withCodes.filter((s) => String(s.sellerId ?? s.trackingCode) === key);
        return findItemShipment({ sellerId: rows[0].sellerId }, rows) ?? rows[0];
      })
      .filter((s): s is OrderShipmentSummary => s != null);
  }, [order.shipments]);

  const statusBadge = getOrderStatusBadge(trackableShipments);
  const deliveryProgress = getOrderDeliveryProgress(trackableShipments);

  // ── When a return may be requested ─────────────────────────────────────────
  //
  // Per ITEM, from the server's own `returnEligible` — which already requires
  // that item's seller's parcel to have a delivery date on it.
  //
  // This used to additionally require the WHOLE order to have arrived. That
  // made sense while the card offered a button per line, but it contradicts
  // showing per-item delivery: an item the customer is looking at, marked
  // Delivered, that they are told they cannot return yet because a different
  // seller's box is still in transit. The server-side rule is the honest one.
  const eligibleReturnItems = order.items.filter(
    (item) => item.returnEligible && item.orderItemId != null,
  );

  // ── When the order is finished ─────────────────────────────────────────────
  //
  // Every line refunded means there is nothing left to track, cancel or return,
  // and the money is already back. Leaving those buttons up invited customers
  // to chase a parcel that had been returned and paid back.
  const refundedItemKeys = new Set(
    order.items
      .filter(
        (item) =>
          item.existingReturnId != null &&
          getReturnStage(item.existingReturnStatusId, item.existingReturnShipmentStatus).key ===
            'refunded',
      )
      .map((item) => String(item.orderItemId ?? item.productId)),
  );
  const orderFullyRefunded =
    order.items.length > 0 &&
    order.items.every((item) => refundedItemKeys.has(String(item.orderItemId ?? item.productId)));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <Link
            href={buildPath(`/order-confirmation/${order.orderNumber}`)}
            className="text-sm font-semibold text-slate-900 hover:underline"
          >
            {order.orderNumber}
          </Link>
          <p className="text-xs text-slate-500">{formatDateTime(order.orderDate, locale)}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          {order.paymentStatus && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
              {order.paymentStatus}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {sellerGroups ? (
          sellerGroups.map((seller) => (
            <SellerBlock
              key={seller.sellerId}
              seller={seller}
              flatItems={order.items}
              shipments={trackableShipments}
              currency={order.currency}
              locale={locale}
              tCart={tCart}
              tCheckout={tCheckout}
            />
          ))
        ) : (
          <div className="p-4 space-y-3">
            {order.items.map((item) => (
              <ItemRow
                key={item.productId}
                item={item}
                shipments={trackableShipments}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <span>
          {order.itemCount} {order.itemCount === 1 ? tCart('item') : tCheckout('items')}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* ── One "Track order" button, always ──────────────────────────
              A multi-seller order ships in several parcels, and one button
              per parcel put two or three identical-looking links side by
              side. The order-level tracking page shows every parcel with the
              items it is carrying, which is the question the customer was
              actually asking. */}
          {!orderFullyRefunded && trackableShipments.length > 0 && order.orderNumber && (
            <Link
              href={buildPath(`/account/orders/${encodeURIComponent(order.orderNumber)}/tracking`,
              )}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Truck className="h-3.5 w-3.5" />
              {tCheckout('trackOrder')}
              {trackableShipments.length > 1 && (
                <span className="opacity-80">
                  ({deliveryProgress.delivered}/{deliveryProgress.total})
                </span>
              )}
            </Link>
          )}
          {!orderFullyRefunded &&
            activeReturnItems.map((item) => {
              const stage = getReturnStage(
                item.existingReturnStatusId,
                item.existingReturnShipmentStatus,
              );
              const label = `${tReturns('returnButtonPrefix')}: ${tReturns(`stage.${stage.key}`)}`;
              return (
                <Link
                  key={`return-${item.existingReturnId}`}
                  href={buildPath(`/account/returns/${item.existingReturnId}`)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${stage.className}`}
                >
                  {activeReturnItems.length > 1 ? `${label} · ${item.productName}` : label}
                </Link>
              );
            })}
          {/* ── One "Request return" button, always ───────────────────────
              Which item is chosen inside the modal, so an order with four
              returnable lines shows one button instead of four. */}
          {eligibleReturnItems.length > 0 && (
            <button
              type="button"
              onClick={() => onRequestReturn(order)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              {tReturns('requestReturn')}
            </button>
          )}
          <Link
            href={buildPath(`/order-confirmation/${order.orderNumber}`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {tAccount('viewDetails')}
          </Link>
          {order.cancelEligible && !orderFullyRefunded && (
            <button
              type="button"
              onClick={() => onCancelOrder(order.orderNumber)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              {tOrders('cancelOrder')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SellerBlockProps {
  seller: OrderSellerBreakdown;
  flatItems: OrderItem[];
  shipments?: OrderShipmentSummary[];
  currency: string;
  locale: string;
  tCart: (key: string) => string;
  tCheckout: (key: string) => string;
}

function SellerBlock({
  seller,
  flatItems,
  shipments,
  currency,
  locale,
  tCart,
  tCheckout,
}: SellerBlockProps) {
  // One parcel per seller, so the status belongs on the seller heading rather
  // than repeated against each of their lines.
  const shipment = findItemShipment({ sellerId: seller.sellerId }, shipments);

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {tCheckout('soldBy')}{' '}
          <span className="ml-1 normal-case tracking-normal text-slate-900">
            {seller.sellerName ?? `Seller #${seller.sellerId}`}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <StatusBadge status={shipment?.currentStatus ?? 'label_created'} />
          <p className="text-xs text-slate-500">
            {seller.itemCount} {seller.itemCount === 1 ? tCart('item') : tCheckout('items')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {(seller.items ?? []).map((item) => {
          const flat = flatItems.find((i) => i.productId === item.productId);
          const merged: OrderItem = { ...flat, ...item };
          return (
            <ItemRow
              key={`${seller.sellerId}-${merged.productId}`}
              item={merged}
              shipments={shipments}
              showStatus={false}
              locale={locale}
            />
          );
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

function ItemRow({
  item,
  shipments,
  showStatus = true,
  locale,
}: {
  item: OrderItem;
  shipments?: OrderShipmentSummary[];
  /** Off inside a SellerBlock, where the badge sits on the seller heading and
   *  repeating it against every one of their lines is just noise. */
  showStatus?: boolean;
  locale: string;
}) {
  const lineTotal = typeof item.finalPrice === 'number' ? item.finalPrice : item.totalPrice;
  const [imgSrc, setImgSrc] = useState(resolveImageUrl(item.imageUrl));
  const shipment = showStatus ? findItemShipment(item, shipments) : null;
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
        {showStatus && (
          <div className="mt-1">
            <StatusBadge status={shipment?.currentStatus ?? 'label_created'} />
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
        {formatCurrency(centsToAmount(lineTotal), item.currencyCode, locale)}
      </p>
    </div>
  );
}

