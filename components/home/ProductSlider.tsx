'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types';

interface ProductSliderProps {
  products: Product[];
  loading: boolean;
  label: string;
}

export function ProductSlider({ products, loading, label }: ProductSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const trackId = useId();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateControls = () => {
      setCanScrollLeft(track.scrollLeft > 1);
      setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
    };
    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    for (const child of Array.from(track.children)) observer.observe(child);
    track.addEventListener('scroll', updateControls, { passive: true });
    const frame = requestAnimationFrame(updateControls);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener('scroll', updateControls);
    };
  }, [products, loading]);

  function scroll(direction: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * track.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-3">
        <button
          type="button"
          aria-label={`Previous products: ${label}`}
          title="Previous products"
          aria-controls={trackId}
          disabled={loading || !canScrollLeft}
          onClick={() => scroll(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Next products: ${label}`}
          title="Next products"
          aria-controls={trackId}
          disabled={loading || !canScrollRight}
          onClick={() => scroll(1)}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={trackRef}
        id={trackId}
        role="region"
        aria-label={label}
        aria-busy={loading}
        tabIndex={0}
        dir="ltr"
        className="grid grid-flow-col auto-cols-[calc((100%-12px)/2)] sm:auto-cols-[calc((100%-32px)/3)] lg:auto-cols-[calc((100%-48px)/4)] xl:auto-cols-[calc((100%-80px)/6)] gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {loading
          ? Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="min-w-0 snap-start">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((product) => (
              <div key={product.id} className="min-w-0 snap-start">
                <ProductCard product={product} compact />
              </div>
            ))}
      </div>
    </div>
  );
}