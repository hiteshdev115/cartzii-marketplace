/**
 * Public seller storefront reads.
 *
 * Backs the /store/[slug] page. Every endpoint here is UNAUTHENTICATED
 * and read-only — the buyer viewing a store is not necessarily signed
 * in, and we deliberately don't require them to be.
 *
 * Response shapes mirror the api-server controller
 * (publicStorefront.controller.js). Where the marketplace already has a
 * canonical shape for something (a product card, a review), we adapt
 * the API's response to match rather than inventing a new one on the
 * client — keeps store cards visually identical to category cards.
 */

import { api, ApiError } from './client';
import { mapProduct } from './products';
import type { Product } from '@/types';

export interface StorefrontContact {
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface StorefrontStore {
  slug: string;
  storeName: string;
  description: string | null;
  bannerUrl: string | null;
  about: string | null;
  terms: string | null;
  country: string | null;
  currency: string | null;
  primaryLanguage: string | null;
  /** null when the seller has not opted into publishing contact info. */
  contact: StorefrontContact | null;
  updatedAt: string;
}

// StorefrontProduct is the shape returned by `fetchStorefrontProducts`
// — a fully-mapped Product (same type the /products listing uses)
// with a `sellerName` and `sellerSlug` already resolved. Reusing the
// canonical Product means the standard <ProductCard> works out of
// the box; a bespoke type would fork the card component too.
export type StorefrontProduct = Product;

export interface StorefrontReviewMedia {
  url: string;
  type: string;
}

export interface StorefrontReview {
  reviewId: number;
  rating: number;
  title: string;
  body: string;
  author: string;
  product: { productId: number; name: string; slug: string };
  media: StorefrontReviewMedia[];
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Envelope<T> { success: true; data: T }

/**
 * Fetch the storefront envelope. Returns null on 404 so callers can
 * render "store not found" without try/catch — the API deliberately
 * conflates "does not exist" and "restricted" (see controller docstring)
 * so both land here.
 */
export async function fetchStorefront(slug: string): Promise<{
  store: StorefrontStore;
  stats: { productCount: number };
} | null> {
  try {
    const res = await api.get<Envelope<{ store: StorefrontStore; stats: { productCount: number } }>>(
      `/api/v1/public/stores/${encodeURIComponent(slug)}`,
    );
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Paginated products for a storefront.
 *
 * The API returns the SAME rich shape the main product listing uses,
 * so we route it through `mapProduct` here and hand back canonical
 * `Product` objects. `country` picks the pricing row the mapper
 * surfaces on the card — falls back to CA (the default deployment)
 * when the marketplace hasn't provided one.
 */
export async function fetchStorefrontProducts(
  slug: string,
  opts: { page?: number; limit?: number; country?: string } = {},
): Promise<{ products: StorefrontProduct[]; pagination: Pagination }> {
  const qs = new URLSearchParams();
  if (opts.page)  qs.set('page',  String(opts.page));
  if (opts.limit) qs.set('limit', String(opts.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  // Raw response is `{ products: APIProduct[], pagination }` — the
  // API-side rows carry the same fields as /products list.
  const res = await api.get<Envelope<{
    products: Parameters<typeof mapProduct>[0][];
    pagination: Pagination;
  }>>(
    `/api/v1/public/stores/${encodeURIComponent(slug)}/products${suffix}`,
  );
  const country = (opts.country ?? 'CA').toUpperCase();
  return {
    products: res.data.products.map((p) => mapProduct(p, country)),
    pagination: res.data.pagination,
  };
}

export async function fetchStorefrontReviews(
  slug: string,
  opts: { page?: number; limit?: number } = {},
): Promise<{
  reviews: StorefrontReview[];
  pagination: Pagination;
  summary: { averageRating: number | null; reviewCount: number };
}> {
  const qs = new URLSearchParams();
  if (opts.page)  qs.set('page',  String(opts.page));
  if (opts.limit) qs.set('limit', String(opts.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await api.get<Envelope<{
    reviews: StorefrontReview[];
    pagination: Pagination;
    summary: { averageRating: number | null; reviewCount: number };
  }>>(
    `/api/v1/public/stores/${encodeURIComponent(slug)}/reviews${suffix}`,
  );
  return res.data;
}
