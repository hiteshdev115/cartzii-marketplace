'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCountryFromLocale, buildCountryPath, getCountryConfig } from '@/config/countries';
import { fetchProductBySlug } from '@/lib/api/products';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductInfo } from '@/components/products/ProductInfo';
import { ProductTabs } from '@/components/products/ProductTabs';
import { ReviewForm } from '@/components/products/ReviewForm';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product, Review } from '@/types';

interface ProductDetailClientProps {
  slug: string;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const locale = useLocale();
  const t = useTranslations('Products');
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImages, setActiveImages] = useState<string[]>([]);

  useEffect(() => {
    const country = getCountryFromLocale(locale);
    setLoading(true);
    fetchProductBySlug(slug, country)
      .then((result) => {
        if (!result) {
          setNotFound(true);
        } else {
          setProduct(result.product);
          setReviews(result.reviews);
          setActiveImages(result.product.images);
        }
      })
      .finally(() => setLoading(false));
  }, [slug, locale]);

  const handleVariantChange = useCallback((images: string[], price: number, salePrice?: number, discount?: number) => {
    if (images.length > 0) setActiveImages(images);
    setProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        price,
        salePrice,
        discount,
        onSale: salePrice !== undefined && salePrice < price,
      };
    });
  }, []);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
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
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-6">
        <ProductGallery images={activeImages} productName={product.name} />
        <ProductInfo product={product} onVariantChange={handleVariantChange} />
      </div>
      <div className="mt-12">
        <ProductTabs product={product} reviews={reviews} />
        <ReviewForm productId={product.id} />
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
