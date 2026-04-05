'use client';

import { useTranslations } from 'next-intl';
import { brandLogos } from '@/lib/mockData';
import Image from 'next/image';

export function BrandShowcase() {
  const t = useTranslations('Home');

  return (
    <section className="py-12 bg-surface-secondary border-y border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-8">
          {t('trustedBrands')}
        </h2>
        <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 flex-wrap opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {brandLogos.map((brand) => (
            <div key={brand.name} className="flex items-center">
              <Image
                src={brand.logo}
                alt={brand.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
