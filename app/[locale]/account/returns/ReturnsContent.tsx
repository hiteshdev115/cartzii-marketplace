'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Package, RefreshCw, ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildPath } from '@/config/countries';
import { getMyReturns, type ReturnRequest, type ReturnsPagination } from '@/lib/api/returns';
import { getReturnStage } from '@/lib/returnConstants';
import { safeCurrencyCode } from '@/lib/utils';

function formatCurrency(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: safeCurrencyCode(currency) }).format(cents / 100);
}

function formatDate(value: string, locale: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}

const PAGE_SIZE = 20;

export function ReturnsContent() {
  const t = useTranslations('Returns');
  const tAccount = useTranslations('Account');
  const locale = useLocale();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [pagination, setPagination] = useState<ReturnsPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyReturns({ page: targetPage, limit: PAGE_SIZE });
      setReturns(data.returns ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(page);
  }, [page]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: tAccount('dashboard'), href: buildPath('/account') },
          { label: tAccount('returns') },
        ]}
      />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">{tAccount('returns')}</h1>
        <button
          type="button"
          onClick={() => void load(page)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tAccount('refresh')}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && returns.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">{t('noReturns')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => {
            // The same rollup the detail page draws its timeline from. The
            // list used to show the raw RMA status instead, so a return could
            // read "Label Sent" here and "Drop Off" one click away.
            const stage = getReturnStage(ret.statusId, ret.shipmentStatus);
            return (
              <div key={ret.returnId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={buildPath(`/account/returns/${ret.returnId}`)}
                      className="text-sm font-semibold text-slate-900 hover:underline"
                    >
                      {t('returnNumber', { id: ret.returnId })}
                    </Link>
                    <p className="text-xs text-slate-500">{ret.reason}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(ret.requestedAt, locale)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stage.className}`}>
                      {t(`stage.${stage.key}`)}
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {formatCurrency(ret.refundAmount, ret.currency, locale)}
                    </p>
                  </div>
                </div>
                {ret.sellerNote && (
                  <p className="mt-2 text-xs text-slate-500">{t('sellerNoteLabel')}: {ret.sellerNote}</p>
                )}
                {ret.labelUrl && (
                  <a
                    href={ret.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('viewLabel')}
                  </a>
                )}
              </div>
            );
          })}

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
