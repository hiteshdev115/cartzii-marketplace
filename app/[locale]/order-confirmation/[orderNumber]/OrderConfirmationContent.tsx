'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail, Printer, RefreshCw } from 'lucide-react';
import { buildCountryPath } from '@/config/countries';
import { getOrderByNumber } from '@/lib/api/orders';
import type { OrderConfirmation } from '@/types/order';
import { safeCurrencyCode } from '@/lib/utils';

interface OrderConfirmationContentProps {
  orderNumber: string;
}

const PRODUCT_IMAGE_BASE =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/assets/upload/productImages`
    : 'https://staging-api.cartzii.com/assets/upload/productImages';

function resolveImageUrl(filename: string): string {
  if (!filename) return 'https://placehold.co/56x56';
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  return `${PRODUCT_IMAGE_BASE}/${filename}`;
}

/** Items from the order API have prices in cents (e.g. 699 = $6.99). */
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDateOnly(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(date);
}

export function OrderConfirmationContent({ orderNumber }: OrderConfirmationContentProps) {
  const t = useTranslations('Checkout');
  const tCart = useTranslations('Cart');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewAccount = searchParams.get('newAccount') === '1';

  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getOrderByNumber(orderNumber);
      if (!signal?.aborted) {
        setOrder(data);
      }
    } catch {
      if (!signal?.aborted) {
        setError(t('orderLoadError'));
        setOrder(null);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [orderNumber, t]);

  useEffect(() => {
    const controller = new AbortController();
    loadOrder(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadOrder]);

  useEffect(() => {
    document.body.classList.add('order-confirmation-print');
    return () => document.body.classList.remove('order-confirmation-print');
  }, []);

  const handlePrint = () => window.print();

  const handleContinueShopping = () => {
    router.push(buildCountryPath(locale, '/products'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="flex items-center gap-4 animate-pulse">
              <div className="h-14 w-14 rounded-full bg-slate-200" />
              <div className="space-y-3">
                <div className="h-6 w-56 rounded bg-slate-200" />
                <div className="h-4 w-72 rounded bg-slate-100" />
              </div>
            </div>
            <div className="mt-8 space-y-4 animate-pulse">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-4/6 rounded bg-slate-100" />
            </div>
            <div className="mt-8 flex items-center justify-center py-6">
              <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <CheckCircle2 className="h-8 w-8 rotate-180" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">{t('orderConfirmed')}</h1>
            <p className="text-sm text-slate-500">{error ?? t('orderLoadError')}</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button type="button" onClick={() => loadOrder()} className="btn-primary inline-flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('orderLoadRetry')}
            </button>
            <button type="button" onClick={handleContinueShopping} className="btn-secondary inline-flex items-center justify-center">
              {tCart('continueShopping')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-5xl space-y-6 order-confirmation-shell">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-emerald-950">{t('orderConfirmed')}</h1>
          <div className="mt-3 space-y-1 text-sm text-emerald-900/80">
            <p className="font-mono text-base font-semibold text-emerald-950">{order.orderNumber}</p>
            <p>{formatDateTime(order.orderDate, locale)}</p>
            {order.estimatedDelivery && <p>{t('estimatedDelivery')}: {formatDateOnly(order.estimatedDelivery, locale)}</p>}
          </div>
        </section>

        {isNewAccount && (
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 flex items-start gap-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div className="text-sm text-indigo-900">
              <p className="font-semibold">{t('accountCreatedTitle')}</p>
              <p className="mt-0.5 text-indigo-800/80">{t('accountCreatedBody')}</p>
            </div>
          </section>
        )}

        <section className="order-invoice overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('invoice')}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{t('orderConfirmed')}</h2>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
              >
                <Printer className="h-4 w-4" />
                {t('printOrder')}
              </button>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-mono text-base font-semibold text-slate-900">{order.orderNumber}</p>
              <p>{formatDateTime(order.orderDate, locale)}</p>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('billTo')}</p>
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{order.customerName}</p>
                  <p>{order.email}</p>
                  {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                  <p>{order.shippingAddress.street}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('paymentMethod')}</p>
                    <p className="mt-1 font-medium text-slate-900">{order.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('transactionId')}</p>
                    <p className="mt-1 font-mono text-xs text-slate-700">{order.stripePaymentId}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('items')}</p>

              {order.sellerBreakdown && order.sellerBreakdown.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {order.sellerBreakdown.map((seller) => (
                    <div key={seller.sellerId} className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {t('soldBy')}
                          </p>
                          <p className="mt-0.5 font-semibold text-slate-900">
                            {seller.sellerName ?? `Seller #${seller.sellerId}`}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {seller.itemCount} {seller.itemCount === 1 ? tCart('item') : t('items')}
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-white text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <tr>
                              <th className="px-4 py-3">{t('items')}</th>
                              <th className="px-4 py-3">{tCart('quantity')}</th>
                              <th className="px-4 py-3">{t('subtotal')}</th>
                              <th className="px-4 py-3">{tCart('tax')}</th>
                              <th className="px-4 py-3">{t('totalPaid')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(seller.items ?? []).map((item) => {
                              const flat = order.items.find((i) => i.productId === item.productId);
                              const merged = { ...flat, ...item } as typeof item & { imageUrl?: string };
                              return (
                              <tr key={`${seller.sellerId}-${merged.productId}-${merged.productName}`}>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                      <Image src={resolveImageUrl(merged.imageUrl ?? '')} alt={merged.productName} fill className="object-cover" sizes="56px" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-slate-900">{merged.productName}</p>
                                      {merged.variantInfo && <p className="text-xs text-slate-500">{merged.variantInfo}</p>}
                                      <p className="text-xs text-slate-500">{merged.currencyCode}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-700">{merged.quantity}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{formatCurrency(centsToAmount(merged.totalPrice), merged.currencyCode, locale)}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">
                                  {typeof merged.taxAmount === 'number'
                                    ? formatCurrency(centsToAmount(merged.taxAmount), merged.currencyCode, locale)
                                    : '—'}
                                </td>
                                <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                  {typeof merged.finalPrice === 'number'
                                    ? formatCurrency(centsToAmount(merged.finalPrice), merged.currencyCode, locale)
                                    : formatCurrency(centsToAmount(merged.totalPrice), merged.currencyCode, locale)}
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col gap-1 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
                        <span>
                          {t('subtotal')}: <span className="font-medium text-slate-800">{formatCurrency(centsToAmount(seller.subtotal), order.currency, locale)}</span>
                        </span>
                        <span>
                          {tCart('tax')}: <span className="font-medium text-slate-800">{formatCurrency(centsToAmount(seller.taxAmount), order.currency, locale)}</span>
                        </span>
                        <span>
                          {t('totalPaid')}: <span className="font-semibold text-emerald-700">{formatCurrency(centsToAmount(seller.total), order.currency, locale)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">{t('items')}</th>
                        <th className="px-4 py-3">{tCart('quantity')}</th>
                        <th className="px-4 py-3">{t('subtotal')}</th>
                        <th className="px-4 py-3">{t('totalPaid')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {order.items.map((item) => (
                        <tr key={`${item.productId}-${item.productName}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                <Image src={resolveImageUrl(item.imageUrl ?? '')} alt={item.productName} fill className="object-cover" sizes="56px" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900">{item.productName}</p>
                                {item.variantInfo && <p className="text-xs text-slate-500">{item.variantInfo}</p>}
                                {item.sellerName && (
                                  <p className="text-xs text-slate-500">{t('soldBy')}: {item.sellerName}</p>
                                )}
                                <p className="text-xs text-slate-500">{item.currencyCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">{item.quantity}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{formatCurrency(centsToAmount(item.unitPrice), item.currencyCode, locale)}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(centsToAmount(item.totalPrice), item.currencyCode, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ml-auto w-full max-w-md space-y-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t('subtotal')}</span>
                <span>{formatCurrency(order.subtotal, order.currency, locale)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{t('shipping')}</span>
                <span>{order.shippingCost === 0 ? tCart('free') : formatCurrency(order.shippingCost, order.currency, locale)}</span>
              </div>
              {typeof order.taxAmount === 'number' && order.taxAmount > 0 ? (
                <>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>
                      {tCart('tax')}
                      {order.taxBreakdown?.taxName ? ` · ${order.taxBreakdown.taxName}` : ''}
                      {typeof (order.taxBreakdown?.totalRate ?? order.taxRate) === 'number'
                        ? ` (${(((order.taxBreakdown?.totalRate ?? order.taxRate) as number) * 100)
                            .toFixed(2)
                            .replace(/\.?0+$/, '')}%)`
                        : ''}
                    </span>
                    <span>{formatCurrency(order.taxAmount, order.currency, locale)}</span>
                  </div>
                  {order.taxBreakdown?.components && order.taxBreakdown.components.length > 1 && (
                    <ul className="pl-3 text-xs text-slate-500 space-y-0.5">
                      {order.taxBreakdown.components.map((c) => (
                        <li key={c.name} className="flex justify-between">
                          <span>
                            {c.label ?? c.name} ({(c.rate * 100).toFixed(3).replace(/\.?0+$/, '')}%)
                          </span>
                          <span>{formatCurrency(order.subtotal * c.rate, order.currency, locale)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : typeof order.taxAmount === 'number' ? (
                <div className="flex items-center justify-between text-slate-600">
                  <span>{tCart('tax')}</span>
                  <span className="text-emerald-700 font-medium">{t('taxFree')}</span>
                </div>
              ) : null}
              {order.discount > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>{tCart('discount')}</span>
                  <span>-{formatCurrency(order.discount, order.currency, locale)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                <span>{t('totalPaid')}</span>
                <span className="text-emerald-700">{formatCurrency(order.totalAmount, order.currency, locale)}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleContinueShopping}
            className="btn-primary inline-flex items-center justify-center"
          >
            {tCart('continueShopping')}
          </button>
        </div>
      </div>
    </div>
  );
}