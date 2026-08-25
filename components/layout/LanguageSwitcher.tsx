'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { getCountryFromLocale, countries, buildPath, extractPagePath } from '@/config/countries';
import { Globe, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const languageLabels: Record<string, { label: string; flag: string }> = {
  'en-CA': { label: 'English', flag: '🇨🇦' },
  'fr-CA': { label: 'Français', flag: '🇨🇦' },
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Accessibility');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const country = getCountryFromLocale(locale);
  const countryConfig = countries[country];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (countryConfig.locales.length <= 1) return null;

  const switchLocale = (newLocale: string) => {
    // Unreachable today: the guard above returns null while a country has one
    // locale, and fr-CA is not served. Left deliberately incomplete rather
    // than made to look correct — when French returns it needs a URL of its
    // own (a /fr segment, most likely). Pushing the current path would switch
    // the label and nothing else.
    if (newLocale === locale) {
      setOpen(false);
      return;
    }
    router.push(buildPath(extractPagePath(pathname)));
    setOpen(false);
  };

  const currentLang = languageLabels[locale];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        aria-label={t('changeLanguage')}
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{currentLang?.label}</span>
        <span className="sm:hidden text-xs">{locale.split('-')[0].toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 p-1 z-50">
          <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('changeLanguage')}
          </p>
          {countryConfig.locales.map((loc) => {
            const lang = languageLabels[loc];
            if (!lang) return null;
            return (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className="flex items-center justify-between gap-2 w-full px-3 py-2.5 text-sm text-slate-700 hover:bg-gray-100 rounded-lg"
                aria-label={t('switchTo', { language: lang.label })}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{lang.flag}</span>
                  {lang.label}
                </span>
                {locale === loc && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
