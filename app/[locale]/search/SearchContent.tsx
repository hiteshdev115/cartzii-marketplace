'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search as SearchIcon, Loader2, Heart, ShoppingCart } from 'lucide-react';
import { searchProductsAPI } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import type { Product } from '@/types';
import type { SearchProductResult, SearchPagination } from '@/lib/api';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import { buildCountryPath, getCountryFromLocale } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import { useHydrated } from '@/hooks/useHydration';

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

function buildImageUrl(url: string | undefined): string {
  if (!url) return '/assets/placeholder-product.png';
  if (url.startsWith('http')) return url;
  return `${IMAGE_CDN_URL}/${url}`;
}

export function SearchContent() {
  const t = useTranslations('Search');
  const locale = useLocale();
  const countryCode = getCountryFromLocale(locale);
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchProductResult[]>([]);
  const [pagination, setPagination] = useState<SearchPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const requestRef = useRef(0);
  const prevQueryRef = useRef(query);
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
      currency: item.pricing?.currencycode || 'USD',
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
      createdAt: '',
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

  // Reset page when query changes from URL
  useEffect(() => {
    if (prevQueryRef.current !== query) {
      prevQueryRef.current = query;
      setPage(1);
    }
  }, [query]);

  const performSearch = useCallback(async (q: string, countrycode: string, pg: number) => {
    const id = ++requestRef.current;
    setLoading(true);

    try {
      const res = await searchProductsAPI({
        q,
        countrycode,
        page: pg,
        limit: 20,
      });
      if (id !== requestRef.current) return;
      setResults(res.data);
      setPagination(res.pagination);
    } catch {
      if (id !== requestRef.current) return;
      setResults([]);
      setPagination(null);
    } finally {
      if (id === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) return;
    performSearch(query.trim(), countryCode, page);
  }, [query, countryCode, page, performSearch]);

  const hasQuery = query.trim().length >= 3;

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-8">
      <Breadcrumb items={[{ label: t('title') }]} />

      {/* Results */}
      {hasQuery ? (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-slate-500 mb-6">
                {pagination?.total ?? results.length} {t('resultsFor', { query })}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {results.map((item) => {
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
                      <Link href={buildCountryPath(locale, `/products/${item.slug}`)}>
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
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                  />
                </div>
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
