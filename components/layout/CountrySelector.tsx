'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { countries, getCountryFromLocale, buildCountryPath } from '@/config/countries';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const countryOptions = [
  { code: 'us', label: 'United States', flag: '🇺🇸' },
  { code: 'ca', label: 'Canada', flag: '🇨🇦' },
];

const localeLabels: Record<string, string> = {
  'en-US': 'English',
  'en-CA': 'English',
  'fr-CA': 'Français',
};

export function CountrySelector() {
  const locale = useLocale();
  const currentCountry = getCountryFromLocale(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPagePath = () => {
    const localePrefix = `/${locale}`;
    return pathname.startsWith(localePrefix)
      ? pathname.slice(localePrefix.length) || '/'
      : '/';
  };

  const switchTo = (targetLocale: string) => {
    if (targetLocale === locale) {
      setOpen(false);
      return;
    }
    window.location.href = buildCountryPath(targetLocale, getPagePath());
  };

  const currentOpt = countryOptions.find((o) => o.code === currentCountry);
  const currentLangLabel = localeLabels[locale] ?? 'English';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        aria-expanded={open}
        aria-label={`Region: ${currentOpt?.label}, Language: ${currentLangLabel}`}
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{currentOpt?.flag} {currentOpt?.code.toUpperCase()} / {currentLangLabel}</span>
        <span className="sm:hidden">{currentOpt?.flag}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[220px] bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {countryOptions.map((opt) => {
            const isActive = currentCountry === opt.code;
            const countryConfig = countries[opt.code];
            const hasMultipleLangs = countryConfig.locales.length > 1;
            const isExpanded = expandedCountry === opt.code;

            return (
              <div key={opt.code}>
                <button
                  onClick={() => {
                    if (hasMultipleLangs) {
                      setExpandedCountry(isExpanded ? null : opt.code);
                    } else {
                      switchTo(countryConfig.defaultLocale);
                    }
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 w-full px-3 py-2.5 text-sm transition-colors',
                    isActive ? 'text-primary font-medium bg-primary/5' : 'text-slate-700 hover:bg-gray-50'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{opt.flag}</span>
                    {opt.label}
                  </span>
                  {hasMultipleLangs ? (
                    <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                  ) : (
                    isActive && <Check className="w-4 h-4 text-primary" aria-hidden="true" />
                  )}
                </button>

                {hasMultipleLangs && isExpanded && (
                  <div className="bg-slate-50 py-1">
                    {countryConfig.locales.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => switchTo(loc)}
                        className="flex items-center justify-between gap-2 w-full px-6 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <span>{localeLabels[loc] ?? loc}</span>
                        {locale === loc && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
