'use client';

import { useLocale, useTranslations } from 'next-intl';
import { X, Star } from 'lucide-react';
import { useFilterStore } from '@/stores/filterStore';
import { formatPrice } from '@/lib/utils';
import {
  DISCOUNT_MIN,
  DISCOUNT_MAX,
  countActiveFilters,
  type Facets,
} from '@/lib/filters/productFilters';

/**
 * One removable chip per applied filter.
 *
 * Category names come from `facets` rather than a second categories fetch —
 * the chips previously loaded the root categories themselves, which meant a
 * subcategory slug had no name to show and rendered as the raw slug.
 */
export function ActiveFilterChips({ facets }: { facets: Facets }) {
  const t = useTranslations('Products');
  const locale = useLocale();
  const filters = useFilterStore();

  const activeCount = countActiveFilters(filters);
  if (activeCount === 0) return null;

  const [minPrice, maxPrice] = filters.priceRange;
  const [minDiscount, maxDiscount] = filters.discountRange;
  const hasPrice = minPrice !== null || maxPrice !== null;
  const hasDiscount = minDiscount > DISCOUNT_MIN || maxDiscount < DISCOUNT_MAX;

  const chip =
    'group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors';

  return (
    <div className="flex items-center gap-2 flex-wrap py-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
        {t('activeFilters')}
      </span>

      {filters.categories.map((slug) => (
        <button
          key={`cat-${slug}`}
          onClick={() =>
            filters.setCategories(filters.categories.filter((c) => c !== slug))
          }
          className={`${chip} bg-primary/10 text-primary hover:bg-primary/20`}
        >
          {facets.categories.find((c) => c.slug === slug)?.name ?? slug}
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      ))}

      {filters.brands.map((brand) => (
        <button
          key={`brand-${brand}`}
          onClick={() => filters.setBrands(filters.brands.filter((b) => b !== brand))}
          className={`${chip} bg-blue-50 text-blue-700 hover:bg-blue-100`}
        >
          {brand}
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      ))}

      {filters.ratings.map((rating) => (
        <button
          key={`rating-${rating}`}
          onClick={() => filters.setRatings(filters.ratings.filter((r) => r !== rating))}
          className={`${chip} bg-amber-50 text-amber-700 hover:bg-amber-100`}
        >
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {t('ratingAndUp', { rating })}
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      ))}

      {/* Attribute chips — Age Group, Colour, Screen Size, whatever applies */}
      {Object.entries(filters.attributes).flatMap(([name, values]) =>
        values.map((value) => (
          <button
            key={`attr-${name}-${value}`}
            onClick={() => filters.toggleAttribute(name, value)}
            className={`${chip} bg-slate-100 text-slate-700 hover:bg-slate-200`}
          >
            <span className="text-slate-500">{name}:</span> {value}
            <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </button>
        )),
      )}

      {hasPrice && (
        <button
          onClick={() => filters.setPriceRange([null, null])}
          className={`${chip} bg-green-50 text-green-700 hover:bg-green-100`}
        >
          {/* Formatted in the deployment's own currency — CAD on cartzii.ca,
              USD on cartzii.com — rather than a hardcoded dollar sign. */}
          {minPrice !== null ? formatPrice(minPrice, locale) : t('priceAny')}
          {' – '}
          {maxPrice !== null ? formatPrice(maxPrice, locale) : t('priceAny')}
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      )}

      {filters.onSaleOnly && (
        <button
          onClick={() => filters.setOnSaleOnly(false)}
          className={`${chip} bg-rose-50 text-rose-700 hover:bg-rose-100`}
        >
          {t('onSaleOnly')}
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      )}

      {hasDiscount && (
        <button
          onClick={() => filters.setDiscountRange([DISCOUNT_MIN, DISCOUNT_MAX])}
          className={`${chip} bg-rose-50 text-rose-700 hover:bg-rose-100`}
        >
          {minDiscount}% – {maxDiscount}%{maxDiscount >= DISCOUNT_MAX ? '+' : ''}{' '}
          {t('off')}
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      )}

      {activeCount > 1 && (
        <button
          onClick={filters.resetFilters}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          {t('clearFilters')}
        </button>
      )}
    </div>
  );
}
