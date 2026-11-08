'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Search as SearchIcon, Loader2, Heart, ShoppingCart, AlertCircle, Sparkles } from 'lucide-react';
import { searchProductsAPI, reportSearchClick } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import type { Product } from '@/types';
import type { SearchProductResult, SearchMeta } from '@/lib/api';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildPath, getCountryFromLocale, currentCurrency } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import { useHydrated } from '@/hooks/useHydration';
import { OutOfStockButton } from '@/components/products/OutOfStockButton';

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

function buildImageUrl(url: string | undefined): string {
  if (!url) return '/assets/placeholder-product.png';
  if (url.startsWith('http')) return url;
  return `${IMAGE_CDN_URL}/${url}`;
}

const PAGE_SIZE = 20;

export function SearchContent() {
  const t = useTranslations('Search');
  const locale = useLocale();
  const countryCode = getCountryFromLocale(locale);
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  // Cumulative results across pages — infinite scroll APPENDS, never replaces.
  const [results, setResults] = useState<SearchProductResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Two loading flags: `loading` is the initial fetch (big centre spinner),
  // `loadingMore` is the subsequent "load more as you scroll" fetch (small
  // footer spinner). Keeping them separate stops a bottom-of-page spinner
  // from flashing on first search and vice-versa.
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Server-reported match type + corrected query. Drives the "Showing
  // results for X" banner. Captured from the FIRST page of results; later
  // pages inherit the same matchType and shouldn't overwrite it.
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const requestRef = useRef(0);
  const prevQueryRef = useRef(query);
  // Sentinel we attach an IntersectionObserver to. When it enters the
  // viewport, we fetch the next page. Rendered right under the grid.
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const wishlistItems = useWishlistStore((s) => s.items);
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const openLoginModal = useLoginModalStore((s) => s.open);
  const hydrated = useHydrated();
  const addToCart = useCartStore((s) => s.addItem);

  const handleAddToCart = (item: SearchProductResult) => {
    const product: Product = {
      id: String(item.productid),
      name: item.productname,
      slug: item.slug,
      description: item.shortdescription || '',
      shortDescription: item.shortdescription || '',
      price: item.pricing ? parseFloat(item.pricing.price) : 0,
      salePrice: item.pricing?.discountprice ? parseFloat(item.pricing.discountprice) : undefined,
      discount: item.pricing?.discount ? parseFloat(item.pricing.discount) : undefined,
      currency: item.pricing?.currencycode || currentCurrency,
      images: [buildImageUrl(item.primaryImage?.imageurl)],
      category: item.categoryname || '',
      categorySlug: '',
      brand: '',
      rating: 0,
      reviewCount: 0,
      sku: '',
      inStock: true,
      stockCount: 1,
      tags: item.tags ? item.tags.split(',') : [],
      isNew: false,
      onSale: !!item.pricing?.discountprice,
      isFeatured: false,
      isBestSeller: false,
      specifications: {},
    // Rebuilt from a cart line / search hit, not the catalogue: this shape is
    // only used to add to cart, and carries no attribute data to begin with.
    attributes: {},
      createdAt: '',
      // TODO: PR 2B follow-up — API missing sellerid on some search responses.
      sellerId: item.sellerid ?? 0,
      sellerName: item.seller?.storename ?? null,
    };
    addToCart(product, 1, undefined, undefined, locale);
  };

  const handleWishlistToggle = (productId: number) => {
    if (!isAuthenticated || !userId) {
      openLoginModal();
      return;
    }
    toggleWishlist(userId, productId);
  };

  // Reset accumulated results whenever the query changes from the URL
  // (shopper edited the search box and pressed Enter again).
  useEffect(() => {
    if (prevQueryRef.current !== query) {
      prevQueryRef.current = query;
      setPage(1);
      setResults([]);
      setTotal(0);
      setHasMore(true);
      setError(null);
      setSearchMeta(null);
    }
  }, [query]);

  /**
   * One function for both the initial fetch and every subsequent "load more"
   * fetch. The `append` flag decides whether to replace the array (page 1)
   * or to concatenate (pages 2+).
   *
   * Request de-dup via `requestRef`: if the shopper types a new query while
   * an older fetch is still in flight, the older response is dropped on
   * arrival so the UI never flashes stale results.
   */
  const performSearch = useCallback(async (q: string, countrycode: string, pg: number, append: boolean) => {
    const id = ++requestRef.current;
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);

    try {
      const res = await searchProductsAPI({
        q, countrycode, page: pg, limit: PAGE_SIZE,
      });
      if (id !== requestRef.current) return;
      const incoming = res.data ?? [];
      setResults((prev) => (append ? [...prev, ...incoming] : incoming));
      setTotal(res.pagination?.total ?? incoming.length);
      // Only overwrite the match banner on page 1 — the server's matchType
      // is the same across pages of the same query, and overwriting would
      // flash the banner off-and-on as the shopper scrolls.
      if (!append && res.search) setSearchMeta(res.search);
      // `hasMore` lives off whether the new cumulative length can still grow.
      // We compute it from the pagination total when present (authoritative)
      // and fall back to "the server returned a full page" otherwise.
      const nextLen = (append ? results.length : 0) + incoming.length;
      const serverTotal = res.pagination?.total;
      if (typeof serverTotal === 'number') {
        setHasMore(nextLen < serverTotal);
      } else {
        setHasMore(incoming.length >= PAGE_SIZE);
      }
    } catch (err) {
      if (id !== requestRef.current) return;
      // Explicit error state so the shopper sees "something went wrong" + a
      // retry affordance instead of a silent empty page they can't
      // distinguish from "no matches".
      const message = err instanceof Error && err.message
        ? err.message
        : t('errorGeneric');
      setError(message);
      if (!append) {
        setResults([]);
        setTotal(0);
      }
      setHasMore(false);
    } finally {
      if (id === requestRef.current) {
        if (append) setLoadingMore(false); else setLoading(false);
      }
    }
  }, [results.length, t]);

  // Fire the search on query / country / page change. Page 1 is a fresh
  // fetch (replaces results); pages 2+ append onto what's already there.
  useEffect(() => {
    if (query.trim().length < 3) return;
    performSearch(query.trim(), countryCode, page, page > 1);
    // We don't want performSearch's identity to re-run this effect — it
    // changes with results.length. The query/page/country deps are the
    // meaningful triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, countryCode, page]);

  /**
   * Infinite scroll. IntersectionObserver on a sentinel element below the
   * grid: when it enters the viewport (or gets within 400px of it — the
   * `rootMargin`), we increment `page`, which triggers the effect above.
   *
   * 400px rootMargin starts the next fetch while the shopper is still
   * scrolling the current page, so the new items land before they reach the
   * bottom — "load more happens around halfway" per the ask.
   */
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setPage((p) => p + 1);
      },
      { rootMargin: '400px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, loading, loadingMore]);

  const hasQuery = query.trim().length >= 3;

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-8">
      <Breadcrumb items={[{ label: t('title') }]} />

      {/* Results */}
      {hasQuery ? (
        <>
          {/* INITIAL load — big centred spinner. Only shows when the result
              list is empty (first search). Subsequent pages use the small
              footer spinner below the grid. */}
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : /* ERROR with no results we can still show — explain + offer
                  retry. If we have cached results from a prior page, don't
                  take them away; just surface the error at the bottom. */
            error && results.length === 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                {t('errorHeading')}
              </h2>
              <p className="mt-1 text-sm text-slate-700">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setPage(1);
                  setResults([]);
                  setHasMore(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90"
              >
                {t('tryAgain')}
              </button>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* ── Match-type banner ─────────────────────────────────────
                  'strict' / 'loose' / 'prefix' → no banner, results spoke
                    for themselves.
                  'fuzzy' / 'relaxed' → typo-correction banner so the
                    shopper knows we interpreted their query loosely.
                  'suggested' → no match at all; banner frames the grid
                    as "no results — here are bestsellers" so an empty
                    answer doesn't look like a product grid of random items.
                  The accented copy comes from next-intl; the icon is
                  rendered inline for consistency with the error box above. */}
              {searchMeta?.matchType === 'fuzzy' || searchMeta?.matchType === 'relaxed' ? (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-900">
                    {t('didYouMean', { effective: searchMeta.effectiveQuery, query })}
                  </p>
                </div>
              ) : searchMeta?.matchType === 'suggested' ? (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <SearchIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  <div className="text-sm text-slate-700">
                    <p className="font-medium text-slate-900">
                      {t('noMatchHeading', { query })}
                    </p>
                    <p className="mt-0.5 text-slate-500">
                      {t('noMatchSuggestion')}
                    </p>
                  </div>
                </div>
              ) : null}
              <p className="text-sm text-slate-500 mb-6">
                {total || results.length} {t('resultsFor', { query })}
              </p>
              <div className="product-grid">
                {results.map((item, index) => {
                  const isWishlisted = hydrated && wishlistItems.some((w) => w.product.productid === item.productid);

                  return (
                    <div
                      key={item.productid}
                      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <button
                        onClick={() => handleWishlistToggle(item.productid)}
                        className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-sm"
                        aria-label={`${isWishlisted ? 'Remove from' : 'Add to'} wishlist: ${item.productname}`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                      </button>
                      <Link
                        href={buildPath(`/products/${item.slug}`)}
                        onClick={() => {
                          // 1-indexed grid position. Fire-and-forget; the
                          // reporter swallows all errors so navigation is
                          // never blocked by an analytics hiccup.
                          reportSearchClick({
                            q: query,
                            countrycode: countryCode,
                            productid: item.productid,
                            position: index + 1,
                          });
                        }}
                      >
                        <div className="aspect-square bg-slate-50 overflow-hidden">
                          <Image
                            src={buildImageUrl(item.primaryImage?.imageurl)}
                            alt={item.primaryImage?.imagealttext || item.productname}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-slate-500 mb-1">{item.categoryname}</p>
                          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">
                            {item.productname}
                          </h3>
                          {item.pricing ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-primary">
                                {formatPrice(
                                  parseFloat(item.pricing.discountprice || item.pricing.price),
                                  locale,
                                )}
                              </span>
                              {item.pricing.discountprice && (
                                <span className="text-xs text-slate-400 line-through">
                                  {formatPrice(parseFloat(item.pricing.price), locale)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{t('priceUnavailable')}</span>
                          )}
                        </div>
                      </Link>
                      <div className="px-3 pb-3">
                        {(item.stockquantity ?? 1) <= 0 ? (
                          <OutOfStockButton className="text-xs py-2" />
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* ── Infinite-scroll footer ──
                  Three states, mutually exclusive:
                    • loadingMore → compact spinner, next page in flight
                    • hasMore     → sentinel the IntersectionObserver watches
                    • else        → short "end of results" line
                  An inline error (when we DID manage to show some results)
                  sits above the loader so the shopper can still retry. */}
              {error && results.length > 0 && (
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => performSearch(query.trim(), countryCode, page, true)}
                    className="ml-2 underline hover:text-rose-900"
                  >
                    {t('tryAgain')}
                  </button>
                </div>
              )}

              {loadingMore && (
                <div className="mt-8 flex items-center justify-center py-4 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {!loadingMore && hasMore && (
                <div ref={sentinelRef} className="h-10" aria-hidden="true" />
              )}

              {!hasMore && results.length > 0 && (
                <p className="mt-8 text-center text-xs text-slate-400">
                  {t('endOfResults')}
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <SearchIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">{t('noResults')}</h2>
              <p className="text-slate-600">{t('noResultsMessage')}</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <SearchIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">{t('minCharacters')}</p>
        </div>
      )}
    </main>
  );
}
