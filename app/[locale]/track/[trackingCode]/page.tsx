'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { buildCountryPath } from '@/config/countries';
import { getTracking, subscribeToTracking } from '@/lib/shippingApi';
import { StatusBadge } from '@/components/shipping/StatusBadge';
import { TrackingTimeline } from '@/components/shipping/TrackingTimeline';
import { getCarrierDisplay } from '@/lib/shippingConstants';
import { SHIPPING_ERROR_CODES } from '@/lib/shippingConstants';
import type { TrackingData } from '@/lib/shippingApi';

interface Props {
  params: Promise<{ locale: string; trackingCode: string }>;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function TrackingDetailContent({ trackingCode }: { trackingCode: string }) {
  const t = useTranslations('Tracking');
  const locale = useLocale();

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [error, setError] = useState<{ message: string; notFound?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getTracking(trackingCode).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setTracking(result.data);
      } else {
        setError({
          message:
            result.errorCode === SHIPPING_ERROR_CODES.TRACKING_NOT_FOUND
              ? t('notFound')
              : result.message,
          notFound: result.errorCode === SHIPPING_ERROR_CODES.TRACKING_NOT_FOUND,
        });
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [trackingCode, t]);

  // Live updates — the initial fetch above still runs so the page has
  // something to show immediately; this just keeps it fresh afterward
  // without the customer needing to reload.
  useEffect(() => {
    const unsubscribe = subscribeToTracking(trackingCode, (data) => {
      setTracking(data);
      setError(null);
      setLoading(false);
    });
    return unsubscribe;
  }, [trackingCode]);

  const backHref = buildCountryPath(locale, '/track');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-lg font-semibold text-slate-800">
          {error.notFound ? t('notFound') : t('errorTitle')}
        </p>
        <p className="mt-1 text-sm text-slate-500">{error.message}</p>
        <Link
          href={backHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('tryAnotherCode')}
        </Link>
      </div>
    );
  }

  if (!tracking) return null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToLookup')}
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{t('orderNumber')}</p>
            <p className="text-lg font-bold text-slate-900">{tracking.orderNumber}</p>
          </div>
          <StatusBadge status={tracking.currentStatus} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <dt className="text-slate-500">{t('carrier')}</dt>
            <dd className="font-medium text-slate-900">
              {getCarrierDisplay(tracking.carrier)} · {tracking.service}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{t('trackingCode')}</dt>
            <dd className="font-mono text-xs text-slate-800 break-all">{tracking.trackingCode}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t('estDelivery')}</dt>
            <dd className="font-medium text-slate-900">
              {formatDate(tracking.estimatedDeliveryDate)}
            </dd>
          </div>
          {tracking.actualDeliveryDate && (
            <div>
              <dt className="text-slate-500">{t('delivered')}</dt>
              <dd className="font-medium text-emerald-700">
                {formatDate(tracking.actualDeliveryDate)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">{t('trackingHistory')}</h2>
        {tracking.events.length > 0 ? (
          <TrackingTimeline
            events={tracking.events}
            currentStatus={tracking.currentStatus}
          />
        ) : (
          <p className="text-sm text-slate-500">{t('noEventsYet')}</p>
        )}
      </div>
    </div>
  );
}

export default async function TrackingDetailPage({ params }: Props) {
  const { trackingCode } = await params;
  const decoded = decodeURIComponent(trackingCode);

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TrackingDetailContent trackingCode={decoded} />
    </main>
  );
}
