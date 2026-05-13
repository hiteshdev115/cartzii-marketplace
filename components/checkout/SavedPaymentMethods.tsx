'use client';

import { useEffect } from 'react';
import { CreditCard, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaymentStore } from '@/stores/paymentStore';

// ---- Props ----------------------------------------------------------------

interface SavedPaymentMethodsProps {
  onSelect: (paymentMethodId: string) => void;
  selectedId: string | null;
}

// ---- Skeleton row ---------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="rounded-lg border p-4 flex items-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="w-6 h-6 rounded bg-gray-200 shrink-0" />
    </div>
  );
}

// ---- Component ------------------------------------------------------------

export function SavedPaymentMethods({ onSelect, selectedId }: SavedPaymentMethodsProps) {
  const { savedMethods, isLoading, fetchSavedMethods, removeSavedMethod } =
    usePaymentStore();

  useEffect(() => {
    fetchSavedMethods();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (savedMethods.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No saved payment methods
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {savedMethods.map((method) => {
        const isSelected = selectedId === method.id;
        const brand = method.card?.brand
          ? method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)
          : method.type.charAt(0).toUpperCase() + method.type.slice(1);

        return (
          <div
            key={method.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(method.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(method.id)}
            className={cn(
              'rounded-lg border p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors',
              isSelected ? 'border-2 border-blue-500' : 'border border-gray-200',
            )}
          >
            {/* Card icon */}
            <CreditCard
              className={cn(
                'w-6 h-6 shrink-0',
                isSelected ? 'text-blue-500' : 'text-gray-400',
              )}
            />

            {/* Card details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {brand} &bull;&bull;&bull;&bull; {method.card?.last4 ?? '••••'}
              </p>
              {method.card && (
                <p className="text-xs text-gray-500">
                  Expires {method.card.exp_month}/{method.card.exp_year}
                </p>
              )}
            </div>

            {/* Delete button */}
            <button
              type="button"
              aria-label={`Remove ${brand} ending ${method.card?.last4}`}
              onClick={(e) => {
                e.stopPropagation();
                removeSavedMethod(method.id);
              }}
              className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
