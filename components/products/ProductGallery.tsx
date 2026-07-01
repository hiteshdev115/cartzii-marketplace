'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [prevImages, setPrevImages] = useState(images);

  // Reset to first image when the images array changes (e.g. variant switch)
  if (prevImages !== images) {
    setPrevImages(images);
    setSelected(0);
  }

  const prev = () => setSelected((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setSelected((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-4 min-w-0">
      {/* Main image with arrows */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 group">
        <Image
          src={images[selected]}
          alt={`${productName} - view ${selected + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center transition-opacity hover:bg-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center transition-opacity hover:bg-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    selected === i ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                  )}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                'relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-colors',
                selected === i ? 'border-primary' : 'border-transparent hover:border-slate-300'
              )}
              aria-label={`View image ${i + 1}`}
              aria-current={selected === i ? 'true' : undefined}
            >
              <Image src={img} alt={`${productName} thumbnail ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
