/* eslint-disable @next/next/no-img-element */

import type { ProductExtra } from '@/types';

/**
 * `ProductExtras` — "Product Details" section on the PDP that renders the
 * admin-defined category extras the seller filled in.
 *
 * Only populated fields reach this component (the backend omits blanks), so
 * if the array is empty the whole section collapses — a product in a
 * category with no extras configured, or a seller who left every extra
 * empty, gets no empty header.
 *
 * Rendering per type:
 *   image     → inline <img>, auto width
 *   url       → external <a> link
 *   longtext  → preserved whitespace block
 *   text      → inline text
 * Unknown types fall back to plain text so a future field type (added via
 * the admin UI without a corresponding frontend release) still renders
 * something readable instead of nothing.
 */
export function ProductExtras({ extras }: { extras: ProductExtra[] }) {
  if (!extras || extras.length === 0) return null;

  const sorted = [...extras].sort((a, b) => (a.displayorder ?? 0) - (b.displayorder ?? 0));

  return (
    <section
      className="mt-8 sm:mt-10 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8"
      aria-labelledby="product-details-heading"
    >
      <h2 id="product-details-heading" className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">
        Product Details
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {sorted.map((e) => (
          <ExtraCell key={e.fieldname} extra={e} />
        ))}
      </div>
    </section>
  );
}

function ExtraCell({ extra }: { extra: ProductExtra }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {extra.fieldlabel}
      </h3>
      <ExtraBody extra={extra} />
    </div>
  );
}

function ExtraBody({ extra }: { extra: ProductExtra }) {
  switch (extra.fieldtype) {
    case 'image':
      return (
        <a
          href={extra.fieldvalue}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block overflow-hidden rounded-lg border border-slate-200 hover:border-slate-400 transition-colors"
          aria-label={`Open ${extra.fieldlabel} in a new tab`}
        >
          <img
            src={extra.fieldvalue}
            alt={extra.fieldlabel}
            className="max-w-full h-auto"
            loading="lazy"
          />
        </a>
      );
    case 'url':
      return (
        <a
          href={extra.fieldvalue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline break-all hover:text-primary/80"
        >
          {extra.fieldvalue}
        </a>
      );
    case 'longtext':
      return (
        <p className="text-sm text-slate-700 whitespace-pre-wrap">
          {extra.fieldvalue}
        </p>
      );
    case 'text':
    default:
      return (
        <p className="text-sm text-slate-700">
          {extra.fieldvalue}
        </p>
      );
  }
}
