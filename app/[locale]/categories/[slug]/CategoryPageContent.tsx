'use client';

import { useState, useEffect, useCallback } from 'react';
import { resolvePrice } from '@/lib/pricing';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { ShoppingCart, Heart, SlidersHorizontal, ChevronDown, PackageSearch } from 'lucide-react';
import { fetchCategoryProductsBySlug } from '@/lib/api';
import type { CategoryProduct, CategoryProductCountry, CategoryVariantPricing, CategoryProductsResult } from '@/lib/api';
import { buildPath, getCountryFromLocale, currentCurrency } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import { useHydrated } from '@/hooks/useHydration';
import { Pagination } from '@/components/ui/Pagination';
import type { Product } from '@/types';

const IMAGE_CDN =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

function buildProductImageUrl(filename: string | undefined): string {
  if (!filename) return '/assets/placeholder-product.png';
  if (filename.startsWith('http')) return filename;
  return `${IMAGE_CDN}/${filename}`;
}

/** Pick the best variant pricing entry for the current country */
function pickVariantPricing(
  pricingList: CategoryVariantPricing[],
  countryCode: string,
): CategoryVariantPricing | undefined {
  const active = (pricingList ?? []).filter((p) => p.isactive);
  return active.find((p) => p.countrycode === countryCode) ?? active[0];
}

/** Pick the best product-level country pricing entry */
function pickCountryPricing(
  productcountries: CategoryProductCountry[],
  countryCode: string,
): CategoryProductCountry | undefined {
  const active = (productcountries ?? []).filter((pc) => pc.isactive);
  return active.find((pc) => pc.countrycode === countryCode) ?? active[0];
}

/**
 * Mirrors the exact pricing logic from products.ts mapProduct():
 * 1. Try first active variant's pricing for the country
 * 2. Fall back to productcountries
 * discountprice is the crossed-out original; price is the selling price.
 */
function resolvePricing(item: CategoryProduct, countryCode: string) {
  const activeVariants = (item.productvariants ?? []).filter((v) => v.isactive);
  const firstVariant = activeVariants[0];
  const variantPricing = firstVariant
    ? pickVariantPricing(firstVariant.pricing, countryCode)
    : undefined;

  const countryPricing = pickCountryPricing(item.productcountries, countryCode);

  const hasVariantPrice = variantPricing && parseFloat(variantPricing.price) > 0;

  const priceSrc = hasVariantPrice
    ? variantPricing!
    : countryPricing && parseFloat(countryPricing.price) > 0
      ? countryPricing
      : undefined;

  if (!priceSrc) {
    return { origPrice: 0, salePrice: undefined as number | undefined, discountPct: 0, currency: 'USD' };
  }

  // Shared resolver — see lib/pricing.ts. The listing carried the same
  // inverted assumption as the product page, so a discounted product showed
  // its full price here too.
  const { origPrice, salePrice, discountPct, currency } = resolvePrice(priceSrc);
  return { origPrice, salePrice, discountPct, currency: currency || currentCurrency };
}

function getPrimaryImage(item: CategoryProduct): string {
  const images = item.productimages ?? [];
  const primary = images.find((img) => img.isprimary && img.isactive !== false)
    ?? images.find((img) => img.isactive !== false)
    ?? images[0];
  return buildProductImageUrl(primary?.imageurl);
}

function mapToProduct(item: CategoryProduct, countryCode: string): Product {
  const { origPrice, salePrice, discountPct, currency } = resolvePricing(item, countryCode);
  const rating = item.averageRating != null ? parseFloat(String(item.averageRating)) || 0 : 0;
  return {
    id: String(item.productid),
    name: item.productname,
    slug: item.slug,
    description: item.shortdescription || '',
    shortDescription: item.shortdescription || '',
    price: origPrice,
    salePrice,
    discount: discountPct || undefined,
    currency,
    images: [getPrimaryImage(item)],
    category: item.categoryName || '',
    categorySlug: '',
    brand: '',
    rating,
    reviewCount: item.reviewCount || 0,
    sku: item.sku || '',
    inStock: (item.stockquantity ?? 1) > 0,
    stockCount: item.stockquantity ?? 1,
    tags: item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    isNew: false,
    onSale: salePrice !== undefined,
    isFeatured: false,
    isBestSeller: false,
    specifications: {},
    createdAt: '',
    // TODO: PR 2B follow-up — API missing sellerid on some category responses.
    sellerId: item.sellerid ?? 0,
    sellerName: item.seller?.storename ?? null,
  };
}

// ---- Skeleton card -------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
      <div className="aspect-square bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-8 bg-slate-200 rounded-xl mt-3" />
      </div>
    </div>
  );
}

// ---- Product card --------------------------------------------------------
interface ProductCardItemProps {
  item: CategoryProduct;
  countryCode: string;
}

function ProductCardItem({ item, countryCode }: ProductCardItemProps) {
  const locale = useLocale();
  const hydrated = useHydrated();
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(item.productid));
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const openLoginModal = useLoginModalStore((s) => s.open);

  const wishlisted = hydrated && isInWishlist;

  const imageUrl = getPrimaryImage(item);
  const { origPrice, salePrice, discountPct } = resolvePricing(item, countryCode);
  const hasSale = salePrice !== undefined;
  const rating = item.averageRating != null ? parseFloat(String(item.averageRating)) || 0 : 0;

  const handleAddToCart = () => {
    addToCart(mapToProduct(item, countryCode), 1, undefined, undefined, locale);
  };

  const handleWishlist = () => {
    if (!isAuthenticated || !userId) {
      openLoginModal();
      return;
    }
    toggleWishlist(userId, item.productid);
  };

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-100 hover:border-primary/20 transition-all duration-300">
      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover:text-slate-600'
          }`}
        />
      </button>

      {/* Discount badge */}
      {hasSale && discountPct > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          -{discountPct}%
        </span>
      )}

      {/* Image */}
      <Link href={buildPath(`/products/${item.slug}`)}>  
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          <Image
            src={imageUrl}
            alt={item.productname}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {item.categoryName && (
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1 truncate">
            {item.categoryName}
          </p>
        )}
        <Link href={buildPath(`/products/${item.slug}`)}>  
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 hover:text-primary transition-colors leading-snug">
            {item.productname}
          </h3>
        </Link>

        {/* Stars */}
        {(item.reviewCount ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`w-3 h-3 ${
                    s <= Math.round(rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200 fill-slate-200'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-slate-400">({item.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          {origPrice > 0 || hasSale ? (
            <>
              <span className="text-base font-bold text-primary">
                {formatPrice(salePrice ?? origPrice, locale)}
              </span>
              {hasSale && (
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(origPrice, locale)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-400">Price unavailable</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 hover:shadow-md active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      </div>
    </article>
  );
}

// ---- Main component ------------------------------------------------------

interface CategoryPageContentProps {
  slug: string;
  categoryName: string;
  categoryDescription?: string | null;
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const PAGE_SIZE = 20;

export function CategoryPageContent({ slug, categoryName, categoryDescription }: CategoryPageContentProps) {
  const locale = useLocale();
  const countryCode = getCountryFromLocale(locale).toUpperCase();

  const [data, setData] = useState<CategoryProductsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortby, setSortby] = useState('featured');

  const loadProducts = useCallback(
    async (pg: number, sort: string) => {
      setLoading(true);
      try {
        const result = await fetchCategoryProductsBySlug(slug, {
          countryCode,
          page: pg,
          limit: PAGE_SIZE,
          sortby: sort,
        });
        setData(result);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [slug, countryCode],
  );

  useEffect(() => {
    loadProducts(page, sortby);
  }, [page, sortby, loadProducts]);

  const handleSort = (value: string) => {
    setSortby(value);
    setPage(1);
  };

  const handlePageChange = (pg: number) => {
    setPage(pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const products = data?.products ?? [];
  const pagination = data?.pagination;
  const totalProducts = pagination?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* ---- Category header ---- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-slate-50 border border-primary/10 px-6 py-8 sm:px-10 sm:py-10">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {categoryName}
          </h1>
          {categoryDescription && (
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-xl">
              {categoryDescription}
            </p>
          )}
        </div>
        {/* Decorative blobs */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -right-4 -bottom-8 w-28 h-28 bg-primary/5 rounded-full blur-2xl" />
      </div>

      {/* ---- Sort bar ---- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">
            {loading ? 'Loading…' : `${totalProducts.toLocaleString()} results`}
          </span>
        </div>

        <div className="relative">
          <select
            value={sortby}
            onChange={(e) => handleSort(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium pl-3 pr-8 py-2 rounded-xl cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* ---- Grid ---- */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
            <PackageSearch className="w-9 h-9 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-700">No products found</p>
            <p className="text-sm text-slate-500 mt-1">
              There are no products in this category yet.
            </p>
          </div>
          <Link
            href={buildPath('/products')}
            className="mt-2 inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCardItem key={product.productid} item={product} countryCode={countryCode} />
            ))}
          </div>

          {/* ---- Pagination ---- */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
