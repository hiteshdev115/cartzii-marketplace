'use client';

import { ChevronRight, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { Link } from '@/i18n/navigation';
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const t = useTranslations('Accessibility');

  return (
    <nav aria-label={t('breadcrumbNav')} className="py-3">
      <ol className="flex items-center gap-1.5 text-sm text-slate-600 flex-wrap">
        <li>
          <Link
            href={buildPath('/')}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            {item.href ? (
              <Link href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-900 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
