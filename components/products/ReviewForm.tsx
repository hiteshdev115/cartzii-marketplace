'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImagePlus, X } from 'lucide-react';
import { postReview } from '@/lib/api/reviews';
import { useAuthStore } from '@/stores/authStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import type { ReviewAPIItem } from '@/lib/api/reviews';
import Image from 'next/image';

interface ReviewFormProps {
  productId: number;
  reviews?: ReviewAPIItem[];
  onReviewPosted?: (review: ReviewAPIItem) => void;
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm';
const MAX_FILES = 5;

export function ReviewForm({ productId, reviews = [], onReviewPosted }: ReviewFormProps) {
  const t = useTranslations('ProductDetail');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.userId);
  const openLoginModal = useLoginModalStore((s) => s.open);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const remaining = MAX_FILES - files.length;
    const newFiles = selected.slice(0, remaining);

    setFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated()) {
      openLoginModal();
      return;
    }

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    if (!comment.trim()) {
      setError('Please write your review.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('productid', String(productId));
      formData.append('rating', String(rating));
      if (title.trim()) formData.append('reviewtitle', title.trim());
      formData.append('reviewtext', comment.trim());
      for (const file of files) {
        formData.append('media', file);
      }

      const review = await postReview(formData);
      setSubmitted(true);
      onReviewPosted?.(review);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  // Hide form if the user has already reviewed this product
  const alreadyReviewed = reviews.some(
    (r) => String(r.userid) === String(userId),
  );
  if (alreadyReviewed) {
    return null;
  }

  if (submitted) {
    return (
      <div className="p-6 bg-green-50 rounded-xl text-center">
        <p className="text-green-700 font-semibold">{t('reviewSuccess')}</p>
      </div>
    );
  }

  return (
    <form id="review-form" onSubmit={handleSubmit} className="space-y-4 mt-6 p-6 bg-slate-50 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">{t('writeReview')}</h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="label">{t('reviewFormRating')}</label>
        <StarRating value={rating} readonly={false} onChange={setRating} size="lg" />
      </div>

      <Input
        label={t('reviewFormTitle')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Summarize your experience"
      />

      <div>
        <label htmlFor="review-comment" className="label">{t('reviewFormComment')}</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="input"
          required
          minLength={10}
        />
      </div>

      {/* Media upload */}
      <div>
        <label className="label">Photos / Videos (optional)</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
              {files[i]?.type.startsWith('video/') ? (
                <video src={src} className="w-full h-full object-cover" />
              ) : (
                <Image src={src} alt="" fill className="object-cover" sizes="80px" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-0.5 right-0.5 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-slate-600 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {files.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Add</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : t('reviewSubmit')}
      </Button>
    </form>
  );
}
