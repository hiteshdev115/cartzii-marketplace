import { api } from './client';

// ---- API response shapes --------------------------------------------------

export interface SearchProductResult {
  productid: number;
  productname: string;
  slug: string;
  shortdescription: string;
  tags: string;
  status: string;
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
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchSuccessResponse {
  success: true;
  data: SearchProductResult[];
  pagination: SearchPagination;
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
): Promise<{ data: SearchProductResult[]; pagination: SearchPagination }> {
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

  return { data: res.data, pagination: res.pagination };
}
