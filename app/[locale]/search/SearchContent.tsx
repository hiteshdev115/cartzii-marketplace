'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { searchProductsAPI } from '@/lib/api';
import type { SearchProductResult, SearchPagination } from '@/lib/api';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import { buildCountryPath, getCountryFromLocale } from '@/config/countries';
import { formatPrice } from '@/lib/utils';

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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
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
                {results.map((item) => (
                  <Link
                    key={item.productid}
                    href={buildCountryPath(locale, `/products/${item.slug}`)}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
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
                ))}
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
              <SearchIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">{t('noResults')}</h2>
              <p className="text-slate-500">{t('noResultsMessage')}</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{t('minCharacters')}</p>
        </div>
      )}
    </main>
  );
}
