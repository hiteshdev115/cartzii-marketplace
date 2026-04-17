'use client';

import { useTranslations } from 'next-intl';
import type { ApiAddress } from '@/types';
import { MapPin, Pencil, Trash2, Star, Truck, CreditCard } from 'lucide-react';

interface AddressCardProps {
  address: ApiAddress;
  onEdit: (address: ApiAddress) => void;
  onDelete: (id: number) => void;
  deleting?: boolean;
}

export function AddressCard({ address, onEdit, onDelete, deleting }: AddressCardProps) {
  const t = useTranslations('Account');

  return (
    <div className="p-4 bg-slate-50 rounded-xl relative group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-sm text-slate-900">{address.street}</p>
            <p className="text-sm text-slate-600">
              {address.city}, {address.state} {address.postal_code}
            </p>
            <p className="text-sm text-slate-600">{address.country}</p>

            <div className="flex flex-wrap gap-2 mt-2">
              {address.is_primary && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3" /> {t('primaryAddress')}
                </span>
              )}
              {address.is_shipping && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Truck className="w-3 h-3" /> {t('shippingAddress')}
                </span>
              )}
              {address.is_billing && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  <CreditCard className="w-3 h-3" /> {t('billingAddress')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(address)}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label={t('editAddress')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
            aria-label={t('deleteAddress')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
