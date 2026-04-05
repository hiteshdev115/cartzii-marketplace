'use client';

import { Review } from '@/types';
import { StarRating } from '@/components/ui/StarRating';
import { ThumbsUp, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-slate-500 text-center py-8">No reviews yet. Be the first to write one!</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <article key={review.id} className="border-b border-gray-100 pb-6 last:border-none">
          <div className="flex items-start gap-3">
            <Image
              src={review.avatar}
              alt={review.author}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-900">{review.author}</span>
                {review.verified && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>
              <StarRating value={review.rating} size="sm" />
              <h4 className="font-semibold text-sm text-slate-900 mt-2">{review.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{review.comment}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-slate-400">{review.date}</span>
                <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Helpful ({review.helpful})
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
