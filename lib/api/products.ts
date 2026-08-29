import { api } from './client';
import { resolvePrice } from '@/lib/pricing';
import type { Product, ProductVariant, DetailVariant, Review } from '@/types';
import { currentCurrency } from '@/config/countries';

// ---- API response shapes --------------------------------------------------

interface APIProductImage {
  imageid: number;
  productid: number;
  imageurl: string;
  imagetype: string;
  imagealttext: string;
  isprimary: boolean;
  isactive: boolean;
  createdat: string;
  updatedat: string;
}

interface APIVariantImage {
  imageid: number;
  imageurl: string;
  imagealttext: string | null;
  isprimary: boolean;
  sortorder: number;
}

/** Attached by the API to a price row it discounted for an active deal. */
interface APIDeal {
  dealid: number;
  discountpct: number;
  startsat: string;
  endsat: string;
}

interface APIVariantPricing {
  pricingid: number;
  deal?: APIDeal | null;
  countrycode: string;
  currencycode: string;
  price: string;
  discountprice: string;
  discount: string | null;
  isactive: boolean;
}

interface APIVariantAttribute {
  attributeName: string;
  value: string;
  colorcode: string | null;
}

interface APIVariant {
  variantid: number;
  sku: string;
  stockquantity: number;
  isactive: boolean;
  pricing: APIVariantPricing[];
  images: APIVariantImage[];
  attributes: APIVariantAttribute[];
  // Optional per-variant shipping measurements — used by the /shipping/rates
  // engine and (optionally) surfaced on the PDP specifications block.
  weight?: number | string | null;
  weightunit?: string | null;
  length?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  dimensionunit?: string | null;
}

interface APIProductCountry {
  id: number;
  deal?: APIDeal | null;
  countrycode: string;
  currencycode: string;
  price: string;
  discountprice: string;
  discount: string | null;
  isactive: boolean;
  metatitle: string | null;
  metadescription: string | null;
  metakeywords: string | null;
}

interface APIReview {
  reviewid: number;
  userid: number;
  rating: number;
  title: string;
  comment: string;
  isverified: boolean;
  createdat: string;
  user?: { firstname?: string; lastname?: string; avatar?: string };
}

// The list endpoints select a narrower shape than getProductBySlug — they
// already filter to active rows and sort by sortorder server-side, so the
// bookkeeping fields are optional rather than a second interface.
interface APIAttributeValue {
  valueid?: number;
  value: string;
  colorcode: string | null;
  sortorder?: number;
  isactive?: boolean;
}

interface APIProductAttribute {
  attributeid?: number;
  attributename: string;
  sortorder?: number;
  isactive?: boolean;
  attributevalues: APIAttributeValue[];
}

interface APICategory {
  categoryid: number;
  categoryname: string;
  categorydescription: string;
  categoryslug: string;
  categoryimage: string | null;
}

interface APISeller {
  storename?: string | null;
}

interface APIProduct {
  productid: number;
  sellerid: number;
  returnPolicy?: {
    returnWindowDays: number;
    exchangeAllowed: boolean;
    summary: string;
  };
  categoryid: number;
  sku: string;
  slug: string;
  productname: string;
  productdescription: string;
  stockquantity: number;
  shortdescription: string;
  video: string | null;
  warranty: string | null;
  tags: string | null;
  status: string;
  releaseat: string | null;
  createdat: string;
  updatedat: string;
  productimages: APIProductImage[];
  productvariants: APIVariant[];
  productcountries: APIProductCountry[];
  // ── Handicraft ──
  // Absent on a general product, and on any response predating the feature.
  producttype?: string | null;
  isfeatured?: boolean | null;
  handicraft_details?: import('@/types').HandicraftDetails | null;
  seller_badges?: import('@/types').ProductSellerBadges | null;
  categoryName?: string;
  categorySlug?: string;
  averageRating?: number | string | null;
  // Product-level attributes ship on the list endpoints too, so the storefront
  // can build its filter facets without a request per product.
  productattributes?: APIProductAttribute[];
  // Fields present only in getProductBySlug response
  reviews?: APIReview[];
  reviewCount?: number;
  category?: APICategory;
  seller?: APISeller | null;
  storename?: string | null;
  // Optional shipping measurements exposed by all product read endpoints.
  weight?: number | string | null;
  weightunit?: string | null;
  length?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  dimensionunit?: string | null;
  // Free-delivery flag — when true the seller absorbs the shipping charge
  // and the storefront shows a "Free Delivery" badge. Optional because
  // legacy responses (and older mock fixtures) predate this field.
  isfreedelivery?: boolean | null;
}

// ---- Helpers --------------------------------------------------------------

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

function buildImageUrl(filename: string): string {
  if (!filename) return '/assets/placeholder-product.png';
  if (filename.startsWith('http')) return filename;
  return `${IMAGE_CDN_URL}/${filename}`;
}

/** Unwrap { success, data } envelope or bare array */
function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/**
 * Coerce a numeric field that the API may return as `number`, `"0.25"`, or
 * `null`. Empty strings and zero-length values become `null` so downstream
 * code can `!= null`-guard consistently.
 */
function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Find the best pricing entry for a variant.
 * Prefers CA, then falls back to the first active pricing.
 */
function pickPricing(
  variant: APIVariant,
  country = 'CA',
): APIVariantPricing | undefined {
  const active = variant.pricing.filter((p) => p.isactive);
  return active.find((p) => p.countrycode === country) ?? active[0];
}

// ---- Mapper ---------------------------------------------------------------

function buildDetailVariants(variants: APIVariant[], country: string): DetailVariant[] {
  return variants.map((v) => {
    // Shared resolver — see lib/pricing.ts. This used to decide which figure
    // was the sale price by testing `discountprice > price`, which is backwards
    // and silently dropped every real discount.
    const { origPrice, salePrice: saleP, discountPct } = resolvePrice(pickPricing(v, country));
    const disc = discountPct || undefined;

    const colorAttr = v.attributes.find((a) => a.attributeName.toLowerCase() === 'color');
    const sizeAttr = v.attributes.find((a) => a.attributeName.toLowerCase() === 'size');

    const imgs = v.images
      .sort((a, b) => {
        if (b.isprimary !== a.isprimary) return b.isprimary ? 1 : -1;
        return a.sortorder - b.sortorder;
      })
      .map((img) => buildImageUrl(img.imageurl));

    return {
      variantId: String(v.variantid),
      sku: v.sku,
      color: colorAttr?.value,
      colorHex: colorAttr?.colorcode ?? undefined,
      size: sizeAttr?.value,
      images: imgs.length > 0 ? imgs : [],
      price: origPrice,
      salePrice: saleP,
      discount: disc,
      stockCount: v.stockquantity,
      inStock: v.stockquantity > 0,
      weight: toNumberOrNull(v.weight),
      weightUnit: v.weightunit ?? null,
      length: toNumberOrNull(v.length),
      width: toNumberOrNull(v.width),
      height: toNumberOrNull(v.height),
      dimensionUnit: v.dimensionunit ?? null,
    };
  });
}

/**
 * Shapes an API product for the storefront.
 *
 * Exported so the handicraft feed can reuse it: a handicraft item is the SAME
 * product payload with an extra detail object, and duplicating this pricing
 * logic is how the two would drift into showing different prices for one item.
 */
export function mapProduct(raw: APIProduct, country: string): Product {
  // -- product-level images (fallback when no variant images) ---------------
  const productImages = (raw.productimages ?? [])
    .filter((img) => img.isactive)
    .sort((a, b) => (b.isprimary ? 1 : 0) - (a.isprimary ? 1 : 0))
    .map((img) => buildImageUrl(img.imageurl));

  // -- variants (active only) -----------------------------------------------
  const activeVariants = (raw.productvariants ?? []).filter((v) => v.isactive);

  // -- pricing from the first variant ---------------------------------------
  const firstVariant = activeVariants[0];
  const variantPricing = firstVariant ? pickPricing(firstVariant, country) : undefined;

  // -- fallback: product-level country pricing (productcountries) -----------
  const countryEntries = (raw.productcountries ?? []).filter((pc) => pc.isactive);
  const countryPricing =
    countryEntries.find((pc) => pc.countrycode === country) ?? countryEntries[0];

  // Use variant pricing first; fall back to productcountries if variant has
  // no pricing or yields 0.
  const hasVariantPrice =
    variantPricing && parseFloat(variantPricing.price) > 0;

  const priceSrc = hasVariantPrice
    ? {
        price: variantPricing!.price,
        discountprice: variantPricing!.discountprice,
        discount: variantPricing!.discount,
        currencycode: variantPricing!.currencycode,
        // Carried alongside the figures it produced, so the deal shown always
        // belongs to the row the price came from.
        deal: variantPricing!.deal ?? null,
      }
    : countryPricing && parseFloat(countryPricing.price) > 0
      ? {
          deal: countryPricing.deal ?? null,
          price: countryPricing.price,
          discountprice: countryPricing.discountprice,
          discount: countryPricing.discount,
          currencycode: countryPricing.currencycode,
        }
      : undefined;

  // Shared resolver — see lib/pricing.ts. The previous comment here claimed
  // `discountprice` was the higher compare-at price; it is the LOWER, reduced
  // one, which is why discounted products rendered at full price.
  const { origPrice: originalPrice, salePrice, discountPct } = resolvePrice(priceSrc);

  // Read from the row the price came from, so a deal on the variant row and a
  // deal on the country row cannot be confused for one another.
  const rawDeal = priceSrc?.deal ?? null;
  const deal = rawDeal
    ? {
        dealId: rawDeal.dealid,
        discountPercent: rawDeal.discountpct,
        startsAt: String(rawDeal.startsat),
        endsAt: String(rawDeal.endsat),
      }
    : undefined;

  let discount: number | undefined = discountPct || undefined;
  if (!discount && salePrice !== undefined && originalPrice > 0) {
    discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }

  // -- variant images: use first variant's primary image as the hero --------
  const variantImages = firstVariant
    ? firstVariant.images
        .sort((a, b) => {
          if (b.isprimary !== a.isprimary) return b.isprimary ? 1 : -1;
          return a.sortorder - b.sortorder;
        })
        .map((img) => buildImageUrl(img.imageurl))
    : [];

  const images =
    variantImages.length > 0
      ? variantImages
      : productImages.length > 0
        ? productImages
        : ['/assets/placeholder-product.png'];

  // -- colors from variant attributes ---------------------------------------
  const colorMap = new Map<string, ProductVariant>();
  for (const v of activeVariants) {
    const colorAttr = v.attributes.find(
      (a) => a.attributeName.toLowerCase() === 'color',
    );
    if (colorAttr && !colorMap.has(colorAttr.value)) {
      const primaryImg = v.images.find((i) => i.isprimary) ?? v.images[0];
      colorMap.set(colorAttr.value, {
        name: colorAttr.value,
        value: colorAttr.value,
        hex: colorAttr.colorcode ?? undefined,
        image: primaryImg ? buildImageUrl(primaryImg.imageurl) : undefined,
      });
    }
  }
  const colors = colorMap.size > 0 ? Array.from(colorMap.values()) : undefined;

  // -- sizes from variant attributes ----------------------------------------
  const sizeSet = new Set<string>();
  for (const v of activeVariants) {
    const sizeAttr = v.attributes.find(
      (a) => a.attributeName.toLowerCase() === 'size',
    );
    if (sizeAttr) sizeSet.add(sizeAttr.value);
  }
  const sizes = sizeSet.size > 0 ? Array.from(sizeSet) : undefined;

  // -- product-level attributes ---------------------------------------------
  // Keyed by name and de-duplicated. Drives every attribute filter, including
  // Age Group and whatever is scoped to this product's category.
  const attributes: Record<string, string[]> = {};
  for (const attr of raw.productattributes ?? []) {
    if (attr.isactive === false) continue;
    const name = attr.attributename?.trim();
    if (!name) continue;
    const values = (attr.attributevalues ?? [])
      .filter((v) => v.isactive !== false)
      .map((v) => v.value?.trim())
      .filter((v): v is string => !!v);
    if (values.length === 0) continue;
    attributes[name] = Array.from(new Set([...(attributes[name] ?? []), ...values]));
  }

  // -- brand ----------------------------------------------------------------
  // Variant attributes first (where sellers have historically set it), falling
  // back to the product-level "Brand" attribute.
  let brand = '';
  for (const v of activeVariants) {
    const brandAttr = v.attributes.find(
      (a) => a.attributeName.toLowerCase() === 'brand',
    );
    if (brandAttr) {
      brand = brandAttr.value;
      break;
    }
  }
  if (!brand) {
    const brandKey = Object.keys(attributes).find((k) => k.toLowerCase() === 'brand');
    if (brandKey) brand = attributes[brandKey][0] ?? '';
  }

  // -- stock from variants --------------------------------------------------
  const totalStock =
    activeVariants.length > 0
      ? activeVariants.reduce((sum, v) => sum + v.stockquantity, 0)
      : raw.stockquantity;

  // -- currency from pricing ------------------------------------------------
  const currency = priceSrc?.currencycode || currentCurrency;

  const isNew =
    !!raw.releaseat &&
    Date.now() - new Date(raw.releaseat).getTime() < 30 * 24 * 60 * 60 * 1000;

  return {
    id: String(raw.productid),
    name: raw.productname,
    slug: raw.slug,
    description: raw.productdescription || '',
    shortDescription: raw.shortdescription || '',
    price: originalPrice,
    salePrice,
    discount,
    currency,
    images,
    category: raw.category?.categoryname || raw.categoryName || '',
    // `category` is detail-only; `categorySlug` is what the list endpoints send.
    categorySlug: raw.category?.categoryslug || raw.categorySlug || '',
    brand,
    rating: raw.averageRating ? parseFloat(String(raw.averageRating)) : 0,
    reviewCount: raw.reviewCount ?? 0,
    sku: raw.sku,
    inStock: totalStock > 0,
    stockCount: totalStock,
    colors,
    sizes,
    tags: raw.tags ? raw.tags.split(',').map((t) => t.trim()) : [],
    isNew,
    onSale: salePrice !== undefined && salePrice < originalPrice,
    // Attached here, not in the handicraft client, so EVERY path that shapes a
    // product carries it — the detail page, the search results and the
    // handicraft feed all go through this function, and a listing that showed
    // its artisan on one and not the other would be the obvious bug.
    handicraft: raw.handicraft_details ?? null,
    sellerBadges: raw.seller_badges ?? null,
    isFeatured: Boolean(raw.isfeatured),
    isBestSeller: false,
    specifications: {},
    attributes,
    deal,
    createdAt: raw.createdat,
    detailVariants: buildDetailVariants(activeVariants, country),
    sellerId: raw.sellerid,
    sellerName: raw.seller?.storename ?? raw.storename ?? null,
    // Resolved server-side (seller window → platform default). Left undefined
    // when the API predates it, so the badge hides rather than showing NaN.
    returnPolicy: raw.returnPolicy,
    weight: toNumberOrNull(raw.weight),
    weightUnit: raw.weightunit ?? null,
    length: toNumberOrNull(raw.length),
    width: toNumberOrNull(raw.width),
    height: toNumberOrNull(raw.height),
    dimensionUnit: raw.dimensionunit ?? null,
    // Free-delivery flag surfaced by the API. Falsy legacy responses (undefined
    // / null) collapse to false so the badge only shows for opted-in products.
    isFreeDelivery: Boolean(raw.isfreedelivery),
  };
}

/** Check if a product has pricing available for the given country code */
function hasCountryPricing(raw: APIProduct, country: string): boolean {
  // Check product-level country pricing
  const hasProductCountry = (raw.productcountries ?? []).some(
    (pc) => pc.isactive && pc.countrycode === country,
  );
  if (hasProductCountry) return true;

  // Check variant-level pricing
  const hasVariantCountry = (raw.productvariants ?? []).some(
    (v) => v.isactive && v.pricing.some((p) => p.isactive && p.countrycode === country),
  );
  return hasVariantCountry;
}

// ---- Public API -----------------------------------------------------------

/**
 * Fetch all products from the catalogue.
 * @param country – ISO country code (e.g. 'CA', 'US') used to pick the right pricing.
 * Only products with pricing for the given country are returned.
 */
export async function fetchAllProducts(country = 'CA'): Promise<Product[]> {
  const res = await api.get<unknown>('/api/v1/getAllProductLists');
  const list = unwrap<APIProduct[]>(res);
  const cc = country.toUpperCase();
  return (Array.isArray(list) ? list : [])
    .filter((p) => p.status?.toLowerCase() === 'active')
    .filter((p) => hasCountryPricing(p, cc))
    .map((p) => mapProduct(p, cc));
}

/**
 * Fetch a single product by its slug.
 */
export async function fetchProductBySlug(
  slug: string,
  country = 'CA',
): Promise<{ product: Product; reviews: Review[]; specifications: Record<string, string> } | null> {
  try {
    const raw = await api.get<APIProduct>(`/api/v1/getProductBySlug/${encodeURIComponent(slug)}`);
    // API returns { error, message } when not found
    if (!raw || (raw as unknown as { error: number }).error) return null;

    const cc = country.toUpperCase();

    // Only show product if it has pricing for this country
    if (!hasCountryPricing(raw, cc)) return null;

    const product = mapProduct(raw, cc);

    // Build specifications from productattributes
    const specifications: Record<string, string> = {};
    if (raw.productattributes) {
      for (const attr of raw.productattributes) {
        // `!== false` rather than a truthy test: the list endpoints omit
        // isactive/sortorder entirely, having already filtered and sorted.
        if (attr.isactive === false) continue;
        const values = attr.attributevalues
          .filter((v) => v.isactive !== false)
          .sort((a, b) => (a.sortorder ?? 0) - (b.sortorder ?? 0))
          .map((v) => v.value)
          .join(', ');
        if (values) specifications[attr.attributename] = values;
      }
    }
    if (raw.warranty) specifications['Warranty'] = raw.warranty;
    product.specifications = specifications;

    // Map reviews
    const reviews: Review[] = (raw.reviews ?? []).map((r) => ({
      id: String(r.reviewid),
      productId: String(raw.productid),
      author: r.user
        ? [r.user.firstname, r.user.lastname].filter(Boolean).join(' ') || 'Anonymous'
        : 'Anonymous',
      avatar: r.user?.avatar || '',
      rating: r.rating,
      title: r.title || '',
      comment: r.comment || '',
      date: r.createdat,
      helpful: 0,
      verified: r.isverified,
    }));

    return { product, reviews, specifications };
  } catch {
    return null;
  }
}

// ---- Product → sellerId lookup --------------------------------------------
// The `GET /api/v1/cart/:userid` response does NOT include `sellerid` on cart
// items (see cart response inspection in July 2026). To build the multi-seller
// shipping payload we resolve product → seller via
// `GET /api/v1/getProductDetailsByCust/:productid`, which does return
// `sellerid` on the payload. Results are cached in-memory for the tab session
// so we only pay one round-trip per unique product.

const productSellerCache = new Map<number, number>();
const inflightSellerLookups = new Map<number, Promise<number | null>>();

interface APIProductSellerDetail {
  productid?: number;
  sellerid?: number;
  errorCode?: number;
  message?: string;
}

/**
 * Fetch the `sellerid` for a single product. Cached across calls.
 * Returns `null` if the product is missing or the endpoint fails — callers
 * should fall back to whatever seller they already have.
 */
export async function fetchProductSellerId(productId: number): Promise<number | null> {
  if (!Number.isFinite(productId)) return null;
  if (productSellerCache.has(productId)) return productSellerCache.get(productId)!;

  const existing = inflightSellerLookups.get(productId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const raw = await api.get<APIProductSellerDetail>(
        `/api/v1/getProductDetailsByCust/${productId}`,
      );
      const sellerId =
        raw && typeof raw.sellerid === 'number' ? raw.sellerid : null;
      if (sellerId != null) productSellerCache.set(productId, sellerId);
      return sellerId;
    } catch {
      return null;
    } finally {
      inflightSellerLookups.delete(productId);
    }
  })();

  inflightSellerLookups.set(productId, promise);
  return promise;
}

/**
 * Resolve seller ids for many products in parallel (with the cache above).
 * Returns a map keyed by productId — entries with no known seller are omitted.
 */
export async function fetchProductSellerIds(
  productIds: readonly number[],
): Promise<Map<number, number>> {
  const unique = Array.from(new Set(productIds.filter((id) => Number.isFinite(id))));
  const results = await Promise.all(
    unique.map(async (id) => [id, await fetchProductSellerId(id)] as const),
  );
  const map = new Map<number, number>();
  for (const [id, sellerId] of results) {
    if (sellerId != null) map.set(id, sellerId);
  }
  return map;
}
