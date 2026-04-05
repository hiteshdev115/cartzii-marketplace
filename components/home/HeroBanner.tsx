'use client';

import { useTranslations, useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import Link from 'next/link';

export function HeroBanner() {
  const t = useTranslations('Home');
  const locale = useLocale();

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-primary-dark overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 relative">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href={buildCountryPath(locale, '/products')} className="btn-primary text-base px-8 py-4 text-center">
              {t('shopNow')}
            </Link>
            <Link href={buildCountryPath(locale, '/deals')} className="btn-outline border-white text-white hover:bg-white hover:text-slate-900 text-base px-8 py-4 text-center">
              {t('exploreDeals')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
