'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, Home, Tag, Sparkles, User, Heart, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { buildCountryPath, getCountryFromLocale, countries } from '@/config/countries';
import { allCategories } from '@/lib/mockData';
import { Category } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function MobileCategoryTree({
  categories,
  locale,
  depth,
  onClose,
}: {
  categories: Category[];
  locale: string;
  depth: number;
  onClose: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul className={cn('space-y-0.5', depth > 0 && 'ml-4 border-l border-gray-100 pl-2')}>
      {categories.map((cat) => {
        const hasChildren = cat.subcategories && cat.subcategories.length > 0;
        const isExpanded = expandedId === cat.id;

        return (
          <li key={cat.id}>
            <div className="flex items-center">
              <Link
                href={buildCountryPath(locale, `/categories/${cat.slug}`)}
                onClick={onClose}
                className="flex-1 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {cat.name}
                {cat.productCount > 0 && (
                  <span className="ml-1.5 text-xs text-slate-400">({cat.productCount})</span>
                )}
              </Link>
              {hasChildren && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${cat.name}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              )}
            </div>
            {hasChildren && isExpanded && (
              <MobileCategoryTree
                categories={cat.subcategories!}
                locale={locale}
                depth={depth + 1}
                onClose={onClose}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

const mobileCountryOptions = [
  { code: 'us', label: 'United States', flag: '🇺🇸' },
  { code: 'ca', label: 'Canada', flag: '🇨🇦' },
];

const mobileLocaleLabels: Record<string, string> = {
  'en-US': 'English',
  'en-CA': 'English',
  'fr-CA': 'Français',
};

function MobileRegionSwitcher({ locale }: { locale: string }) {
  const country = getCountryFromLocale(locale);
  const countryConfig = countries[country];
  const pathname = usePathname();

  const getPagePath = () => {
    const localePrefix = `/${locale}`;
    return pathname.startsWith(localePrefix)
      ? pathname.slice(localePrefix.length) || '/'
      : '/';
  };

  const switchTo = (targetLocale: string) => {
    if (targetLocale === locale) return;
    window.location.assign(buildCountryPath(targetLocale, getPagePath()));
  };

  return (
    <div className="px-4 py-2 mb-2 space-y-3">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" /> Country
        </p>
        <div className="flex gap-2">
          {mobileCountryOptions.map((opt) => (
            <button
              key={opt.code}
              onClick={() => switchTo(countries[opt.code].defaultLocale)}
              className={cn(
                'flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                country === opt.code
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {opt.flag} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {countryConfig.locales.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Language
          </p>
          <div className="flex gap-2">
            {countryConfig.locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchTo(loc)}
                className={cn(
                  'flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  locale === loc
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {mobileLocaleLabels[loc] ?? loc}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Nav');
  const ta = useTranslations('Accessibility');
  const locale = useLocale();

  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const navLinks = [
    { label: t('home'), href: buildCountryPath(locale, '/'), icon: Home },
  ];

  const navLinksAfter = [
    { label: t('deals'), href: buildCountryPath(locale, '/deals'), icon: Sparkles },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        aria-label={ta('openMenu')}
      >
        <Menu className="w-6 h-6" />
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <Image src="/assets/cartzii-logo.png" alt="Cartzii" width={120} height={32} className="object-contain" />
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
                aria-label={ta('closeMenu')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto" role="navigation" aria-label="Mobile navigation">
              <ul className="space-y-1">
                {navLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-slate-400" />
                      {item.label}
                    </Link>
                  </li>
                ))}

                {/* Expandable Categories */}
                <li>
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Tag className="w-5 h-5 text-slate-400" />
                    <span className="flex-1 text-left">{t('products')}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-400 transition-transform',
                        categoriesOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {categoriesOpen && (
                    <div className="mt-1 mb-2">
                      <MobileCategoryTree
                        categories={allCategories}
                        locale={locale}
                        depth={0}
                        onClose={() => setOpen(false)}
                      />
                    </div>
                  )}
                </li>

                {navLinksAfter.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-slate-400" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t p-4 space-y-2">
              <MobileRegionSwitcher locale={locale} />
              <Link
                href={buildCountryPath(locale, '/account/wishlist')}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <Heart className="w-5 h-5 text-slate-400" />
                Wishlist
              </Link>
              <Link
                href={buildCountryPath(locale, '/account')}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <User className="w-5 h-5 text-slate-400" />
                Account
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
