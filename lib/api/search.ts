import { api } from './client';

// ---- API response shapes --------------------------------------------------

export interface SearchProductResult {
  productid: number;
  sellerid?: number;
  productname: string;
  slug: string;
  shortdescription: string;
  tags: string;
  status: string;
  /** Rolled up across active variants, or the product's own when it has none. */
  stockquantity?: number;
  categoryname: string;
  primaryImage: {
    imageurl: string;
    imagealttext: string;
  } | null;
  pricing: {
    price: string;
    discountprice: string | null;
    discount: string | null;
    currencycode: string;
  } | null;
  seller?: {
    storename?: string | null;
  } | null;
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * How aggressive the server's match was. Tells the UI whether to render the
 * "Showing results for X" banner. The same `matchType` values the FTS
 * cascade on the API returns — see productSearchFts.js.
 *
 *   strict / loose / prefix → normal rendering, no banner
 *   fuzzy / relaxed         → typo correction banner
 *   suggested               → "no matches, here are bestsellers"
 *   legacy                  → the pre-FTS ILIKE path behind a feature flag
 */
export type SearchMatchType =
  | 'strict' | 'loose' | 'prefix'
  | 'fuzzy'  | 'relaxed'
  | 'suggested'
  | 'legacy';

export interface SearchMeta {
  query: string;
  normalizedQuery: string;
  effectiveQuery: string;
  matchType: SearchMatchType;
}

interface SearchSuccessResponse {
  success: true;
  data: SearchProductResult[];
  pagination: SearchPagination;
  /** Present when the API is on the FTS path; absent on the legacy path. */
  search?: SearchMeta;
}

export interface SearchParams {
  q: string;
  categoryid?: number;
  countrycode?: string;
  page?: number;
  limit?: number;
  sortby?: 'price_asc' | 'price_desc' | 'newest' | 'relevance';
}

// ---- Search function ------------------------------------------------------

export async function searchProductsAPI(
  params: SearchParams,
): Promise<{ data: SearchProductResult[]; pagination: SearchPagination; search?: SearchMeta }> {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    q: params.q,
    categoryid: params.categoryid,
    countrycode: params.countrycode,
    page: params.page,
    limit: params.limit,
    sortby: params.sortby,
  };

  const res = await api.get<SearchSuccessResponse>('/api/v1/searchProducts', {
    params: queryParams,
  });

  return { data: res.data, pagination: res.pagination, search: res.search };
}

/**
 * Best-effort click attribution. Fires on a search-result tile click; the
 * server pairs it back to the most recent matching search_log row within a
 * 5-minute window. We don't await the response — the shopper is navigating
 * away by now, and the server returns 204 whatever happens.
 *
 * The promise is intentionally unawaited by callers; any failure is logged
 * to the console and dropped.
 */
export function reportSearchClick(payload: {
  q: string;
  countrycode: string;
  productid: number;
  position: number;
}): void {
  void api
    .post<unknown>('/api/v1/searchProducts/click', payload)
    .catch(() => { /* analytics never breaks UX */ });
}
