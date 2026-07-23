'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getReturnReasons, requestReturn, type ReturnReason } from '@/lib/api/returns';
import { ApiError } from '@/lib/api/client';

interface RequestReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderItemId: number;
  productName: string;
}

export function RequestReturnModal({ isOpen, onClose, onSuccess, orderItemId, productName }: RequestReturnModalProps) {
  const t = useTranslations('Returns');

  const [reasons, setReasons] = useState<ReturnReason[]>([]);
  const [reasonId, setReasonId] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false);
    setError('');
    setReasonId('');
    setNote('');
    getReturnReasons()
      .then(setReasons)
      .catch(() => setReasons([]));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reasonId) {
      setError(t('selectReasonError'));
      return;
    }

    setSubmitting(true);
    try {
      await requestReturn({
        orderitemid: orderItemId,
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10"
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
        <p className="text-sm text-slate-500 mb-4 line-clamp-1">{productName}</p>

        {submitted ? (
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-green-700 font-semibold text-sm">{t('requestSuccess')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <label htmlFor="return-reason" className="label">{t('reasonLabel')}</label>
              <select
                id="return-reason"
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value ? Number(e.target.value) : '')}
                className="input"
                required
              >
                <option value="">{t('selectReasonPlaceholder')}</option>
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>{r.reason}</option>
                ))}
              </select>
            </div>

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
