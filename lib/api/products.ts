import { api } from './client';
import type { Product, ProductVariant, DetailVariant, Review } from '@/types';

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

interface APIVariantPricing {
  pricingid: number;
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
}

interface APIProductCountry {
  id: number;
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

interface APIAttributeValue {
  valueid: number;
  value: string;
  colorcode: string | null;
  sortorder: number;
  isactive: boolean;
}

interface APIProductAttribute {
  attributeid: number;
  attributename: string;
  sortorder: number;
  isactive: boolean;
  attributevalues: APIAttributeValue[];
}

interface APICategory {
  categoryid: number;
  categoryname: string;
  categorydescription: string;
  categoryslug: string;
  categoryimage: string | null;
}

interface APIProduct {
  productid: number;
  sellerid: number;
  categoryid: number;
  sku: string;
  slug: string;
  productname: string;
  productdescription: string;
  stockquantity: number;
  shortdescription: string;
  video: string | null;
  shippinginfo: string | null;
  warranty: string | null;
  tags: string | null;
  status: string;
  releaseat: string | null;
  createdat: string;
  updatedat: string;
  productimages: APIProductImage[];
  productvariants: APIVariant[];
  productcountries: APIProductCountry[];
  categoryName?: string;
  averageRating?: number | string | null;
  // Fields present only in getProductBySlug response
  reviews?: APIReview[];
  reviewCount?: number;
  productattributes?: APIProductAttribute[];
  category?: APICategory;
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
    const pricing = pickPricing(v, country);
    const vPrice = pricing ? parseFloat(pricing.price) : 0;
    const vDiscountPrice = pricing ? parseFloat(pricing.discountprice) : undefined;
    const origPrice = vDiscountPrice && vDiscountPrice > vPrice ? vDiscountPrice : vPrice;
    const saleP = vDiscountPrice && vDiscountPrice > vPrice ? vPrice : undefined;
    let disc: number | undefined;
    if (pricing?.discount) disc = parseFloat(pricing.discount);
    if (!disc && saleP !== undefined && origPrice > 0) {
      disc = Math.round(((origPrice - saleP) / origPrice) * 100);
    }

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
    };
  });
}

function mapProduct(raw: APIProduct, country: string): Product {
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
      }
    : countryPricing && parseFloat(countryPricing.price) > 0
      ? {
          price: countryPricing.price,
          discountprice: countryPricing.discountprice,
          discount: countryPricing.discount,
          currencycode: countryPricing.currencycode,
        }
      : undefined;

  const price = priceSrc ? parseFloat(priceSrc.price) : 0;
  const discountPrice = priceSrc ? parseFloat(priceSrc.discountprice) : undefined;

  // The API uses `price` as the sale/current price and `discountprice` as the
  // original/compare-at price (higher value). Map to frontend conventions:
  //   product.price      = original / compare-at (higher)
  //   product.salePrice  = current / sale (lower)
  const originalPrice =
    discountPrice && discountPrice > price ? discountPrice : price;
  const salePrice =
    discountPrice && discountPrice > price ? price : undefined;

  // Calculate discount percentage: prefer API value, otherwise derive from prices
  let discount = priceSrc?.discount ? parseFloat(priceSrc.discount) : undefined;
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

  // -- brand from variant attributes ----------------------------------------
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

  // -- stock from variants --------------------------------------------------
  const totalStock =
    activeVariants.length > 0
      ? activeVariants.reduce((sum, v) => sum + v.stockquantity, 0)
      : raw.stockquantity;

  // -- currency from pricing ------------------------------------------------
  const currency = priceSrc?.currencycode || 'CAD';

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
    categorySlug: raw.category?.categoryslug || '',
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
    isFeatured: false,
    isBestSeller: false,
    specifications: {},
    createdAt: raw.createdat,
    detailVariants: buildDetailVariants(activeVariants, country),
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
        if (!attr.isactive) continue;
        const values = attr.attributevalues
          .filter((v) => v.isactive)
          .sort((a, b) => a.sortorder - b.sortorder)
          .map((v) => v.value)
          .join(', ');
        if (values) specifications[attr.attributename] = values;
      }
    }
    if (raw.shippinginfo) specifications['Shipping'] = raw.shippinginfo;
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
