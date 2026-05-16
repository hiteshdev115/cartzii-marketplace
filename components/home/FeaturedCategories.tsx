'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import { fetchRootCategories } from '@/lib/api';
import { Category } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';
const CATEGORY_CDN = `${API_BASE}/assets/upload/categoryImages`;

function buildCategoryImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${CATEGORY_CDN}/${url}`;
}

function CategorySkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-slate-100 animate-pulse aspect-[4/3]" />
  );
}

export function FeaturedCategories() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRootCategories()
      .then((data) => setCategories(data.slice(0, 8)))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">
              {t('featuredCategoriesSubtitle')}
            </p>
            <h2 className="text-3xl font-bold text-slate-900">{t('featuredCategories')}</h2>
          </div>
          <Link
            href={buildCountryPath(locale, '/categories')}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((cat) => {
                const imgSrc = buildCategoryImageUrl(cat.image);
                return (
                  <Link
                    key={cat.id}
                    href={buildCountryPath(locale, `/categories/${cat.slug}`)}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-200 block shadow-sm hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Image */}
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <span className="text-5xl font-black text-primary/30 select-none">
                          {cat.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

                    {/* Category name */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <p className="text-white text-sm sm:text-base font-semibold leading-tight drop-shadow">
                        {cat.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* Mobile "View all" */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href={buildCountryPath(locale, '/categories')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            View all categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}

