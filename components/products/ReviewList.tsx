'use client';

import { useState } from 'react';
import { StarRating } from '@/components/ui/StarRating';
import { Star } from 'lucide-react';
import Image from 'next/image';
import type { ReviewAPIItem, ReviewStats } from '@/lib/api/reviews';

interface ReviewListProps {
  reviews: ReviewAPIItem[];
  stats: ReviewStats;
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

function ReviewerName({ users }: { users: ReviewAPIItem['users'] }) {
  const name = [users?.firstname, users?.lastname].filter(Boolean).join(' ');
  return <span className="font-semibold text-sm text-slate-900">{name || 'Anonymous'}</span>;
}

function MediaGallery({ media }: { media: ReviewAPIItem['media'] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!media || media.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 mt-3 flex-wrap">
        {media.map((m) =>
          m.mediatype === 'video' ? (
            <video
              key={m.mediaid}
              src={m.mediaurl}
              controls
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <button
              key={m.mediaid}
              type="button"
              onClick={() => setLightbox(m.mediaurl)}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary transition-shadow"
            >
              <Image
                src={m.mediaurl}
                alt="Review media"
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ),
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Review image"
        >
          <div className="relative max-w-3xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox}
              alt="Review media full"
              width={800}
              height={600}
              className="rounded-lg object-contain max-h-[80vh]"
            />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function RatingOverview({ stats }: { stats: ReviewStats }) {
  if (stats.totalReviews === 0) return null;

  // Build a 1–5 map from the distribution
  const distMap = new Map<number, number>();
  for (const d of stats.ratingDistribution) {
    const bucket = Math.round(d.rating);
    distMap.set(bucket, (distMap.get(bucket) || 0) + d.count);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
      {/* Average */}
      <div className="flex flex-col items-center justify-center min-w-[140px]">
        <span className="text-4xl font-bold text-slate-900">{stats.averageRating.toFixed(1)}</span>
        <StarRating value={stats.averageRating} size="md" />
        <span className="text-sm text-slate-600 mt-1">
          {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distMap.get(star) || 0;
          const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-right text-slate-600 flex items-center justify-end gap-0.5">
                {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-slate-500 text-xs">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewList({ reviews, stats }: ReviewListProps) {
  return (
    <div>
      <RatingOverview stats={stats} />

      {reviews.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No reviews yet. Be the first to write one!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <article key={review.reviewid} className="border-b border-gray-100 pb-6 last:border-none">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {(review.users?.firstname?.[0] || 'A').toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ReviewerName users={review.users} />
                  </div>
                  <StarRating value={review.rating} size="sm" />
                  {review.reviewtitle && (
                    <h4 className="font-semibold text-sm text-slate-900 mt-2">{review.reviewtitle}</h4>
                  )}
                  <p className="text-sm text-slate-600 mt-1">{review.reviewtext}</p>
                  <MediaGallery media={review.media} />
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-slate-500">
                      {formatDate(review.reviewdate || review.createdat)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
