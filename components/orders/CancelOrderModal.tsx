'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cancelOrder } from '@/lib/api/orders';
import { ApiError } from '@/lib/api/client';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderNumber: string;
}

export function CancelOrderModal({ isOpen, onClose, onSuccess, orderNumber }: CancelOrderModalProps) {
  const t = useTranslations('Orders');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      await cancelOrder(orderNumber);
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError
        ? (err.body as { message?: string } | null)?.message || t('cancelError')
        : t('cancelError');
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
        aria-labelledby="cancel-order-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="cancel-order-title" className="text-lg font-semibold text-slate-900 mb-1">
          {t('cancelOrderTitle')}
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          {t('cancelOrderConfirm', { orderNumber })}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {t('keepOrder')}
          </button>
          <Button variant="danger" onClick={handleConfirm} disabled={submitting} className="flex-1">
            {submitting ? t('cancelling') : t('confirmCancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
