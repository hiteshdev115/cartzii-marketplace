'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Check, Download, ExternalLink, Loader2, Package, XCircle } from 'lucide-react';
import { buildCountryPath } from '@/config/countries';
import { getReturnById, type ReturnRequest } from '@/lib/api/returns';
import { subscribeToOrderUpdates } from '@/lib/api/orders';
import { getReturnStage, type ReturnStageKey } from '@/lib/returnConstants';
import { cn } from '@/lib/utils';

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';
const IMAGE_PLACEHOLDER = 'https://placehold.co/64x64?text=No+Image';

function resolveImageUrl(input?: string | null): string {
  if (!input) return IMAGE_PLACEHOLDER;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  return `${IMAGE_CDN_URL}/${input}`;
}

function formatCurrency(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: (currency || 'USD').toUpperCase() }).format(cents / 100);
}

function formatDate(value: string, locale: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}

const HAPPY_PATH_STAGES: ReturnStageKey[] = ['started', 'dropoff', 'refundInitiated', 'refunded'];

interface Props {
  params: Promise<{ locale: string; returnId: string }>;
}

function ReturnDetailContent({ returnId }: { returnId: number }) {
  const t = useTranslations('Returns');
  const tTracking = useTranslations('Tracking');
  const locale = useLocale();

  const [ret, setRet] = useState<ReturnRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getReturnById(returnId)
      .then((data) => {
        setRet(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnId]);

  // Live updates — a webhook-driven change to this return's order (label
  // scanned, package received, refund issued) pings this return's orderId;
  // silently refetch the full detail rather than trying to patch individual
  // fields from a partial SSE payload.
  useEffect(() => {
    if (!ret?.orderId) return;
    const unsubscribe = subscribeToOrderUpdates((ping) => {
      if (ping.orderId === ret.orderId) load();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ret?.orderId]);

  const backHref = buildCountryPath(locale, '/account/orders');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !ret) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-lg font-semibold text-slate-800">{error}</p>
        <Link
          href={backHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {tTracking('backToOrders')}
        </Link>
      </div>
    );
  }

  const stage = getReturnStage(ret.statusId, ret.shipmentStatus);

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {tTracking('backToOrders')}
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              {t('returnDetailTitle', { id: ret.returnId })}
            </p>
            {ret.orderNumber && (
              <p className="text-sm text-slate-500 mt-0.5">
                {t('orderLabel')}: <span className="font-medium text-slate-700">{ret.orderNumber}</span>
              </p>
            )}
          </div>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', stage.className)}>
            {t(`stage.${stage.key}`)}
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
            <Image
              src={resolveImageUrl(ret.productImageUrl)}
              alt={ret.productName ?? 'Product'}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 line-clamp-2">{ret.productName}</p>
            {ret.reason && <p className="text-xs text-slate-500 mt-0.5">{ret.reason}</p>}
            <p className="text-xs text-slate-400 mt-1">
              {t('requestedOn')} {formatDate(ret.requestedAt, locale)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">{t('refundAmountLabel')}</p>
            <p className="text-sm font-bold text-slate-900">{formatCurrency(ret.refundAmount, ret.currency, locale)}</p>
          </div>
        </div>
      </div>

      {/* Status timeline / rejection notice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {stage.key === 'rejected' ? (
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700">{t('rejectionNoticeTitle')}</p>
              {ret.sellerNote && (
                <p className="text-sm text-slate-600 mt-1">
                  {t('sellerNoteLabel')}: {ret.sellerNote}
                </p>
              )}
            </div>
          </div>
        ) : (
          <ol className="relative space-y-0">
            {HAPPY_PATH_STAGES.map((key, idx) => {
              const isDone = stage.stageIndex > idx + 1 || (stage.stageIndex === idx + 1 && key === 'refunded');
              const isCurrent = stage.stageIndex === idx + 1 && key !== 'refunded';
              const isLast = idx === HAPPY_PATH_STAGES.length - 1;
              return (
                <li key={key} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full border-2',
                        isDone
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                          : isCurrent
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-300 bg-white text-slate-400',
                      )}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                    </span>
                    {!isLast && <span className="mt-1 flex-1 w-0.5 bg-slate-200" />}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={cn('text-sm font-medium', isDone || isCurrent ? 'text-slate-900' : 'text-slate-400')}>
                      {t(`stage.${key}`)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Shipping label — QR code + printable download, whichever the customer prefers */}
      {ret.labelUrl && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{t('shippingLabelTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('shippingLabelHelp')}</p>

          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <QRCodeSVG
                  value={ret.labelUrl}
                  size={148}
                  level="M"
                  marginSize={0}
                  title={t('shippingLabelTitle')}
                />
              </div>
              <p className="max-w-[180px] text-center text-xs text-slate-500">{t('qrHelp')}</p>
            </div>

            <div className="hidden self-stretch w-px bg-slate-200 sm:block" aria-hidden="true" />
            <div className="w-full h-px bg-slate-200 sm:hidden" aria-hidden="true" />

            <div className="flex w-full flex-1 flex-col items-center gap-3 sm:items-start">
              <p className="text-sm text-slate-600 text-center sm:text-left">{t('printHelp')}</p>
              <a
                href={ret.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                {t('downloadLabel')}
              </a>
            </div>
          </div>
        </div>
      )}

      {ret.trackingCode && (
        <Link
          href={`${buildCountryPath(locale, `/track/${encodeURIComponent(ret.trackingCode)}`)}?from=return&returnId=${ret.returnId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {t('trackPackage')}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export default async function ReturnDetailPage({ params }: Props) {
  const { returnId } = await params;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ReturnDetailContent returnId={Number(returnId)} />
    </main>
  );
}
