'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { fetchRootCategories } from '@/lib/api';
import { Category } from '@/types';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getCategoryIconConfig } from '@/lib/categoryIcons';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';
const CATEGORY_CDN = `${API_BASE}/assets/upload/categoryImages`;

function buildCategoryImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${CATEGORY_CDN}/${url}`;
}

/** Mirrors the tile's real layout, so nothing shifts when the data lands. */
function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center animate-pulse">
      <div className="w-20 h-20 rounded-2xl bg-slate-200" />
      <div className="h-3.5 bg-slate-200 rounded w-16 mt-2.5" />
      <div className="h-3 bg-slate-100 rounded w-10 mt-1.5" />
    </div>
  );
}

export function FeaturedCategories() {
  const t = useTranslations('Home');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRootCategories()
      .then((data) => setCategories(data.slice(0, 8)))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 bg-[#F0F2F2]">
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
            href={buildPath('/categories')}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        {/* More columns than before: eight 80px squares spread across a
            four-column grid would sit marooned in whitespace, which is the
            problem this was meant to remove. */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((cat) => {
                const imgSrc = buildCategoryImageUrl(cat.image);
                const { icon: Icon, gradient } = getCategoryIconConfig(cat.slug, cat.name);
                const subCount = cat.subcategories?.length ?? 0;
                return (
                  <Link
                    key={cat.id}
                    href={buildPath(`/categories/${cat.slug}`)}
                    className="group flex flex-col items-center text-center"
                  >
                    {/* A fixed 80px square, not an aspect-ratio box: the tile
                        has to stay square at every breakpoint, and a box that
                        sizes to its grid column grows into a large rectangle
                        on wide screens. The 56px logo sits inside with even
                        padding on all four sides. */}
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center group-hover:shadow-md group-hover:border-primary/25 transition-all duration-300">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={cat.name}
                          width={56}
                          height={56}
                          sizes="56px"
                          className="w-14 h-14 object-cover rounded-xl group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                          <Icon className="w-7 h-7 text-white drop-shadow" />
                        </div>
                      )}
                    </div>

                    {/* Below the square rather than beside it — anything beside
                        a 56px logo makes the tile a wide rectangle again. */}
                    <p className="mt-2.5 w-full text-xs sm:text-sm font-semibold text-slate-900 leading-snug truncate group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                    <p className="w-full text-[11px] text-slate-400 leading-tight truncate">
                      {subCount > 0
                        ? `${subCount} subcategor${subCount === 1 ? 'y' : 'ies'}`
                        : cat.productCount > 0
                        ? `${cat.productCount.toLocaleString()} products`
                        : 'Explore'}
                    </p>
                  </Link>
                );
              })}
        </div>

        {/* Mobile "View all" */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href={buildPath('/categories')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            View all categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}

