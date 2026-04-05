'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import { Category } from '@/types';
import { allCategories } from '@/lib/mockData';
import { cn } from '@/lib/utils';

function SubcategoryPanel({
  categories,
  locale,
  onClose,
}: {
  categories: Category[];
  locale: string;
  onClose: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = categories.find((c) => c.id === activeId);

  return (
    <div className="flex min-h-0">
      <ul className="w-56 border-r border-gray-100 py-2 overflow-y-auto max-h-[60vh]">
        {categories.map((cat) => (
          <li key={cat.id} onMouseEnter={() => setActiveId(cat.id)}>
            <Link
              href={buildCountryPath(locale, `/categories/${cat.slug}`)}
              onClick={onClose}
              className={cn(
                'flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                activeId === cat.id
                  ? 'bg-primary/5 text-primary font-medium'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              <span>{cat.name}</span>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </Link>
          </li>
        ))}
      </ul>

      {active?.subcategories && active.subcategories.length > 0 && (
        <SubcategoryPanel categories={active.subcategories} locale={locale} onClose={onClose} />
      )}
    </div>
  );
}

export function CategoryMenu() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary rounded-lg hover:bg-slate-50 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {t('products')}
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[14rem]">
          <SubcategoryPanel
            categories={allCategories}
            locale={locale}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
