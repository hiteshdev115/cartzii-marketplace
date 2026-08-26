/**
 * Filtering, faceting and sorting for the storefront product lists.
 *
 * Deliberately free of React and of any network call: the same functions run
 * on /products and on a category page, and if the catalogue outgrows
 * client-side filtering these predicates are what move into the API.
 *
 * Facets are derived from the products actually on screen rather than from a
 * fixed config. That is what makes the category pages work without a second
 * implementation — a Fashion page offers Shoe Size and Occasion because its
 * products carry those attributes, and it never offers a filter that would
 * match nothing.
 */
import type { FilterState, Product, SortOption } from '@/types';

/**
 * Percent-off bounds for the discount control. `DISCOUNT_MAX` doubles as
 * "no upper limit": a product at 90% off still shows while the slider sits at
 * its default, because the default must not filter anything out.
 */
export const DISCOUNT_MIN = 0;
export const DISCOUNT_MAX = 80;

/** Attributes shown on every listing, in this order, when present. */
export const GLOBAL_ATTRIBUTE_ORDER = [
  'Age Group',
  'Gender',
  'Color',
  'Size',
  'Material',
  'Condition',
] as const;

/**
 * Never offered as a filter. Brand has its own control, and free-text or
 * per-unit fields make for hundreds of one-product facets rather than a filter.
 */
const EXCLUDED_ATTRIBUTES = new Set(
  ['brand', 'weight', 'dimensions', 'country of origin', 'warranty period'].map((s) => s),
);

/** A single filterable attribute and the values present in the current set. */
export interface Facet {
  name: string;
  values: { value: string; count: number }[];
  /** True for the common attributes listed in GLOBAL_ATTRIBUTE_ORDER. */
  global: boolean;
}

export interface Facets {
  categories: { slug: string; name: string; count: number }[];
  brands: { value: string; count: number }[];
  attributes: Facet[];
  priceMin: number;
  priceMax: number;
  /** Highest percent-off present in the set. */
  maxDiscount: number;
  onSaleCount: number;
}

/** The price a shopper actually pays — sale price when there is one. */
export function effectivePrice(p: Product): number {
  return p.salePrice !== undefined && p.salePrice < p.price ? p.salePrice : p.price;
}

/** Percent off, 0 when not discounted. Derived rather than trusting `discount`. */
export function discountPercent(p: Product): number {
  if (p.salePrice === undefined || p.price <= 0 || p.salePrice >= p.price) return 0;
  return Math.round(((p.price - p.salePrice) / p.price) * 100);
}

function isFilterableAttribute(name: string): boolean {
  return !EXCLUDED_ATTRIBUTES.has(name.trim().toLowerCase());
}

/**
 * Builds the filter options from a product set.
 *
 * `scopeCategory` suppresses the category facet on a category page, where the
 * category is already fixed by the URL and offering it again just confuses.
 */
export function deriveFacets(
  products: Product[],
  options: { includeCategories?: boolean } = {},
): Facets {
  const { includeCategories = true } = options;

  const categoryMap = new Map<string, { slug: string; name: string; count: number }>();
  const brandMap = new Map<string, number>();
  const attributeMap = new Map<string, Map<string, number>>();

  let priceMin = Number.POSITIVE_INFINITY;
  let priceMax = 0;
  let maxDiscount = 0;
  let onSaleCount = 0;

  for (const p of products) {
    const price = effectivePrice(p);
    if (Number.isFinite(price)) {
      if (price < priceMin) priceMin = price;
      if (price > priceMax) priceMax = price;
    }

    const pct = discountPercent(p);
    if (pct > 0) onSaleCount += 1;
    if (pct > maxDiscount) maxDiscount = pct;

    if (includeCategories && p.categorySlug) {
      const existing = categoryMap.get(p.categorySlug);
      if (existing) existing.count += 1;
      else
        categoryMap.set(p.categorySlug, {
          slug: p.categorySlug,
          name: p.category || p.categorySlug,
          count: 1,
        });
    }

    if (p.brand) brandMap.set(p.brand, (brandMap.get(p.brand) ?? 0) + 1);

    for (const [name, values] of Object.entries(p.attributes ?? {})) {
      if (!isFilterableAttribute(name)) continue;
      let bucket = attributeMap.get(name);
      if (!bucket) {
        bucket = new Map<string, number>();
        attributeMap.set(name, bucket);
      }
      // A product counts once per distinct value, even across variants.
      for (const value of new Set(values)) {
        bucket.set(value, (bucket.get(value) ?? 0) + 1);
      }
    }
  }

  const globalOrder = new Map(GLOBAL_ATTRIBUTE_ORDER.map((n, i) => [n.toLowerCase(), i]));

  const attributes: Facet[] = Array.from(attributeMap.entries())
    // A value every product shares filters nothing out; drop it rather than
    // showing a control that cannot change the result.
    .filter(([, values]) => values.size > 1)
    .map(([name, values]) => ({
      name,
      global: globalOrder.has(name.toLowerCase()),
      values: Array.from(values.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    }))
    .sort((a, b) => {
      const ai = globalOrder.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bi = globalOrder.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi || a.name.localeCompare(b.name);
    });

  return {
    categories: Array.from(categoryMap.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    ),
    brands: Array.from(brandMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    attributes,
    priceMin: Number.isFinite(priceMin) ? Math.floor(priceMin) : 0,
    priceMax: Math.ceil(priceMax),
    maxDiscount,
    onSaleCount,
  };
}

/** Case-insensitive lookup, so "age group" and "Age Group" are one filter. */
function attributeValues(product: Product, name: string): string[] {
  const direct = product.attributes?.[name];
  if (direct) return direct;
  const key = Object.keys(product.attributes ?? {}).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  return key ? product.attributes[key] : [];
}

export function matchesFilters(product: Product, filters: FilterState): boolean {
  const {
    categories,
    priceRange,
    brands,
    ratings,
    onSaleOnly,
    discountRange,
    attributes,
    availability,
    searchQuery,
  } = filters;

  if (categories.length > 0 && !categories.includes(product.categorySlug)) return false;

  const price = effectivePrice(product);
  const [minPrice, maxPrice] = priceRange;
  if (minPrice !== null && price < minPrice) return false;
  if (maxPrice !== null && price > maxPrice) return false;

  if (brands.length > 0 && !brands.includes(product.brand)) return false;

  // Rating checkboxes are "N stars and up", so the loosest selection wins
  // rather than requiring the product to satisfy all of them at once.
  if (ratings.length > 0 && product.rating < Math.min(...ratings)) return false;

  const pct = discountPercent(product);
  if (onSaleOnly && pct <= 0) return false;

  const [minDiscount, maxDiscount] = discountRange;
  // A discount floor above zero implies the shopper wants discounted items;
  // without this, every full-price product (0% off) would pass a 10–80 filter.
  if (minDiscount > DISCOUNT_MIN && pct < minDiscount) return false;
  if (maxDiscount < DISCOUNT_MAX && pct > maxDiscount) return false;

  if (availability === 'inStock' && !product.inStock) return false;
  if (availability === 'outOfStock' && product.inStock) return false;
  if (availability === 'onSale' && pct <= 0) return false;

  // Across attributes: AND. Within one attribute: OR — picking Red and Blue
  // means "either colour", which is what a shopper expects from checkboxes.
  for (const [name, selected] of Object.entries(attributes)) {
    if (selected.length === 0) continue;
    const owned = attributeValues(product, name);
    if (!selected.some((v) => owned.includes(v))) return false;
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const haystack = [product.name, product.brand, product.category, ...(product.tags ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}

export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case 'price-high':
      return sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case 'top-rated':
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'best-selling':
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    case 'relevance':
    default:
      return sorted;
  }
}

export function applyFilters(products: Product[], filters: FilterState): Product[] {
  return sortProducts(
    products.filter((p) => matchesFilters(p, filters)),
    filters.sortBy,
  );
}

/** How many distinct filters are applied — drives the mobile badge. */
export function countActiveFilters(filters: FilterState): number {
  let n = 0;
  n += filters.categories.length;
  n += filters.brands.length;
  n += filters.ratings.length;
  if (filters.priceRange[0] !== null || filters.priceRange[1] !== null) n += 1;
  if (filters.onSaleOnly) n += 1;
  if (filters.discountRange[0] > DISCOUNT_MIN || filters.discountRange[1] < DISCOUNT_MAX)
    n += 1;
  if (filters.availability !== 'all') n += 1;
  for (const values of Object.values(filters.attributes)) n += values.length;
  return n;
}
