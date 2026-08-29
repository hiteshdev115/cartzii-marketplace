'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countryFlag, countryName, type HandicraftFacets, type HandicraftFilters } from '@/lib/api/handicraft';

/**
 * The filter sidebar.
 *
 * Every option is built from what is ACTUALLY listed — the API derives the
 * vocabularies from live products — so the sidebar can never offer a technique
 * that returns an empty grid, which reads as a broken page.
 */
export function HandicraftFilterSidebar({
  facets,
  filters,
  currency,
  onChange,
  onClear,
  className,
}: {
  facets: HandicraftFacets;
  filters: HandicraftFilters;
  currency: string;
  onChange: (next: HandicraftFilters) => void;
  onClear: () => void;
  className?: string;
}) {
  const set = (patch: Partial<HandicraftFilters>) => onChange({ ...filters, ...patch });

  // A filter already applied toggles off when picked again, so a dead end is
  // always one click from being undone.
  const toggle = <K extends keyof HandicraftFilters>(key: K, value: HandicraftFilters[K]) =>
    set({ [key]: filters[key] === value ? undefined : value } as Partial<HandicraftFilters>);

  const activeCount = [
    filters.country, filters.technique, filters.material, filters.category,
    filters.minPrice, filters.maxPrice,
  ].filter((v) => v !== undefined && v !== '').length
    + (filters.handmadeOnly ? 1 : 0)
    + (filters.madeToOrderOnly ? 1 : 0)
    + (filters.oneOfAKindOnly ? 1 : 0);

  return (
    <aside className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Clear {activeCount} <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>

      <FilterGroup title="Made how">
        <CheckRow
          label="Handmade only"
          checked={Boolean(filters.handmadeOnly)}
          onChange={(v) => set({ handmadeOnly: v || undefined })}
        />
        <CheckRow
          label="Made to order"
          checked={Boolean(filters.madeToOrderOnly)}
          onChange={(v) => set({ madeToOrderOnly: v || undefined })}
        />
        <CheckRow
          label="One of a kind"
          checked={Boolean(filters.oneOfAKindOnly)}
          onChange={(v) => set({ oneOfAKindOnly: v || undefined })}
        />
      </FilterGroup>

      {facets.countries.length > 0 && (
        <FilterGroup title="Country of origin">
          {facets.countries.map((entry) => (
            <OptionRow
              key={entry.country}
              label={`${countryFlag(entry.country)} ${countryName(entry.country)}`.trim()}
              count={entry.count}
              active={filters.country === entry.country}
              onClick={() => toggle('country', entry.country)}
            />
          ))}
        </FilterGroup>
      )}

      {facets.techniques.length > 0 && (
        <FilterGroup title="Craft technique">
          {facets.techniques.map((entry) => (
            <OptionRow
              key={entry.technique}
              label={entry.technique}
              count={entry.count}
              active={filters.technique === entry.technique}
              onClick={() => toggle('technique', entry.technique)}
            />
          ))}
        </FilterGroup>
      )}

      {facets.materials.length > 0 && (
        <FilterGroup title="Material">
          {facets.materials.slice(0, 12).map((entry) => (
            <OptionRow
              key={entry.material}
              label={entry.material}
              count={entry.count}
              active={filters.material === entry.material}
              onClick={() => toggle('material', entry.material)}
              capitalize
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title={`Price (${currency})`}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={filters.minPrice ?? ''}
            onChange={(e) => set({ minPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="Min"
            aria-label="Minimum price"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
          <span className="text-slate-400" aria-hidden="true">–</span>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={filters.maxPrice ?? ''}
            onChange={(e) => set({ maxPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="Max"
            aria-label="Maximum price"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </div>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CheckRow({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function OptionRow({
  label, count, active, onClick, capitalize,
}: {
  label: string; count: number; active: boolean; onClick: () => void; capitalize?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
        active ? 'bg-primary/10 font-semibold text-primary' : 'text-slate-700 hover:bg-slate-50',
      )}
    >
      <span className={cn('min-w-0 truncate', capitalize && 'capitalize')}>{label}</span>
      <span className="flex-shrink-0 text-xs text-slate-400">{count}</span>
    </button>
  );
}
