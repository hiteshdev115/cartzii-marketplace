import { api } from './client';
import type { Category } from '@/types';

// ---- API response shapes --------------------------------------------------

/** Shape returned by /categories/tree  (nested children) */
interface APITreeCategory {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  categoryDescription: string | null;
  categoryImage: string | null;
  categoryPosition: number;
  status: string;
  parentCategoryId: number | null;
  children: APITreeCategory[];
}

/** Shape returned by /categories/roots and /categories/:id/subcategories */
interface APIFlatCategory {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  categoryDescription: string | null;
  categoryImage: string | null;
  categoryPosition: number;
  status: string;
  hasChildren: boolean;
}

/** Shape returned by /categories/:id */
interface APICategoryDetail extends APIFlatCategory {
  parentCategory: { categoryId: number; categoryName: string } | null;
}

/** Shape returned by /categories/:id/breadcrumb */
export interface APIBreadcrumbItem {
  categoryId: number;
  categoryName: string;
}

/** Unwrap { success, data } envelope or bare array */
function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

// ---- Mappers --------------------------------------------------------------

function mapTreeCategory(raw: APITreeCategory): Category {
  return {
    id: String(raw.categoryId),
    name: raw.categoryName,
    slug: raw.categorySlug,
    description: raw.categoryDescription || '',
    image: raw.categoryImage || '',
    icon: '',
    productCount: 0,
    subcategories: raw.children?.length
      ? raw.children.filter((c) => c.status.toLowerCase() === 'active').map(mapTreeCategory)
      : undefined,
  };
}

function mapFlatCategory(raw: APIFlatCategory): Category {
  return {
    id: String(raw.categoryId),
    name: raw.categoryName,
    slug: raw.categorySlug,
    description: raw.categoryDescription || '',
    image: raw.categoryImage || '',
    icon: '',
    productCount: 0,
    subcategories: raw.hasChildren ? [] : undefined, // placeholder until loaded
  };
}

// ---- Public API -----------------------------------------------------------

/**
 * Full category tree (nth-level nested).
 * Used by: CategoryMenu, MobileNav products menu.
 */
export async function fetchCategoryTree(): Promise<Category[]> {
  const res = await api.get<unknown>('/api/v1/categories/tree');
  const list = unwrap<APITreeCategory[]>(res);
  return (Array.isArray(list) ? list : [])
    .filter((c) => c.status.toLowerCase() === 'active')
    .map(mapTreeCategory);
}

/**
 * Root-level categories only (no children loaded).
 * Used by: FeaturedCategories on home page, ProductFilters.
 */
export async function fetchRootCategories(): Promise<Category[]> {
  const res = await api.get<unknown>('/api/v1/categories/roots');
  const list = unwrap<APIFlatCategory[]>(res);
  return (Array.isArray(list) ? list : [])
    .filter((c) => c.status.toLowerCase() === 'active')
    .map(mapFlatCategory);
}

/**
 * Direct children of a given category.
 * Used by: Category [slug] page to show subcategory nav.
 */
export async function fetchSubcategories(
  categoryId: string | number,
): Promise<{ parentName: string; items: Category[] }> {
  const res = await api.get<unknown>(
    `/api/v1/categories/${categoryId}/subcategories`,
  );
  const data = unwrap<{
    parentCategoryId: number;
    parentCategoryName: string;
    subcategories: APIFlatCategory[];
  }>(res);
  return {
    parentName: data.parentCategoryName,
    items: (data.subcategories ?? [])
      .filter((c) => c.status.toLowerCase() === 'active')
      .map(mapFlatCategory),
  };
}

/**
 * Single category details.
 * Used by: Category [slug] page metadata, detail display.
 */
export async function fetchCategoryById(
  categoryId: string | number,
): Promise<Category & { parentCategory: { id: string; name: string } | null }> {
  const res = await api.get<unknown>(`/api/v1/categories/${categoryId}`);
  const raw = unwrap<APICategoryDetail>(res);
  return {
    ...mapFlatCategory(raw),
    parentCategory: raw.parentCategory
      ? { id: String(raw.parentCategory.categoryId), name: raw.parentCategory.categoryName }
      : null,
  };
}


/**
 * Breadcrumb trail from root to a given category.
 * Used by: Breadcrumb on category pages.
 */
export async function fetchCategoryBreadcrumb(
  categoryId: string | number,
): Promise<APIBreadcrumbItem[]> {
  const res = await api.get<unknown>(
    `/api/v1/categories/${categoryId}/breadcrumb`,
  );
  return unwrap<APIBreadcrumbItem[]>(res) ?? [];
}

// Backward-compatible alias — same as fetchCategoryTree
export const fetchCategories = fetchCategoryTree;

// ---- Category Products API -----------------------------------------------

export interface CategoryProductImage {
  imageid: number;
  productid?: number;
  imageurl: string;
  imagetype?: string;
  imagealttext: string;
  isprimary: boolean;
  isactive?: boolean;
  sortorder?: number;
}

export interface CategoryProductCountry {
  id: number;
  countrycode: string;
  currencycode: string;
  price: string;
  discountprice: string | null;
  discount: string | null;
  isactive: boolean;
  metatitle?: string | null;
  metadescription?: string | null;
  metakeywords?: string | null;
}

export interface CategoryVariantPricing {
  pricingid?: number;
  countrycode: string;
  currencycode: string;
  price: string;
  discountprice: string | null;
  discount: string | null;
  isactive: boolean;
}

export interface CategoryProductVariant {
  variantid: number;
  sku?: string;
  stockquantity: number;
  isactive: boolean;
  pricing: CategoryVariantPricing[];
  attributes?: { attributeName: string; value: string; colorcode: string | null }[];
}

/** Product-level attribute as returned by the category products endpoint. */
export interface CategoryProductAttribute {
  attributename: string;
  attributevalues: { value: string; colorcode: string | null }[];
}

/** Product item returned by /categories/slug/{slug}/products */
export interface CategoryProduct {
  productid: number;
  sellerid?: number;
  productname: string;
  slug: string;
  shortdescription?: string;
  stockquantity?: number;
  sku?: string;
  tags?: string;
  status?: string;
  categoryName?: string;
  categorySlug?: string;
  /** Drives the category page's filters — see lib/filters/productFilters.ts. */
  productattributes?: CategoryProductAttribute[];
  productimages: CategoryProductImage[];
  productcountries: CategoryProductCountry[];
  productvariants?: CategoryProductVariant[];
  averageRating?: number | string | null;
  reviewCount?: number;
  variantCount?: number;
  seller?: {
    storename?: string | null;
  } | null;
}

export interface CategoryProductsResult {
  category: {
    categoryId: number;
    categoryName: string;
    categorySlug: string;
    categoryDescription?: string | null;
    categoryImage?: string | null;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  products: CategoryProduct[];
}

/**
 * Fetch products for a category identified by its slug.
 * Endpoint: GET /api/v1/categories/slug/{slug}/products
 */
export async function fetchCategoryProductsBySlug(
  slug: string,
  params: {
    countryCode?: string;
    page?: number;
    limit?: number;
    sortby?: string;
  } = {},
): Promise<CategoryProductsResult> {
  const res = await api.get<unknown>(`/api/v1/categories/slug/${slug}/products`, {
    params: {
      ...(params.countryCode ? { countryCode: params.countryCode } : {}),
      ...(params.page !== undefined ? { page: params.page } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
      ...(params.sortby ? { sortby: params.sortby } : {}),
    },
  });
  const data = unwrap<CategoryProductsResult>(res);
  return data;
}
