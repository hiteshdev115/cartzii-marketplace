'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import {
  DollarSign, ArrowRight, SlidersHorizontal, Star, TrendingUp,
  Sparkles, Package, ChevronDown, X,
} from 'lucide-react';
import { buildCountryPath, getCountryFromLocale, getCountryConfig } from '@/config/countries';
import { fetchAllProducts } from '@/lib/api';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

// ─── Config ──────────────────────────────────────────────────────────────────

const PRICE_THRESHOLD = 5; // Under $5 (in local currency)
const PAGE_SIZE = 24;

type SortKey = 'price_asc' | 'price_desc' | 'rating' | 'newest';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function effectivePrice(p: Product): number {
  return p.salePrice !== undefined ? p.salePrice : p.price;
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-5 bg-slate-200 rounded w-1/3 mt-3" />
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, locale }: { product: Product; locale: string }) {
  const price = effectivePrice(product);
  const hasDiscount = product.salePrice !== undefined && product.salePrice < product.price;
  const imageSrc = product.images?.[0] || '/assets/placeholder-product.png';

  return (
    <Link
      href={buildCountryPath(locale, `/products/${product.slug}`)}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {hasDiscount && product.discount && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{product.discount}%
          </span>
        )}
        {product.isNew && !hasDiscount && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            NEW
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-slate-400 mb-0.5 truncate">{product.brand || product.category}</p>
        <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
          {product.name}
        </p>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-slate-500">
              {product.rating.toFixed(1)}
              {product.reviewCount > 0 && (
                <span className="text-slate-400"> ({product.reviewCount})</span>
              )}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-extrabold text-primary">
            {formatPrice(price, product.currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(product.price, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DollarStreetPageClient() {
  const locale = useLocale();
  const country = getCountryFromLocale(locale);
  const countryConfig = getCountryConfig(locale);
  const currency = countryConfig.currency;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('price_asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const countryCode = country.toUpperCase();
    fetchAllProducts(countryCode)
      .then((data) => {
        const underFive = data.filter((p) => effectivePrice(p) < PRICE_THRESHOLD && p.inStock);
        setAllProducts(underFive);
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, [country]);

  // Category list derived from results
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    allProducts.forEach((p) => {
      if (p.categorySlug && p.category) map.set(p.categorySlug, p.category);
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [allProducts]);

  // Filtered + sorted
  const displayed = useMemo(() => {
    let list = selectedCategory
      ? allProducts.filter((p) => p.categorySlug === selectedCategory)
      : allProducts;

    switch (sort) {
      case 'price_asc': list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b)); break;
      case 'price_desc': list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a)); break;
      case 'rating': list = [...list].sort((a, b) => b.rating - a.rating); break;
      case 'newest': list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return list;
  }, [allProducts, selectedCategory, sort]);

  const paginated = displayed.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < displayed.length;

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
    { key: 'rating', label: 'Top Rated' },
    { key: 'newest', label: 'Newest First' },
  ];

  return (
    <div className="bg-[#F0F2F2] min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Dollar Street' }]} />
      </div>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white mt-4">
        <div className="absolute -top-24 -right-24 w-[450px] h-[450px] rounded-full bg-emerald-500/15 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-teal-400/10 blur-[70px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:28px_28px]" />

        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 flex flex-col md:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-5">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Budget-friendly finds
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4">
              Dollar{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Street
              </span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-6 max-w-lg">
              Quality products for under {currency === 'CAD' ? 'CA$5' : '$5'}.
              Real value, real quality — no compromises. Updated daily.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>
                  {loading ? '...' : `${allProducts.length.toLocaleString()} items`} under {currency === 'CAD' ? 'CA$5' : '$5'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span>Updated daily</span>
              </div>
            </div>
          </div>

          {/* Price badge */}
          <div className="flex-shrink-0">
            <div className="relative w-44 h-44">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full opacity-20 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex flex-col items-center justify-center shadow-2xl shadow-emerald-900/40">
                <span className="text-white/70 text-sm font-medium">All under</span>
                <span className="text-5xl font-black text-white leading-none">$5</span>
                <span className="text-white/70 text-xs mt-1">{currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 md:h-14">
            <path d="M0 60L60 52C120 44 240 28 360 24C480 20 600 28 720 32C840 36 960 36 1080 32C1200 28 1320 20 1380 16L1440 12V60H0Z" fill="#F0F2F2" />
          </svg>
        </div>
      </section>

      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Toolbar ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-slate-500 font-medium">
            {loading ? 'Loading...' : (
              <>
                <span className="font-bold text-slate-800">{displayed.length.toLocaleString()}</span> products
                {selectedCategory && ' in this category'}
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors sm:hidden"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                className="appearance-none pl-4 pr-8 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar (desktop) / Drawer (mobile) ─────────────── */}
          {(categories.length > 0) && (
            <>
              {/* Desktop sidebar */}
              <aside className="hidden sm:block w-52 flex-shrink-0">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 sticky top-24">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Category</h3>
                  <ul className="space-y-0.5">
                    <li>
                      <button
                        onClick={() => { setSelectedCategory(''); setPage(1); }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          !selectedCategory
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        All categories
                      </button>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.slug}>
                        <button
                          onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedCategory === cat.slug
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              {/* Mobile filter drawer */}
              {filtersOpen && (
                <div className="sm:hidden fixed inset-0 z-50 flex">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
                  <div className="relative ml-auto w-72 bg-white h-full shadow-xl flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-bold text-slate-900">Filters</h3>
                      <button onClick={() => setFiltersOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Category</p>
                      <ul className="space-y-0.5">
                        <li>
                          <button
                            onClick={() => { setSelectedCategory(''); setPage(1); setFiltersOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!selectedCategory ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            All categories
                          </button>
                        </li>
                        {categories.map((cat) => (
                          <li key={cat.slug}>
                            <button
                              onClick={() => { setSelectedCategory(cat.slug); setPage(1); setFiltersOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedCategory === cat.slug ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {cat.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Products grid ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
                <div className="w-20 h-20 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
                  <DollarSign className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500 text-sm mb-6">
                  {selectedCategory
                    ? 'No products under $5 in this category.'
                    : 'We couldn\'t find any products under $5 right now. Check back later!'}
                </p>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="inline-flex items-center gap-2 btn-primary"
                  >
                    Clear filter <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {paginated.map((product) => (
                    <ProductCard key={product.id} product={product} locale={locale} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-8 py-3 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all"
                    >
                      Load more <ChevronDown className="w-4 h-4" />
                    </button>
                    <p className="mt-2 text-xs text-slate-400">
                      Showing {paginated.length} of {displayed.length}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Bottom CTA ─────────────────────────────────────────── */}
        {!loading && allProducts.length > 0 && (
          <section className="mt-14 relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl px-8 py-12 text-center text-white shadow-xl">
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-[50px] pointer-events-none" />
            <div className="relative max-w-lg mx-auto">
              <Sparkles className="w-8 h-8 text-yellow-300 mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
                Want more great deals?
              </h2>
              <p className="text-white/80 text-base mb-6">
                Explore thousands more products across all price ranges on Cartziio.
              </p>
              <Link
                href={buildCountryPath(locale, '/deals')}
                className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-white/90 transition-all shadow-lg"
              >
                Explore All Deals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
