'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X, SlidersHorizontal, ChevronDown, Star } from 'lucide-react';
import { useFilterStore } from '@/stores/filterStore';
import { formatPrice } from '@/lib/utils';
import {
  DISCOUNT_MIN,
  DISCOUNT_MAX,
  countActiveFilters,
  type Facets,
} from '@/lib/filters/productFilters';

/**
 * The filter bar for /products and the category pages.
 *
 * Every control is defined exactly once, in `sections` below, and rendered into
 * both the desktop dropdown row and the mobile drawer. The previous version
 * wrote each control's markup twice, which is how the two copies drifted into
 * disagreeing about when a price filter counted as active.
 *
 * Options come from `facets`, derived from the products on screen — so a
 * category page shows that category's own attributes, and no filter is ever
 * offered that would return nothing.
 */

interface ProductFiltersProps {
  facets: Facets;
  /** Hidden on category pages, where the URL already fixes the category. */
  showCategories?: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function CheckboxRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: React.ReactNode;
  count?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-primary focus:ring-primary"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-slate-400 text-xs">{count}</span>}
    </label>
  );
}

function FilterDropdown({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
          active
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[240px] max-w-[300px] max-h-[60vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-40">
          {children}
        </div>
      )}
    </div>
  );
}

export function ProductFilters({ facets, showCategories = true }: ProductFiltersProps) {
  const t = useTranslations('Products');
  const locale = useLocale();
  const filters = useFilterStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = countActiveFilters(filters);
  const [minPrice, maxPrice] = filters.priceRange;
  const [minDiscount, maxDiscount] = filters.discountRange;

  const priceHint = useMemo(
    () =>
      facets.priceMax > 0
        ? `${formatPrice(facets.priceMin, locale)} – ${formatPrice(facets.priceMax, locale)}`
        : '',
    [facets.priceMin, facets.priceMax, locale],
  );

  /**
   * One definition per control. `key` is stable so React keeps dropdown state,
   * `active` drives the highlighted pill, and `node` is the control itself.
   */
  const sections = useMemo(() => {
    const list: { key: string; label: string; active: boolean; node: React.ReactNode }[] = [];

    if (showCategories && facets.categories.length > 1) {
      list.push({
        key: 'category',
        label: t('filterCategory'),
        active: filters.categories.length > 0,
        node: (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {facets.categories.map((cat) => (
              <CheckboxRow
                key={cat.slug}
                label={cat.name}
                count={cat.count}
                checked={filters.categories.includes(cat.slug)}
                onChange={(checked) =>
                  filters.setCategories(
                    checked
                      ? [...filters.categories, cat.slug]
                      : filters.categories.filter((c) => c !== cat.slug),
                  )
                }
              />
            ))}
          </div>
        ),
      });
    }

    list.push({
      key: 'price',
      label: t('filterPrice'),
      active: minPrice !== null || maxPrice !== null,
      node: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              // `?? ''` keeps the field genuinely empty rather than showing a 0
              // the shopper never typed — an unset bound is not a bound of zero.
              value={minPrice ?? ''}
              onChange={(e) =>
                filters.setPriceRange([
                  e.target.value === '' ? null : Number(e.target.value),
                  maxPrice,
                ])
              }
              className="input text-xs py-2 w-24"
              min={0}
              placeholder={t('priceMin')}
              aria-label={t('priceMin')}
            />
            <span className="text-slate-400">—</span>
            <input
              type="number"
              inputMode="decimal"
              value={maxPrice ?? ''}
              onChange={(e) =>
                filters.setPriceRange([
                  minPrice,
                  e.target.value === '' ? null : Number(e.target.value),
                ])
              }
              className="input text-xs py-2 w-24"
              min={0}
              placeholder={t('priceMax')}
              aria-label={t('priceMax')}
            />
          </div>
          {priceHint && <p className="text-xs text-slate-400">{priceHint}</p>}
        </div>
      ),
    });

    list.push({
      key: 'deals',
      label: t('filterDeals'),
      active: filters.onSaleOnly || minDiscount > DISCOUNT_MIN || maxDiscount < DISCOUNT_MAX,
      node: (
        <div className="space-y-3">
          <CheckboxRow
            label={t('onSaleOnly')}
            count={facets.onSaleCount}
            checked={filters.onSaleOnly}
            onChange={filters.setOnSaleOnly}
          />
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('filterDiscount')}</span>
              <span className="font-medium text-slate-700">
                {minDiscount}% – {maxDiscount}%
                {maxDiscount >= DISCOUNT_MAX ? '+' : ''}
              </span>
            </div>
            <input
              type="range"
              min={DISCOUNT_MIN}
              max={DISCOUNT_MAX}
              step={5}
              value={minDiscount}
              onChange={(e) =>
                filters.setDiscountRange([
                  Math.min(Number(e.target.value), maxDiscount),
                  maxDiscount,
                ])
              }
              className="w-full accent-primary"
              aria-label={t('discountMin')}
            />
            <input
              type="range"
              min={DISCOUNT_MIN}
              max={DISCOUNT_MAX}
              step={5}
              value={maxDiscount}
              onChange={(e) =>
                filters.setDiscountRange([
                  minDiscount,
                  Math.max(Number(e.target.value), minDiscount),
                ])
              }
              className="w-full accent-primary"
              aria-label={t('discountMax')}
            />
          </div>
        </div>
      ),
    });

    if (facets.brands.length > 1) {
      list.push({
        key: 'brand',
        label: t('filterBrand'),
        active: filters.brands.length > 0,
        node: (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {facets.brands.map((brand) => (
              <CheckboxRow
                key={brand.value}
                label={brand.value}
                count={brand.count}
                checked={filters.brands.includes(brand.value)}
                onChange={(checked) =>
                  filters.setBrands(
                    checked
                      ? [...filters.brands, brand.value]
                      : filters.brands.filter((b) => b !== brand.value),
                  )
                }
              />
            ))}
          </div>
        ),
      });
    }

    list.push({
      key: 'rating',
      label: t('filterRating'),
      active: filters.ratings.length > 0,
      node: (
        <div className="space-y-1">
          {[4, 3, 2, 1].map((rating) => (
            <CheckboxRow
              key={rating}
              checked={filters.ratings.includes(rating)}
              onChange={(checked) =>
                filters.setRatings(
                  checked
                    ? [...filters.ratings, rating]
                    : filters.ratings.filter((r) => r !== rating),
                )
              }
              label={
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {t('ratingAndUp', { rating })}
                </span>
              }
            />
          ))}
        </div>
      ),
    });

    // Attribute facets — Age Group and the other global ones first, then
    // whatever this category contributes (Screen Size, Shoe Size, Flavor…).
    for (const facet of facets.attributes) {
      const selected = filters.attributes[facet.name] ?? [];
      list.push({
        key: `attr:${facet.name}`,
        label: facet.name,
        active: selected.length > 0,
        node: (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {facet.values.map((v) => (
              <CheckboxRow
                key={v.value}
                label={v.value}
                count={v.count}
                checked={selected.includes(v.value)}
                onChange={() => filters.toggleAttribute(facet.name, v.value)}
              />
            ))}
          </div>
        ),
      });
    }

    return list;
  }, [facets, filters, t, showCategories, minPrice, maxPrice, minDiscount, maxDiscount, priceHint]);

  return (
    <>
      {/* Desktop: a row of dropdowns */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {sections.map((s) => (
          <FilterDropdown key={s.key} label={s.label} active={s.active}>
            {s.node}
          </FilterDropdown>
        ))}
        {activeCount > 0 && (
          <button
            onClick={filters.resetFilters}
            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Mobile: one button opening a drawer of the same sections */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden flex items-center gap-2 btn-secondary"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {t('filters')}
        {activeCount > 0 && (
          <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-80 bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 flex items-center justify-between px-4 py-3">
              <h2 className="text-lg font-semibold">{t('filters')}</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {sections.map((s) => (
                <Section key={s.key} title={s.label}>
                  {s.node}
                </Section>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-2">
              <button
                onClick={filters.resetFilters}
                className="flex-1 btn-ghost text-red-600 hover:bg-red-50"
              >
                {t('clearFilters')}
              </button>
              <button onClick={() => setMobileOpen(false)} className="flex-1 btn-primary">
                {t('applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
