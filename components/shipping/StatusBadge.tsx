'use client';

import { cn } from '@/lib/utils';
import {
  STATUS_BADGE_MAP,
  type ShipmentStatus,
} from '@/lib/shippingConstants';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status as ShipmentStatus;
  const config = STATUS_BADGE_MAP[key] ?? {
    label: status.replace(/_/g, ' '),
    className: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
