'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, actionHref, onAction }: EmptyStateProps) {
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        {icon || <ShoppingBag className="w-10 h-10 text-slate-400" />}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 max-w-md">{message}</p>
      {actionLabel && (
        actionHref ? (
          <Link href={`/${locale}${actionHref}`} className="btn-primary inline-block">{actionLabel}</Link>
        ) : (
          <Button onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  );
}
