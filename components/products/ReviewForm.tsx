'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ReviewFormProps {
  productId: string;
}

export function ReviewForm({ productId }: ReviewFormProps) {
  const t = useTranslations('ProductDetail');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && title && comment) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 bg-green-50 rounded-xl text-center">
        <p className="text-green-700 font-semibold">{t('reviewSuccess')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6 p-6 bg-slate-50 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">{t('writeReview')}</h3>

      <div>
        <label className="label">{t('reviewFormRating')}</label>
        <StarRating value={rating} readonly={false} onChange={setRating} size="lg" />
      </div>

      <Input
        label={t('reviewFormTitle')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
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

      <Button type="submit">{t('reviewSubmit')}</Button>
    </form>
  );
}
