'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Link } from '@/i18n/navigation';
import { buildPath, currentCountry, getCountryConfig } from '@/config/countries';
import { useLocale } from 'next-intl';
import { ArrowRight, PackageOpen, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { HandicraftProductCard } from '@/components/handicraft/HandicraftProductCard';
import { HandicraftFilterSidebar } from '@/components/handicraft/HandicraftFilterSidebar';
import {
  fetchHandicraftProducts, fetchHandicraftFacets, fetchHandicraftFeatured,
  type HandicraftFacets, type HandicraftFilters,
} from '@/lib/api/handicraft';
import type { Product } from '@/types';

const PAGE_SIZE = 24;

const EMPTY_FACETS: HandicraftFacets = { countries: [], techniques: [], materials: [], categories: [] };

/**
 * The handicraft storefront.
 *
 * Every product, filter option and count comes from the API. This page used to
 * render eight hard-coded "craft types" and a filtered slice of the general
 * catalogue, which meant it advertised categories nobody had listed anything
 * under and could not tell a handmade item from a mass-produced one.
 */
export function HandicraftPageClient() {
  const locale = useLocale();
  const currency = getCountryConfig(locale).currency;
  const country = currentCountry.toUpperCase();

  const [featured, setFeatured] = useState<Product[]>([]);
  const [facets, setFacets] = useState<HandicraftFacets>(EMPTY_FACETS);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<HandicraftFilters>({});
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Featured strip and filter vocabularies: fetched once. Both write state
  // from the promise callback rather than synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchHandicraftFeatured(country, 8),
      fetchHandicraftFacets(),
    ]).then(([featuredItems, facetData]) => {
      if (cancelled) return;
      setFeatured(featuredItems);
      setFacets(facetData);
    });
    return () => { cancelled = true; };
  }, [country]);

  // The grid, refetched whenever a filter changes. Serialised so the effect
  // depends on a stable value rather than a new object every render.
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    fetchHandicraftProducts(country, JSON.parse(filterKey), { limit: PAGE_SIZE, offset: 0 })
      .then((page) => {
        if (cancelled) return;
        setProducts(page.products);
        setTotal(page.total);
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [country, filterKey]);

  const loadMore = () => {
    startTransition(async () => {
      const page = await fetchHandicraftProducts(country, filters, {
        limit: PAGE_SIZE,
        offset: products.length,
      });
      setProducts((current) => [...current, ...page.products]);
      setTotal(page.total);
    });
  };

  const sidebar = (
    <HandicraftFilterSidebar
      facets={facets}
      filters={filters}
      currency={currency}
      onChange={(next) => { setFilters(next); setDrawerOpen(false); }}
      onClear={() => { setFilters({}); setDrawerOpen(false); }}
    />
  );

  return (
    <div className="min-h-screen bg-[#F0F2F2]">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Handicraft' }]} />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative mt-4 overflow-hidden bg-gradient-to-br from-[#3b2417] via-[#5a3620] to-[#8a4b23] text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-amber-500/20 blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:26px_26px]" />

        <div className="relative mx-auto max-w-[var(--container-max)] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
            Made by hand, not by machine
          </div>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
            Handicraft
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
            Work from artisans around the world — each piece carrying the technique, the
            materials and the hands that made it.
          </p>

          {loaded && total > 0 && (
            <p className="mt-6 text-sm text-white/70">
              {total.toLocaleString()} piece{total === 1 ? '' : 's'} from{' '}
              {facets.countries.length} {facets.countries.length === 1 ? 'country' : 'countries'}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-max)] space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Featured collections ─────────────────────────────── */}
        {featured.length > 0 && (
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
                  Curated
                </p>
                <h2 className="text-2xl font-extrabold text-slate-900">Featured pieces</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <HandicraftProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── Catalogue ────────────────────────────────────────── */}
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-slate-900">All handicraft</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filters
            </button>
          </div>

          <div className="flex gap-6">
            <div className="hidden w-64 flex-shrink-0 lg:block">
              <div className="sticky top-24">{sidebar}</div>
            </div>

            <div className="min-w-0 flex-1">
              {!loaded ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white">
                      <div className="aspect-square bg-slate-200" />
                      <div className="space-y-2 p-3">
                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-white px-6 py-20 text-center">
                  <PackageOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-slate-900">Nothing matches those filters</h3>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Try widening the price range or clearing a filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilters({})}
                    className="btn-primary mt-6 inline-flex items-center gap-2"
                  >
                    Clear filters <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm text-slate-500">
                    <span className="font-bold text-slate-800">{total.toLocaleString()}</span> pieces
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => (
                      <HandicraftProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {products.length < total && (
                    <div className="mt-8 text-center">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={pending}
                        className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-60"
                      >
                        {pending ? 'Loading…' : 'Load more'}
                      </button>
                      <p className="mt-2 text-xs text-slate-400">
                        Showing {products.length} of {total}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-14 text-center text-white shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/20 blur-[70px]" />
          <div className="relative mx-auto max-w-xl">
            <h2 className="mb-3 text-3xl font-extrabold md:text-4xl">
              Every piece tells a{' '}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                story.
              </span>
            </h2>
            <p className="mb-8 text-base leading-relaxed text-white/70">
              Buying handmade supports the maker directly — and no two pieces are quite alike.
            </p>
            <Link
              href={buildPath('/products')}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 font-bold text-slate-900 transition-all hover:bg-white/90"
            >
              Browse everything <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto flex h-full w-80 flex-col overflow-y-auto bg-[#F0F2F2] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1 hover:bg-slate-200"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
