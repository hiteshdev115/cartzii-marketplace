'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { countries, getCountryFromLocale } from '@/config/countries';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const localeLabels: Record<string, string> = {
  'en-US': 'English',
  'en-CA': 'English',
  'fr-CA': 'Français',
};

export function CountrySelector() {
  const locale = useLocale();
  const currentCountry = getCountryFromLocale(locale);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hidden where there is nothing to choose: the United States serves English
  // only. The country itself is the domain now, so this control switches
  // LANGUAGE — going to the other country means going to the other site.
  if (countries[currentCountry].locales.length <= 1) return null;

  const switchTo = (targetLocale: string) => {
    if (targetLocale === locale) {
      setOpen(false);
      return;
    }
    // `pathname` from @/i18n/navigation has no language prefix, and router
    // adds the right one for the target locale — /products becomes
    // /fr/products going into French, and back again coming out. Doing this
    // by hand is how a language switch ends up on the wrong page.
    const query = searchParams.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { locale: targetLocale });
    setOpen(false);
  };

  const currentLangLabel = localeLabels[locale] ?? 'English';
  const countryFlag = currentCountry === 'ca' ? '🇨🇦' : '🇺🇸';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        aria-expanded={open}
        aria-label={`Language: ${currentLangLabel}`}
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{countryFlag} {currentLangLabel}</span>
        <span className="sm:hidden">{countryFlag}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Language
          </p>
          {countries[currentCountry].locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchTo(loc)}
              className={cn(
                'flex items-center justify-between gap-2 w-full px-3 py-2.5 text-sm transition-colors',
                locale === loc ? 'text-primary font-medium bg-primary/5' : 'text-slate-700 hover:bg-gray-50'
              )}
            >
              <span>{localeLabels[loc] ?? loc}</span>
              {locale === loc && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
