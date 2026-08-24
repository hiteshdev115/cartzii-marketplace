'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  getReturnReasons,
  requestReturn,
  previewReturn,
  type ReturnReason,
  type ReturnPreview,
} from '@/lib/api/returns';
import { ApiError } from '@/lib/api/client';
import { RETURN_STATUS } from '@/lib/returnConstants';

/**
 * One line of the order, as the return picker needs to see it.
 *
 * Deliberately a narrow shape rather than the full `OrderItem`: the modal has
 * no business reading prices or seller totals, and keeping it narrow means a
 * change to the order payload cannot quietly change what a return does.
 */
export interface ReturnCandidateItem {
  orderItemId?: number;
  productId: number;
  productName: string;
  imageUrl?: string;
  quantity: number;
  /** Server-computed. Never derive this here. */
  returnEligible?: boolean;
  returnWindowExpiresAt?: string | null;
  existingReturnId?: number | null;
  existingReturnStatusId?: number | null;
  /** Carrier status of the parcel carrying this line, if a label exists. */
  shipmentStatus?: string | null;
}

interface RequestReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Every line on the order — ineligible ones included, so the customer can
   *  see WHY an item they expected to return isn't offered. */
  items: ReturnCandidateItem[];
  orderNumber?: string;
}

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';
const IMAGE_PLACEHOLDER = 'https://placehold.co/48x48?text=No+Image';

function resolveImageUrl(input?: string | null): string {
  if (!input) return IMAGE_PLACEHOLDER;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  return `${IMAGE_CDN_URL}/${input}`;
}

/**
 * Why an item cannot be returned, in the customer's terms.
 *
 * Eligibility itself is never decided here — `returnEligible` comes from the
 * server. This only explains a decision already made, so the two can disagree
 * about wording but never about the outcome.
 */
function ineligibilityKey(item: ReturnCandidateItem): string {
  if (
    item.existingReturnId != null &&
    item.existingReturnStatusId !== RETURN_STATUS.REJECTED
  ) {
    return 'itemAlreadyReturned';
  }
  if (item.shipmentStatus !== 'delivered') return 'itemNotDelivered';
  if (item.returnWindowExpiresAt && new Date(item.returnWindowExpiresAt).getTime() < Date.now()) {
    return 'itemWindowClosed';
  }
  return 'itemNotReturnable';
}

export function RequestReturnModal({
  isOpen,
  onClose,
  onSuccess,
  items,
  orderNumber,
}: RequestReturnModalProps) {
  const t = useTranslations('Returns');

  const [reasons, setReasons] = useState<ReturnReason[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [reasonId, setReasonId] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ReturnPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const eligibleItems = useMemo(
    () => items.filter((i) => i.returnEligible && i.orderItemId != null),
    [items],
  );

  useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false);
    setError('');
    setReasonId('');
    setNote('');
    setPreview(null);
    // Skip the choosing step entirely when there is nothing to choose between.
    setSelectedItemId(eligibleItems.length === 1 ? eligibleItems[0].orderItemId! : null);
    getReturnReasons()
      .then(setReasons)
      .catch(() => setReasons([]));
  }, [isOpen, eligibleItems]);

  // Quote the return as soon as both the item and the reason are known.
  //
  // This is the disclosure step, not a nicety: return shipping is only
  // deducted from a refund if the customer was shown the amount BEFORE they
  // confirmed. If this never resolves, the API charges nothing.
  useEffect(() => {
    if (!isOpen || !reasonId || selectedItemId == null) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    previewReturn({ orderitemid: selectedItemId, returnreasonid: Number(reasonId) })
      .then((p) => { if (!cancelled) setPreview(p); })
      .catch(() => { if (!cancelled) setPreview(null); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, reasonId, selectedItemId]);

  if (!isOpen) return null;

  const money = (cents: number) => {
    const currency = preview?.currency || 'USD';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedItemId == null) {
      setError(t('selectItemError'));
      return;
    }
    if (!reasonId) {
      setError(t('selectReasonError'));
      return;
    }

    setSubmitting(true);
    try {
      await requestReturn({
        orderitemid: selectedItemId,
        returnreasonid: Number(reasonId),
        customerNote: note.trim() || undefined,
      });
      setSubmitted(true);
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError
        ? (err.body as { message?: string } | null)?.message || t('requestError')
        : t('requestError');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-return-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="request-return-title" className="text-lg font-semibold text-slate-900 mb-1">
          {t('requestReturnTitle')}
        </h2>
        {orderNumber && <p className="text-sm text-slate-500 mb-4">{orderNumber}</p>}

        {submitted ? (
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-green-700 font-semibold text-sm">{t('requestSuccess')}</p>
          </div>
        ) : eligibleItems.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl text-center">
            <p className="text-sm text-slate-600">{t('noReturnableItems')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            {/* ── Which item ──────────────────────────────────────────────
                One return covers one item, because one return produces one
                label. Presenting it as a multi-select would imply a single
                parcel and then quietly buy several. */}
            <fieldset>
              <legend className="label mb-2">{t('selectItemLabel')}</legend>
              <div className="space-y-2">
                {items.map((item) => {
                  const selectable = Boolean(item.returnEligible && item.orderItemId != null);
                  const selected = selectable && item.orderItemId === selectedItemId;
                  return (
                    <label
                      key={item.orderItemId ?? item.productId}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : selectable
                            ? 'border-slate-200 hover:bg-slate-50 cursor-pointer'
                            : 'border-slate-100 bg-slate-50 opacity-70 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="radio"
                        name="return-item"
                        className="sr-only"
                        disabled={!selectable}
                        checked={selected}
                        onChange={() => {
                          setSelectedItemId(item.orderItemId!);
                          setPreview(null);
                        }}
                      />
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-white">
                        <Image
                          src={resolveImageUrl(item.imageUrl)}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectable ? `Qty: ${item.quantity}` : t(ineligibilityKey(item))}
                        </p>
                      </div>
                      {selected && <Check className="w-5 h-5 text-primary shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="return-reason" className="label">{t('reasonLabel')}</label>
              <select
                id="return-reason"
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value ? Number(e.target.value) : '')}
                className="input"
                disabled={selectedItemId == null}
                required
              >
                <option value="">{t('selectReasonPlaceholder')}</option>
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>{r.reason}</option>
                ))}
              </select>
            </div>

            {previewLoading && (
              <p className="text-sm text-slate-500">{t('calculatingRefund')}</p>
            )}

            {preview && !previewLoading && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">{t('refundSummaryTitle')}</p>

                <dl className="space-y-1 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <dt>{t('itemPrice')}</dt>
                    <dd>{money(preview.refundItemCents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t('itemTax')}</dt>
                    <dd>{money(preview.refundTaxCents)}</dd>
                  </div>
                  {preview.returnShippingFeeCents > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <dt>{t('returnShipping')}</dt>
                      <dd>-{money(preview.returnShippingFeeCents)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
                    <dt>{t('youWillReceive')}</dt>
                    <dd>{money(preview.refundAmountCents)}</dd>
                  </div>
                </dl>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {preview.returnShippingPaidBy === 'seller'
                    ? t('sellerPaysReturnShipping')
                    : preview.returnShippingFeeCents > 0
                      ? t('buyerPaysReturnShipping')
                      : t('noReturnShippingCharge')}
                  {' '}
                  {t('originalShippingNotRefunded')}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="return-note" className="label">{t('noteLabel')}</label>
              <textarea
                id="return-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="input"
                placeholder={t('notePlaceholder')}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? t('submitting') : t('submitRequest')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
