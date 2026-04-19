'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildCountryPath } from '@/config/countries';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { Star } from 'lucide-react';
import { fetchUserReviews } from '@/lib/api/reviews';
import type { ReviewAPIItem } from '@/lib/api/reviews';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import Link from 'next/link';

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

function buildImageUrl(filename: string): string {
  if (!filename) return '/assets/placeholder-product.png';
  if (filename.startsWith('http')) return filename;
  return `${IMAGE_CDN_URL}/${filename}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getProductImage(review: ReviewAPIItem): string {
  const imgs = review.products?.productimages;
  if (!imgs || imgs.length === 0) return '/assets/placeholder-product.png';
  const thumb = imgs.find((i) => i.imagetype === 'thumbnail') ?? imgs[0];
  return buildImageUrl(thumb.imageurl);
}

function getProductName(review: ReviewAPIItem): string {
  return review.products?.productname || `Product #${review.productid}`;
}

function getProductSlug(review: ReviewAPIItem): string | null {
  return review.products?.slug || null;
}

export function ReviewsContent() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const userId = useAuthStore((s) => s.userId);
  const [reviews, setReviews] = useState<ReviewAPIItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchUserReviews(userId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildCountryPath(locale, '/account') },
          { label: t('reviews') },
        ]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('reviews')}</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">You haven&apos;t written any reviews yet.</p>
          <Link
            href={buildCountryPath(locale, '/products')}
            className="inline-block mt-4 text-primary font-medium hover:underline"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const slug = getProductSlug(review);
            const productLink = slug
              ? buildCountryPath(locale, `/products/${slug}`)
              : null;

            return (
              <article
                key={review.reviewid}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <div className="flex gap-4">
                  {/* Product image */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                    {productLink ? (
                      <Link href={productLink}>
                        <Image
                          src={getProductImage(review)}
                          alt={getProductName(review)}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>
                    ) : (
                      <Image
                        src={getProductImage(review)}
                        alt={getProductName(review)}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>

                  {/* Review details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {productLink ? (
                          <Link
                            href={productLink}
                            className="font-semibold text-slate-900 hover:text-primary transition-colors truncate block"
                          >
                            {getProductName(review)}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-900 truncate block">
                            {getProductName(review)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={review.rating} size="sm" />
                      <span className="text-xs text-slate-500">
                        {formatDate(review.reviewdate || review.createdat)}
                      </span>
                    </div>

                    {review.reviewtitle && (
                      <h3 className="font-medium text-sm text-slate-900 mt-2">
                        {review.reviewtitle}
                      </h3>
                    )}
                    <p className="text-sm text-slate-600 mt-1 line-clamp-3">
                      {review.reviewtext}
                    </p>

                    {/* Review media thumbnails */}
                    {review.media && review.media.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {review.media.map((m) => (
                          <div
                            key={m.mediaid}
                            className="relative w-12 h-12 rounded overflow-hidden border border-gray-200"
                          >
                            {m.mediatype === 'video' ? (
                              <video
                                src={m.mediaurl}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Image
                                src={m.mediaurl}
                                alt="Review"
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
