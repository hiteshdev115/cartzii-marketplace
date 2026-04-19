'use client';

import { useTranslations } from 'next-intl';
import { testimonials } from '@/lib/mockData';
import { StarRating } from '@/components/ui/StarRating';
import Image from 'next/image';

export function Testimonials() {
  const t = useTranslations('Home');

  return (
    <section className="py-16 bg-surface-secondary">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900">{t('testimonials')}</h2>
          <p className="mt-2 text-slate-500">{t('testimonialsSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="card p-6">
              <StarRating value={testimonial.rating} size="sm" />
              <blockquote className="mt-4 text-slate-600 text-sm leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{testimonial.author}</p>
                  <p className="text-xs text-slate-500">{testimonial.location}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
