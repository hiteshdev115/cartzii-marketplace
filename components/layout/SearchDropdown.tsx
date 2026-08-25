'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Loader2 } from 'lucide-react';
import { searchProductsAPI } from '@/lib/api';
import type { SearchProductResult } from '@/lib/api';
import { buildPath, getCountryFromLocale } from '@/config/countries';
import { useDebounce } from '@/hooks/useDebounce';
import { formatPrice } from '@/lib/utils';

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

function buildImageUrl(url: string | undefined): string {
  if (!url) return '/assets/placeholder-product.png';
  if (url.startsWith('http')) return url;
  return `${IMAGE_CDN_URL}/${url}`;
}

interface SearchDropdownProps {
  query: string;
  onSelect: () => void;
  visible: boolean;
}

export function SearchDropdown({ query, onSelect, visible }: SearchDropdownProps) {
  const t = useTranslations('Search');
  const locale = useLocale();
  const countryCode = getCountryFromLocale(locale);
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const requestRef = useRef(0);

  const fetchResults = useCallback(async (q: string) => {
    const id = ++requestRef.current;
    setLoading(true);

    try {
      const res = await searchProductsAPI({
        q,
        countrycode: countryCode,
        limit: 6,
      });
      if (id === requestRef.current) {
        setResults(res.data);
        setTotal(res.pagination.total);
      }
    } catch {
      if (id === requestRef.current) {
        setResults([]);
        setTotal(0);
      }
    } finally {
      if (id === requestRef.current) {
        setLoading(false);
      }
    }
  }, [countryCode]);

  useEffect(() => {
    if (debouncedQuery.length < 3) return;
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  if (!visible || debouncedQuery.length < 3) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : results.length > 0 ? (
        <>
          <ul role="listbox" className="divide-y divide-gray-100">
            {results.map((item) => (
              <li key={item.productid}>
                <Link
                  href={buildPath(`/products/${item.slug}`)}
                  onClick={onSelect}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    <Image
                      src={buildImageUrl(item.primaryImage?.imageurl)}
                      alt={item.primaryImage?.imagealttext || item.productname}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.productname}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{item.categoryname}</p>
                  </div>
                  {item.pricing && (
                    <div className="text-right flex-shrink-0">
                      {item.pricing.discountprice ? (
                        <>
                          <p className="text-sm font-semibold text-primary">
                            {formatPrice(parseFloat(item.pricing.discountprice), locale)}
                          </p>
                          <p className="text-xs text-slate-400 line-through">
                            {formatPrice(parseFloat(item.pricing.price), locale)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">
                          {formatPrice(parseFloat(item.pricing.price), locale)}
                        </p>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {total > 6 && (
            <Link
              href={buildPath(`/search?q=${encodeURIComponent(debouncedQuery)}`)}
              onClick={onSelect}
              className="block px-4 py-3 text-center text-sm font-medium text-primary hover:bg-slate-50 border-t border-gray-100 transition-colors"
            >
              {t('viewAllResults', { count: total })}
            </Link>
          )}
        </>
      ) : (
        <div className="py-8 text-center">
          <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">{t('noResults')}</p>
        </div>
      )}
    </div>
  );
}
