'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import { fetchRootCategories } from '@/lib/api';
import { Category } from '@/types';
import Link from 'next/link';
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

function CategorySkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 mb-4" />
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
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
                const { icon: Icon, gradient } = getCategoryIconConfig(cat.slug, cat.name);
                const subCount = cat.subcategories?.length ?? 0;
                return (
                  <Link
                    key={cat.id}
                    href={buildCountryPath(locale, `/categories/${cat.slug}`)}
                    className="group flex flex-col bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Icon / Image box */}
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden mb-4 flex-shrink-0">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={cat.name}
                          fill
                          sizes="56px"
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                          <Icon className="w-7 h-7 text-white drop-shadow" />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>

                    {/* Meta */}
                    <p className="mt-1 text-xs text-slate-400 leading-tight">
                      {subCount > 0
                        ? `${subCount} subcategor${subCount === 1 ? 'y' : 'ies'}`
                        : cat.productCount > 0
                        ? `${cat.productCount.toLocaleString()} products`
                        : 'Explore →'}
                    </p>

                    {/* Arrow */}
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                      Browse <ArrowRight className="w-3 h-3" />
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

