'use client';

import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function QuantitySelector({ value, min = 1, max = 99, onChange }: QuantitySelectorProps) {
  const t = useTranslations('Accessibility');

  return (
    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-3 py-2 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={t('decreaseQuantity')}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-3 py-2 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={t('increaseQuantity')}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
