'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { buildPath } from '@/config/countries';
import { getOrderByNumber } from '@/lib/api/orders';
import { getTracking, subscribeToTracking, type TrackingData } from '@/lib/shippingApi';
import { StatusBadge } from '@/components/shipping/StatusBadge';
import { TrackingTimeline } from '@/components/shipping/TrackingTimeline';
import {
  getCarrierDisplay,
  getOrderStatusBadge,
  getOrderDeliveryProgress,
} from '@/lib/shippingConstants';
import type { OrderConfirmation, OrderItem, OrderShipmentSummary } from '@/types/order';

/**
 * Tracking for a whole order, not a single parcel.
 *
 * A Cartzii order can span several sellers, and each seller ships their own
 * box with its own carrier and code. The order list used to answer that with
 * one "Track order" button per parcel — two or three near-identical links with
 * no way to tell which was which. This page is the one destination behind a
 * single button: every parcel, in order, each showing the items it is actually
 * carrying.
 *
 * Per-parcel tracking still lives at /track/[code]; that page is also the
 * public, unauthenticated lookup. This one is account-scoped because it is
 * addressed by order number rather than by a code only the recipient holds.
 */

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';
const IMAGE_PLACEHOLDER = 'https://placehold.co/48x48?text=No+Image';

function resolveImageUrl(input?: string | null): string {
  if (!input) return IMAGE_PLACEHOLDER;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  return `${IMAGE_CDN_URL}/${input}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface Props {
  params: Promise<{ locale: string; orderNumber: string }>;
}

function OrderTrackingContent({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations('Tracking');
  const tCheckout = useTranslations('Checkout');

  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getOrderByNumber(orderNumber)
      .then((data) => { if (!cancelled) { setOrder(data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderNumber]);

  // One shipment per seller. A seller with a duplicate label row on the same
  // order would otherwise appear twice; keyed by seller, so they appear once.
  const shipments = useMemo(() => {
    const bySeller = new Map<string, OrderShipmentSummary>();
    for (const s of order?.shipments ?? []) {
      if (!s.trackingCode) continue;
      bySeller.set(String(s.sellerId ?? s.trackingCode), s);
    }
    return [...bySeller.values()];
  }, [order?.shipments]);

  const progress = getOrderDeliveryProgress(shipments);
  const overallBadge = getOrderStatusBadge(shipments);

  const backHref = buildPath('/account/orders');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-lg font-semibold text-slate-800">{t('errorTitle')}</p>
        {error && <p className="mt-1 text-sm text-slate-500">{error}</p>}
        <Link
          href={backHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToOrders')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToOrders')}
      </Link>

      {/* Order header — the whole-order answer, before the per-parcel detail. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">{t('orderNumber')}</p>
            <p className="text-lg font-bold text-slate-900">{order.orderNumber}</p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${overallBadge.className}`}>
            {overallBadge.label}
          </span>
        </div>
        {progress.total > 1 && (
          <p className="mt-3 text-sm text-slate-600">
            {t('parcelsDelivered', { delivered: progress.delivered, total: progress.total })}
          </p>
        )}
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-sm text-slate-600">{t('noShipmentsYet')}</p>
        </div>
      ) : (
        shipments.map((shipment, index) => (
          <ShipmentPanel
            key={shipment.trackingCode ?? index}
            shipment={shipment}
            index={index}
            total={shipments.length}
            items={itemsForShipment(order, shipment)}
            soldByLabel={tCheckout('soldBy')}
          />
        ))
      )}
    </div>
  );
}

/**
 * The lines travelling in one parcel.
 *
 * Matched by seller, the same rule the shipment itself is keyed on.
 *
 * Read from the FLAT `items[]` rather than `sellerBreakdown[].items`: on this
 * endpoint the breakdown carries a reduced shape with no `imageUrl`, so
 * sourcing from it would render every parcel as a column of placeholders. The
 * breakdown is kept only as a fallback for an item list that somehow has no
 * seller on it.
 */
function itemsForShipment(order: OrderConfirmation, shipment: OrderShipmentSummary): OrderItem[] {
  if (shipment.sellerId == null) return order.items ?? [];

  const mine = (order.items ?? []).filter((item) => item.sellerId === shipment.sellerId);
  if (mine.length > 0) return mine;

  return order.sellerBreakdown?.find((s) => s.sellerId === shipment.sellerId)?.items ?? [];
}

function ShipmentPanel({
  shipment,
  index,
  total,
  items,
  soldByLabel,
}: {
  shipment: OrderShipmentSummary;
  index: number;
  total: number;
  items: OrderItem[];
  soldByLabel: string;
}) {
  const t = useTranslations('Tracking');
  const trackingCode = shipment.trackingCode as string;

  // Seed from the order's own summary so each panel renders immediately with a
  // status and a code; the carrier detail and timeline fill in when they load.
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    getTracking(trackingCode).then((result) => {
      if (result.ok) { setTracking(result.data); setLoadFailed(false); }
      else setLoadFailed(true);
    });
  }, [trackingCode]);

  useEffect(() => { load(); }, [load]);

  // Live updates, per parcel — a page showing three shipments keeps three
  // subscriptions, each closing with its own panel.
  useEffect(() => {
    const unsubscribe = subscribeToTracking(trackingCode, (data) => {
      setTracking(data);
      setLoadFailed(false);
    });
    return unsubscribe;
  }, [trackingCode]);

  const status = tracking?.currentStatus ?? shipment.currentStatus ?? 'label_created';
  const carrier = tracking?.carrier ?? shipment.carrier;
  const estimated = tracking?.estimatedDeliveryDate ?? shipment.estimatedDeliveryDate;
  const actual = tracking?.actualDeliveryDate ?? shipment.actualDeliveryDate;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {total > 1 && (
            <p className="text-xs uppercase tracking-wider text-slate-500">
              {t('parcelOf', { index: index + 1, total })}
            </p>
          )}
          <p className="text-sm font-semibold text-slate-900">
            {soldByLabel} {shipment.sellerName ?? `#${shipment.sellerId}`}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* What is actually in this box — the reason the customer opened the page. */}
      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <Image
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized
                />
              </div>
              <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {item.productName}
                <span className="text-slate-400"> × {item.quantity}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">{t('carrier')}</dt>
          <dd className="font-medium text-slate-900">
            {carrier ? getCarrierDisplay(carrier) : '—'}
            {tracking?.service ? ` · ${tracking.service}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('trackingCode')}</dt>
          <dd className="break-all font-mono text-xs text-slate-800">{trackingCode}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('estDelivery')}</dt>
          <dd className="font-medium text-slate-900">{formatDate(estimated)}</dd>
        </div>
        {actual && (
          <div>
            <dt className="text-slate-500">{t('delivered')}</dt>
            <dd className="font-medium text-emerald-700">{formatDate(actual)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">{t('trackingHistory')}</h2>
        {tracking && tracking.events.length > 0 ? (
          <TrackingTimeline events={tracking.events} currentStatus={tracking.currentStatus} />
        ) : (
          <p className="text-sm text-slate-500">
            {loadFailed ? t('errorTitle') : t('noEventsYet')}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function OrderTrackingPage({ params }: Props) {
  const { orderNumber } = await params;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <OrderTrackingContent orderNumber={decodeURIComponent(orderNumber)} />
    </main>
  );
}
