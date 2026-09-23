import { api } from './client';
import { mapProduct } from './products';
import type { Product } from '@/types';

/**
 * The handicraft feed.
 *
 * Reads the same products the rest of the storefront does — a handicraft item
 * is an ordinary product carrying an artisan detail row — so every response is
 * shaped by `mapProduct`, and prices, deals and stock behave identically.
 * Only the artisan detail and its filters are new.
 */

export interface HandicraftFilters {
  country?: string;
  technique?: string;
  material?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Restricts the price filter to one country's price rows. */
  countryCode?: string;
  handmadeOnly?: boolean;
  madeToOrderOnly?: boolean;
  oneOfAKindOnly?: boolean;
  sort?: 'newest' | 'featured';
}

export interface HandicraftFacets {
  countries: { country: string; count: number }[];
  techniques: { technique: string; count: number }[];
  materials: { material: string; count: number }[];
  categories: { slug: string; name?: string; count: number }[];
}

export interface HandicraftPage {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

const EMPTY_FACETS: HandicraftFacets = {
  countries: [], techniques: [], materials: [], categories: [],
};

/**
 * Shapes one API product.
 *
 * A thin cast onto `mapProduct`, which already attaches the artisan detail —
 * doing it again here is how the two would drift.
 */
function shape(raw: unknown, country: string): Product {
  return mapProduct(raw as Parameters<typeof mapProduct>[0], country);
}

function toQuery(filters: HandicraftFilters, extra: Record<string, string | number> = {}) {
  const params: Record<string, string | number> = { ...extra };
  if (filters.country) params.country = filters.country;
  if (filters.technique) params.technique = filters.technique;
  if (filters.material) params.material = filters.material;
  if (filters.category) params.category = filters.category;
  if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
  if (filters.countryCode) params.countryCode = filters.countryCode;
  // Only sent when ON — a `false` in the query string is truthy to a naive
  // reader on the other end, and the API treats absence as "no filter".
  if (filters.handmadeOnly) params.handmadeOnly = 'true';
  if (filters.madeToOrderOnly) params.madeToOrderOnly = 'true';
  if (filters.oneOfAKindOnly) params.oneOfAKindOnly = 'true';
  if (filters.sort) params.sort = filters.sort;
  return params;
}

export async function fetchHandicraftProducts(
  country: string,
  filters: HandicraftFilters = {},
  { limit = 24, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<HandicraftPage> {
  const empty: HandicraftPage = { products: [], total: 0, limit, offset };
  try {
    const response = await api.get<unknown>('/api/v1/handicraft/products', {
      params: toQuery(filters, { limit, offset, countryCode: filters.countryCode ?? country }),
    });
    const envelope = response as {
      data?: unknown[];
      pagination?: { total: number; limit: number; offset: number };
    };
    if (!Array.isArray(envelope?.data)) return empty;

    return {
      products: envelope.data.map((raw) => shape(raw, country)),
      total: envelope.pagination?.total ?? envelope.data.length,
      limit: envelope.pagination?.limit ?? limit,
      offset: envelope.pagination?.offset ?? offset,
    };
  } catch {
    // An empty grid rather than a thrown page: the hero, the filters and the
    // policy copy still have to render when the feed is having a bad moment.
    return empty;
  }
}

export async function fetchHandicraftFeatured(
  country: string,
  limit = 8,
): Promise<Product[]> {
  try {
    const response = await api.get<unknown>('/api/v1/handicraft/featured', { params: { limit } });
    const envelope = response as { data?: unknown[] };
    if (!Array.isArray(envelope?.data)) return [];
    return envelope.data.map((raw) => shape(raw, country));
  } catch {
    return [];
  }
}

/**
 * The filter vocabularies.
 *
 * Derived by the API from what is actually listed, so the sidebar can never
 * offer a technique that returns nothing — a filter yielding an empty grid
 * reads as a broken page.
 */
export async function fetchHandicraftFacets(): Promise<HandicraftFacets> {
  try {
    const response = await api.get<unknown>('/api/v1/handicraft/categories');
    const envelope = response as { data?: HandicraftFacets };
    return envelope?.data ?? EMPTY_FACETS;
  } catch {
    return EMPTY_FACETS;
  }
}

export async function fetchHandicraftProduct(
  country: string,
  idOrSlug: string,
): Promise<Product | null> {
  try {
    const response = await api.get<unknown>(
      `/api/v1/handicraft/products/${encodeURIComponent(idOrSlug)}`,
    );
    const envelope = response as { data?: unknown };
    return envelope?.data ? shape(envelope.data, country) : null;
  } catch {
    return null;
  }
}

/** ISO-3166 alpha-2 to a flag emoji, by offsetting into the regional indicators. */
export function countryFlag(code: string | null | undefined): string {
  const iso = String(code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return '';
  return String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** A readable country name, falling back to the code when the runtime lacks one. */
export function countryName(code: string | null | undefined, locale = 'en'): string {
  const iso = String(code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return '';
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(iso) ?? iso;
  } catch {
    return iso;
  }
}
