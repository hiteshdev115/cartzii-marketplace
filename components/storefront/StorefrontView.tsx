'use client';

/**
 * Client shell for /store/[slug].
 *
 * The server component fetches the storefront envelope (banner/about/
 * terms/contact + productCount). This component owns the tabs, product
 * pagination and review pagination — all client-side pagination so a
 * buyer can browse without full-page reloads.
 *
 * Tabs: Products (default) · Reviews · About · Terms · Contact.
 * Only tabs with content render — e.g. no "Contact" tab if the seller
 * hasn't published contact info, no "Terms" tab if they haven't set any.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, MapPin, Phone, Star } from 'lucide-react';
import {
  fetchStorefrontProducts,
  fetchStorefrontReviews,
  type StorefrontStore,
  type StorefrontProduct,
  type StorefrontReview,
  type Pagination,
} from '@/lib/api/storefront';

interface Props {
  store: StorefrontStore;
  productCount: number;
}

type Tab = 'products' | 'reviews' | 'about' | 'terms' | 'contact';

const PRODUCTS_PER_PAGE = 12;
const REVIEWS_PER_PAGE = 10;

export function StorefrontView({ store, productCount }: Props) {
  const availableTabs = useMemo<Tab[]>(() => {
    const tabs: Tab[] = ['products', 'reviews'];
    if (store.about) tabs.push('about');
    if (store.terms) tabs.push('terms');
    if (store.contact) tabs.push('contact');
    return tabs;
  }, [store.about, store.terms, store.contact]);

  const [tab, setTab] = useState<Tab>('products');

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <StorefrontBanner store={store} productCount={productCount} />

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-200" aria-label="Store sections">
        {availableTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              tab === t
                ? 'border-b-2 border-primary px-4 py-2 text-sm font-semibold text-primary'
                : 'px-4 py-2 text-sm text-slate-600 hover:text-slate-900'
            }
            aria-current={tab === t ? 'page' : undefined}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'products' && <ProductsTab slug={store.slug} />}
        {tab === 'reviews'  && <ReviewsTab  slug={store.slug} />}
        {tab === 'about'    && <AboutTab    store={store} />}
        {tab === 'terms'    && <TermsTab    store={store} />}
        {tab === 'contact'  && <ContactTab  store={store} />}
      </div>
    </div>
  );
}

const TAB_LABEL: Record<Tab, string> = {
  products: 'Products',
  reviews:  'Reviews',
  about:    'About',
  terms:    'Store policies',
  contact:  'Contact',
};

// ── Banner + header ────────────────────────────────────────────────────────

function StorefrontBanner({ store, productCount }: { store: StorefrontStore; productCount: number }) {
  return (
    <header className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {store.bannerUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={store.bannerUrl}
          alt=""
          className="h-48 w-full object-cover md:h-64"
        />
      ) : (
        <div
          className="h-32 w-full md:h-40"
          style={{
            background:
              'linear-gradient(135deg, rgb(241 245 249) 0%, rgb(226 232 240) 100%)',
          }}
        />
      )}
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
            {store.storeName}
          </h1>
          {store.country && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {countryFlag(store.country)} {store.country}
            </span>
          )}
          <span className="text-xs text-slate-500">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </span>
        </div>
        {store.description && (
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {store.description}
          </p>
        )}
      </div>
    </header>
  );
}

// ── Products tab ───────────────────────────────────────────────────────────

function ProductsTab({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<StorefrontProduct[]>([]);
  const [pag, setPag] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Initial load only shows a spinner (loading is true by default). On
  // page change we keep the current rows on screen until the new ones
  // resolve — flashing an empty grid on every "Next" click is worse
  // UX than a beat of stale content. Also side-steps the
  // set-state-in-effect lint rule.
  useEffect(() => {
    let cancelled = false;
    fetchStorefrontProducts(slug, { page, limit: PRODUCTS_PER_PAGE })
      .then((data) => { if (!cancelled) { setRows(data.products); setPag(data.pagination); setErr(null); } })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load products.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, page]);

  if (loading && rows.length === 0) {
    return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>;
  }
  if (err) return <p className="py-8 text-center text-sm text-red-700">{err}</p>;
  if (!loading && rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">This store has no active products yet.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((p) => (
          <ProductCard key={p.productId} product={p} />
        ))}
      </div>
      {pag && pag.totalPages > 1 && (
        <PaginationBar pag={pag} onPage={setPage} />
      )}
    </div>
  );
}

function ProductCard({ product }: { product: StorefrontProduct }) {
  // Pick the first pricing row; the marketplace elsewhere resolves this
  // by viewer locale, but the buyer already lands on a locale-prefixed
  // URL so any listed price is valid to show as a preview.
  const p0 = product.pricing[0];
  const price = p0
    ? p0.discountPrice && Number(p0.discountPrice) < Number(p0.price)
      ? { display: p0.discountPrice, was: p0.price, currency: p0.currency }
      : { display: p0.price, was: null, currency: p0.currency }
    : null;

  return (
    <a
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden bg-slate-100">
        {product.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-slate-900">{product.name}</p>
        {price && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {price.currency} {formatPrice(price.display)}
            </span>
            {price.was && (
              <span className="text-xs text-slate-400 line-through">
                {price.currency} {formatPrice(price.was)}
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  );
}

// ── Reviews tab ────────────────────────────────────────────────────────────

function ReviewsTab({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<StorefrontReview[]>([]);
  const [pag, setPag] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<{ averageRating: number | null; reviewCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Same pattern as ProductsTab — initial state is loading=true, we
  // don't flash a spinner on page change.
  useEffect(() => {
    let cancelled = false;
    fetchStorefrontReviews(slug, { page, limit: REVIEWS_PER_PAGE })
      .then((data) => { if (!cancelled) { setRows(data.reviews); setPag(data.pagination); setSummary(data.summary); setErr(null); } })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load reviews.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, page]);

  if (loading && rows.length === 0) {
    return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>;
  }
  if (err) return <p className="py-8 text-center text-sm text-red-700">{err}</p>;

  return (
    <div className="space-y-4">
      {summary && summary.reviewCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <StarBar value={summary.averageRating ?? 0} />
          <div className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">
              {(summary.averageRating ?? 0).toFixed(1)}
            </span>{' '}
            average · {summary.reviewCount} {summary.reviewCount === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      )}
      {rows.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          No reviews yet — be the first to buy something and leave one.
        </p>
      )}
      {rows.map((r) => (
        <article key={r.reviewId} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StarBar value={r.rating} />
              <span className="text-sm font-semibold text-slate-900">{r.title}</span>
            </div>
            <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{r.body}</p>
          {r.media.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.media.map((m, i) => (
                m.type === 'image' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={m.url} alt="" className="h-16 w-16 rounded object-cover" />
                ) : null
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">
            {r.author} · on{' '}
            <a href={`/products/${r.product.slug}`} className="text-primary hover:underline">
              {r.product.name}
            </a>
          </p>
        </article>
      ))}
      {pag && pag.totalPages > 1 && (
        <PaginationBar pag={pag} onPage={setPage} />
      )}
    </div>
  );
}

// ── About / Terms / Contact tabs ───────────────────────────────────────────

function AboutTab({ store }: { store: StorefrontStore }) {
  return (
    <div className="prose prose-sm max-w-3xl">
      <p className="whitespace-pre-wrap text-slate-700">{store.about}</p>
    </div>
  );
}

function TermsTab({ store }: { store: StorefrontStore }) {
  return (
    <div className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-slate-900">Store policies</h2>
      <p className="whitespace-pre-wrap text-sm text-slate-700">{store.terms}</p>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        Cartzii&rsquo;s platform terms and buyer protection apply to every purchase.
        These store-specific terms are in addition to, not instead of, Cartzii&rsquo;s.
      </p>
    </div>
  );
}

function ContactTab({ store }: { store: StorefrontStore }) {
  if (!store.contact) return null;
  const { email, phone, address } = store.contact;
  return (
    <div className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Contact this store</h2>
      <dl className="space-y-2 text-sm text-slate-700">
        {email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-400" />
            <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" />
            <span>{phone}</span>
          </div>
        )}
        {address && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{address}</span>
          </div>
        )}
      </dl>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        For order issues, use the Cartzii order dashboard — messages sent here may be missed.
      </p>
    </div>
  );
}

// ── Small shared pieces ────────────────────────────────────────────────────

function PaginationBar({ pag, onPage }: { pag: Pagination; onPage: (p: number) => void }) {
  const canPrev = pag.page > 1;
  const canNext = pag.page < pag.totalPages;
  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <button
        type="button"
        onClick={() => onPage(pag.page - 1)}
        disabled={!canPrev}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-xs text-slate-500">
        Page {pag.page} of {pag.totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPage(pag.page + 1)}
        disabled={!canNext}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function StarBar({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= filled ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4 text-slate-300'}
        />
      ))}
    </div>
  );
}

function formatPrice(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toFixed(2);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * ISO alpha-2 → flag emoji. Deliberately naive — a bad or empty code
 * yields the "unknown region" glyph rather than throwing, so a
 * partially-configured store still renders.
 */
function countryFlag(iso: string): string {
  const cc = iso.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '';
  return String.fromCodePoint(
    0x1f1e6 + cc.charCodeAt(0) - 65,
    0x1f1e6 + cc.charCodeAt(1) - 65,
  );
}
