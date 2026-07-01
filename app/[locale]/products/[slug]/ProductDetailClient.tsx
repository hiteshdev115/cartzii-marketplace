'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCountryFromLocale, buildCountryPath, getCountryConfig } from '@/config/countries';
import { fetchProductBySlug } from '@/lib/api/products';
import { fetchProductReviews } from '@/lib/api/reviews';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductInfo, type VariantMeasurements } from '@/components/products/ProductInfo';
import { ProductTabs } from '@/components/products/ProductTabs';
import { ReviewForm } from '@/components/products/ReviewForm';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types';
import type { ReviewAPIItem, ReviewStats } from '@/lib/api/reviews';
import { useAuthStore } from '@/stores/authStore';

interface ProductDetailClientProps {
  slug: string;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const locale = useLocale();
  const t = useTranslations('Products');
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewAPIItem[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImages, setActiveImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('description');
  const fetchIdRef = useRef(0);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    const country = getCountryFromLocale(locale);
    const id = ++fetchIdRef.current;
    let cancelled = false;

    fetchProductBySlug(slug, country)
      .then(async (result) => {
        if (cancelled || id !== fetchIdRef.current) return;
        if (!result) {
          setNotFound(true);
          return;
        }
        setProduct(result.product);
        setActiveImages(result.product.images);

        // Fetch reviews from the dedicated endpoint
        try {
          const productId = parseInt(result.product.id, 10);
          if (!isNaN(productId)) {
            const reviewData = await fetchProductReviews(productId);
            if (!cancelled && id === fetchIdRef.current) {
              setReviews(reviewData.reviews);
              setReviewStats(reviewData.stats);
            }
          }
        } catch {
          // Reviews fetch failed — leave empty, non-blocking
        }
      })
      .finally(() => {
        if (!cancelled && id === fetchIdRef.current) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, locale]);

  const handleReviewPosted = useCallback((newReview: ReviewAPIItem) => {
    setReviews((prev) => [newReview, ...prev]);
    setReviewStats((prev) => ({
      ...prev,
      totalReviews: prev.totalReviews + 1,
    }));
  }, []);

  const scrollToReviews = useCallback(() => {
    setActiveTab('reviews');
    setTimeout(() => {
      document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  const scrollToWriteReview = useCallback(() => {
    // If user already reviewed, go to reviews list instead
    const alreadyReviewed = reviews.some((r) => String(r.userid) === String(userId));
    setActiveTab('reviews');
    setTimeout(() => {
      const target = alreadyReviewed ? 'reviews-section' : 'review-form';
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [reviews, userId]);

  const handleVariantChange = useCallback((
    images: string[],
    price: number,
    salePrice?: number,
    discount?: number,
    measurements?: VariantMeasurements | null,
  ) => {
    if (images.length > 0) setActiveImages(images);
    setProduct((prev) => {
      if (!prev) return prev;
      // When the variant has a full set of measurements, override the product
      // values so the specifications tab reflects the current selection.
      // Otherwise leave the product-level values untouched (fallback).
      const measurementPatch = measurements
        ? {
            weight: measurements.weight,
            weightUnit: measurements.weightUnit,
            length: measurements.length,
            width: measurements.width,
            height: measurements.height,
            dimensionUnit: measurements.dimensionUnit,
          }
        : {};
      return {
        ...prev,
        price,
        salePrice,
        discount,
        onSale: salePrice !== undefined && salePrice < price,
        ...measurementPatch,
      };
    });
  }, []);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (notFound || !product) {
    return (
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
        <p className="text-slate-600">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  const countryConfig = getCountryConfig(locale);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: product.images[0],
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.salePrice || product.price,
      priceCurrency: countryConfig.currency,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(product.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb
        items={[
          { label: t('allProducts'), href: buildCountryPath(locale, '/products') },
          { label: product.name },
        ]}
      />
      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mt-6">
        <ProductGallery images={activeImages} productName={product.name} />
        <ProductInfo product={product} onVariantChange={handleVariantChange} onShowReviews={scrollToReviews} onWriteReview={scrollToWriteReview} />
      </div>
      <div className="mt-8 sm:mt-12 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8">
        <ProductTabs product={product} reviews={reviews} stats={reviewStats} activeTab={activeTab} onTabChange={setActiveTab} />
        <ReviewForm productId={parseInt(product.id, 10)} reviews={reviews} onReviewPosted={handleReviewPosted} />
      </div>
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-64 bg-slate-200 rounded mb-6" />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-6">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-3 mt-6">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-12" />
          </div>
        </div>
      </div>
      <div className="mt-12 space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
