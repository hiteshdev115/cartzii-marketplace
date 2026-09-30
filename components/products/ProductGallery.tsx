'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

// How much the image scales up under the cursor. 2× is the Amazon default —
// enough to read fine detail (stitching, print quality) without cropping
// the image so hard that the buyer loses their bearings.
const ZOOM_SCALE = 2;

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [prevImages, setPrevImages] = useState(images);
  // Cursor position as PERCENTAGES of the image box. Fed to transform-origin
  // so the point under the cursor stays anchored while the image scales up
  // around it — the natural "loupe" behaviour buyers expect.
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset to first image when the images array changes (e.g. variant switch)
  if (prevImages !== images) {
    setPrevImages(images);
    setSelected(0);
  }

  const prev = () => setSelected((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setSelected((i) => (i === images.length - 1 ? 0 : i + 1));

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width)  * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top)  / rect.height) * 100));
    setZoomOrigin({ x, y });
  }

  // Fine-pointer only: touch devices don't have a hover state, and enabling
  // this on them would leave the image scaled up after every tap.
  function handleEnter(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
    setIsZoomed(true);
  }

  return (
    <div className="space-y-4 min-w-0">
      {/* Main image with arrows */}
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 group cursor-zoom-in"
        onPointerEnter={handleEnter}
        onPointerLeave={() => setIsZoomed(false)}
        onMouseMove={handleMove}
      >
        <Image
          src={images[selected]}
          alt={`${productName} - view ${selected + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          // `origin-center` is overridden by the inline transform-origin
          // below when zoomed. `will-change-transform` hints the browser
          // to promote the element onto its own layer, so the scale
          // animation stays at 60fps even on modest hardware.
          className="object-cover transition-transform duration-200 will-change-transform"
          style={{
            transform:       isZoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
          priority
          draggable={false}
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
