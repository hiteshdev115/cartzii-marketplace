'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchProducts, popularSearches } from '@/lib/mockData';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchContent() {
  const t = useTranslations('Search');
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchProducts(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('title') }]} />

      {/* Search input */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="input pl-12 pr-10 py-4 text-lg"
            autoFocus
            aria-label={t('placeholder')}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {debouncedQuery.trim() ? (
        <>
          <p className="text-sm text-slate-500 mb-6">
            {results.length} {t('resultsFor', { query: debouncedQuery })}
          </p>
          {results.length > 0 ? (
            <ProductGrid products={results} />
          ) : (
            <div className="text-center py-16">
              <SearchIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">{t('noResults')}</h2>
              <p className="text-slate-500">{t('noResultsMessage')}</p>
            </div>
          )}
        </>
      ) : (
        /* Popular searches */
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('popularSearches')}</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700 hover:bg-primary hover:text-white transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
