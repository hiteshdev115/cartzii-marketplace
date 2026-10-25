'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  // Fullscreen "showcase" lightbox. Opened by clicking the main image or a
  // thumbnail — the shopper reviews each image at full size then closes with
  // X, the backdrop, or Esc. Keyboard arrows move between images while open.
  const [isLightboxOpen, setLightboxOpen] = useState(false);

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

  // Keyboard controls + body scroll lock while the lightbox is open.
  // Deferred setup through a microtask so React doesn't see state-mutating
  // calls synchronously in the effect body (lint rule).
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     { setLightboxOpen(false); }
      else if (e.key === 'ArrowLeft')  { prev(); }
      else if (e.key === 'ArrowRight') { next(); }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // prev/next are stable closures over setSelected which is stable; no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen]);

  return (
    <div className="space-y-4 min-w-0">
      {/* Main image with arrows */}
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 group cursor-zoom-in"
        onPointerEnter={handleEnter}
        onPointerLeave={() => setIsZoomed(false)}
        onMouseMove={handleMove}
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setLightboxOpen(true); }}
        aria-label="Open image gallery"
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
            {/* stopPropagation so clicking an inner control doesn't ALSO
                open the lightbox — the outer div is a click target too. */}
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center transition-opacity hover:bg-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
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
                  onClick={(e) => { e.stopPropagation(); setSelected(i); }}
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
              onClick={() => { setSelected(i); setLightboxOpen(true); }}
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

      {/* ── Fullscreen showcase gallery ──
          A plain overlay (not a Portal) is enough because the parent page
          is static below it and `fixed inset-0 z-[100]` sits above every
          header/sidebar in the app. Backdrop click closes; the inner
          figure stops propagation so clicking the image or arrows doesn't
          dismiss. */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image gallery`}
        >
          {/* Close */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tabular-nums">
              {selected + 1} / {images.length}
            </div>
          )}

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* The image. `object-contain` keeps the aspect ratio so the
              shopper sees the whole product, no cropping. */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selected]}
              alt={`${productName} - view ${selected + 1}`}
              fill
              sizes="100vw"
              className="object-contain select-none"
              draggable={false}
              priority
            />
          </div>

          {/* Dot indicators mirror the main view so the lightbox still
              reads as the same gallery, just bigger. */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    selected === i ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/70 w-2'
                  )}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
