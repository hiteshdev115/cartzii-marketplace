'use client';

import { useTranslations, useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import { allCategories } from '@/lib/mockData';
import Link from 'next/link';
import Image from 'next/image';

export function FeaturedCategories() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const categories = allCategories.slice(0, 8);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900">{t('featuredCategories')}</h2>
          <p className="mt-2 text-slate-500">{t('featuredCategoriesSubtitle')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildCountryPath(locale, `/categories/${cat.slug}`)}
              className="group card-interactive p-6 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{cat.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{cat.productCount} products</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
