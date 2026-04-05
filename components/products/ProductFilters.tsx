'use client';

import { useTranslations } from 'next-intl';
import { useFilterStore } from '@/stores/filterStore';
import { allCategories } from '@/lib/mockData';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function FilterDropdown({
  label,
  children,
}: {
  label: string;
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
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-40">
          {children}
        </div>
      )}
    </div>
  );
}

export function ProductFilters() {
  const t = useTranslations('Products');
  const filters = useFilterStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const brands = ['SoundMax', 'UrbanCraft', 'FitTech', 'EcoWear', 'LumiCraft', 'ZenFit', 'CraftHome', 'PureGlow', 'RunElite', 'KeyMaster'];

  const activeCount =
    filters.categories.length +
    filters.brands.length +
    filters.ratings.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000 ? 1 : 0);

  const filterContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('filterCategory')}</h3>
        <div className="space-y-2">
          {allCategories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat.slug)}
                onChange={(e) => {
                  if (e.target.checked) {
                    filters.setCategories([...filters.categories, cat.slug]);
                  } else {
                    filters.setCategories(filters.categories.filter((c) => c !== cat.slug));
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              {cat.name}
              <span className="text-slate-400 ml-auto">({cat.productCount})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('filterPrice')}</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.priceRange[0]}
            onChange={(e) => filters.setPriceRange([Number(e.target.value), filters.priceRange[1]])}
            className="input text-xs py-2 w-20"
            min={0}
            placeholder="Min"
          />
          <span className="text-slate-400">—</span>
          <input
            type="number"
            value={filters.priceRange[1]}
            onChange={(e) => filters.setPriceRange([filters.priceRange[0], Number(e.target.value)])}
            className="input text-xs py-2 w-20"
            min={0}
            placeholder="Max"
          />
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('filterBrand')}</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={(e) => {
                  if (e.target.checked) {
                    filters.setBrands([...filters.brands, brand]);
                  } else {
                    filters.setBrands(filters.brands.filter((b) => b !== brand));
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('filterRating')}</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.ratings.includes(rating)}
                onChange={(e) => {
                  if (e.target.checked) {
                    filters.setRatings([...filters.ratings, rating]);
                  } else {
                    filters.setRatings(filters.ratings.filter((r) => r !== rating));
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              {rating}+ Stars
            </label>
          ))}
        </div>
      </div>

      {/* Clear All */}
      <button
        onClick={() => filters.resetFilters()}
        className="w-full btn-ghost text-red-600 hover:bg-red-50"
      >
        {t('clearFilters')}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop: horizontal filter bar */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        <FilterDropdown label={t('filterCategory')}>
          <div className="space-y-2">
            {allCategories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat.slug)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      filters.setCategories([...filters.categories, cat.slug]);
                    } else {
                      filters.setCategories(filters.categories.filter((c) => c !== cat.slug));
                    }
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                {cat.name}
                <span className="text-slate-400 ml-auto">({cat.productCount})</span>
              </label>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label={t('filterPrice')}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filters.priceRange[0]}
              onChange={(e) => filters.setPriceRange([Number(e.target.value), filters.priceRange[1]])}
              className="input text-xs py-2 w-20"
              min={0}
              placeholder="Min"
            />
            <span className="text-slate-400">—</span>
            <input
              type="number"
              value={filters.priceRange[1]}
              onChange={(e) => filters.setPriceRange([filters.priceRange[0], Number(e.target.value)])}
              className="input text-xs py-2 w-20"
              min={0}
              placeholder="Max"
            />
          </div>
        </FilterDropdown>

        <FilterDropdown label={t('filterBrand')}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      filters.setBrands([...filters.brands, brand]);
                    } else {
                      filters.setBrands(filters.brands.filter((b) => b !== brand));
                    }
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                {brand}
              </label>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label={t('filterRating')}>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.ratings.includes(rating)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      filters.setRatings([...filters.ratings, rating]);
                    } else {
                      filters.setRatings(filters.ratings.filter((r) => r !== rating));
                    }
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                {rating}+ Stars
              </label>
            ))}
          </div>
        </FilterDropdown>
      </div>

      {/* Mobile: filter button + drawer */}
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
          <div className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-80 bg-white shadow-xl overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{t('filters')}</h2>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
}
